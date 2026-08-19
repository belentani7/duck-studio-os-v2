// BELENTANI OMEGA ULTRA
// Autoría: Pedro Belentani
// Fecha: 2026-08-14
"use client";

import * as React from "react";
import { Mic, MicOff, Gauge, Zap, Activity, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

const MIN_DB = -60;
const MAX_DB = 0;

// Loudness targets (LUFS). Shown as static reference chips.
const TARGETS: { label: string; value: string; hint: string }[] = [
  { label: "Streaming", value: "-14 LUFS", hint: "Spotify · YouTube · Apple Music" },
  { label: "Podcast", value: "-16 LUFS", hint: "Padrão de fala" },
  { label: "Broadcast EBU R128", value: "-23 LUFS", hint: "TV europeia" },
  { label: "CD / Master", value: "-9 LUFS", hint: "Mestre dinâmico" },
  { label: "Club / Loud", value: "-8 LUFS", hint: "Pista de dança" },
];

interface AudioGuts {
  ctx: AudioContext;
  analyser: AnalyserNode;
  source: MediaStreamAudioSourceNode;
  stream: MediaStream;
}

function toDb(amplitude: number) {
  return 20 * Math.log10(Math.max(amplitude, 1e-7));
}

// LUFS-ish approximation: simplified RMS-based loudness (no K-weighting).
// Clearly labeled as an estimate in the UI.
function estimateLufs(rms: number) {
  if (rms <= 1e-7) return MIN_DB;
  // 10*log10(mean square) - 0.691 (K-weighting offset approximation)
  return 10 * Math.log10(rms * rms) - 0.691;
}

function dbToPct(db: number) {
  const pct = ((db - MIN_DB) / (MAX_DB - MIN_DB)) * 100;
  return Math.max(0, Math.min(100, pct));
}

export function PowerDetector() {
  const [running, setRunning] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [unsupported, setUnsupported] = React.useState(false);

  const [rmsDb, setRmsDb] = React.useState<number | null>(null);
  const [peakDb, setPeakDb] = React.useState<number | null>(null);
  const [peakHoldDb, setPeakHoldDb] = React.useState<number | null>(null);
  const [lufsEst, setLufsEst] = React.useState<number | null>(null);
  const [clip, setClip] = React.useState(false);

  const gutsRef = React.useRef<AudioGuts | null>(null);
  const rafRef = React.useRef<number | null>(null);
  const bufRef = React.useRef<Float32Array<ArrayBuffer> | null>(null);
  const peakHoldRef = React.useRef<{ value: number; ts: number } | null>(null);
  const clipTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const stop = React.useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    const guts = gutsRef.current;
    if (guts) {
      try {
        guts.source.disconnect();
        guts.analyser.disconnect();
        guts.stream.getTracks().forEach((t) => t.stop());
        guts.ctx.close();
      } catch {
        /* noop */
      }
      gutsRef.current = null;
    }
    if (clipTimerRef.current) {
      clearTimeout(clipTimerRef.current);
      clipTimerRef.current = null;
    }
    peakHoldRef.current = null;
    setRunning(false);
    setRmsDb(null);
    setPeakDb(null);
    setPeakHoldDb(null);
    setLufsEst(null);
    setClip(false);
  }, []);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    if (
      !window.AudioContext &&
      !(window as unknown as { webkitAudioContext?: unknown }).webkitAudioContext
    ) {
      setUnsupported(true);
    }
    return () => {
      stop();
    };
  }, [stop]);

  const start = React.useCallback(async () => {
    setError(null);
    if (
      !window.AudioContext &&
      !(window as unknown as { webkitAudioContext?: unknown }).webkitAudioContext
    ) {
      setUnsupported(true);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      const ctx = new Ctor();
      if (ctx.state === "suspended") {
        try {
          await ctx.resume();
        } catch {
          /* noop */
        }
      }
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.3;
      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);
      gutsRef.current = { ctx, analyser, source, stream };
      bufRef.current = new Float32Array(
        new ArrayBuffer(analyser.fftSize * Float32Array.BYTES_PER_ELEMENT)
      );
      setRunning(true);

      const loop = () => {
        const guts = gutsRef.current;
        const buf = bufRef.current;
        if (!guts || !buf) return;
        guts.analyser.getFloatTimeDomainData(buf);
        const n = buf.length;
        let sumSq = 0;
        let peakAbs = 0;
        for (let i = 0; i < n; i++) {
          const v = buf[i];
          sumSq += v * v;
          const a = Math.abs(v);
          if (a > peakAbs) peakAbs = a;
        }
        const rms = Math.sqrt(sumSq / n);
        const rmsDb = toDb(rms);
        const peakDb = toDb(peakAbs);
        const lufs = estimateLufs(rms);

        setRmsDb(rmsDb);
        setPeakDb(peakDb);
        setLufsEst(lufs);

        // Peak hold: keep max for 1.5s, then release
        const now = performance.now();
        let hold = peakHoldRef.current;
        if (!hold || peakDb > hold.value || now - hold.ts > 1500) {
          hold = { value: peakDb, ts: now };
          peakHoldRef.current = hold;
        }
        setPeakHoldDb(hold.value);

        // Clip indicator: peak > -0.3 dBFS
        if (peakDb > -0.3) {
          setClip(true);
          if (clipTimerRef.current) clearTimeout(clipTimerRef.current);
          clipTimerRef.current = setTimeout(() => setClip(false), 350);
        }

        rafRef.current = requestAnimationFrame(loop);
      };
      rafRef.current = requestAnimationFrame(loop);
    } catch (e) {
      const err = e as { name?: string; message?: string };
      if (err?.name === "NotAllowedError" || err?.name === "SecurityError") {
        setError(
          "Permissão de microfone negada. Autorize o acesso nas configurações do navegador para usar o medidor."
        );
      } else if (err?.name === "NotFoundError") {
        setError(
          "Nenhum microfone encontrado. Conecte um dispositivo de entrada de áudio."
        );
      } else {
        setError(err?.message || "Não foi possível iniciar a captura de áudio.");
      }
      setRunning(false);
    }
  }, []);

  const rmsPct = rmsDb != null ? dbToPct(rmsDb) : 0;
  const peakPct = peakDb != null ? dbToPct(peakDb) : 0;
  const holdPct = peakHoldDb != null ? dbToPct(peakHoldDb) : 0;

  return (
    <Card className="neon-border w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Gauge className="size-5 text-[oklch(0.85_0.32_145)]" />
          Detector de Potência · Medidor de Loudness
        </CardTitle>
        <CardDescription>
          RMS, pico com peak-hold, estimativa LUFS e indicador de clip em tempo
          real.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {unsupported && (
          <Alert variant="destructive">
            <AlertTitle>Indisponível</AlertTitle>
            <AlertDescription>
              Análise indisponível neste navegador.
            </AlertDescription>
          </Alert>
        )}

        {error && !unsupported && (
          <Alert variant="destructive">
            <AlertTitle>Erro de captura</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex flex-wrap items-center gap-2">
          {!running ? (
            <Button onClick={start} disabled={unsupported}>
              <Mic className="size-4" />
              Iniciar
            </Button>
          ) : (
            <Button onClick={stop} variant="destructive">
              <MicOff className="size-4" />
              Parar
            </Button>
          )}
          <div
            className={cn(
              "flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-medium transition-all",
              clip
                ? "border-destructive bg-destructive/20 text-destructive"
                : "border-border bg-card text-muted-foreground"
            )}
            role="status"
            aria-live="polite"
          >
            <Zap
              className={cn(
                "size-3.5",
                clip && "animate-pulse text-destructive"
              )}
            />
            {clip ? "CLIP!" : "Sem clip"}
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-[auto_1fr]">
          {/* Vertical meter */}
          <div className="flex items-end gap-3">
            <div className="relative h-56 w-10 overflow-hidden rounded-md border border-border bg-[oklch(0.2_0.014_200)]">
              {/* dB scale ticks */}
              {[0, -12, -24, -36, -48, -60].map((db) => {
                const pct = dbToPct(db);
                return (
                  <div
                    key={db}
                    className="absolute inset-x-0 flex items-center"
                    style={{ bottom: `${pct}%` }}
                  >
                    <div className="h-px w-full bg-[oklch(0.85_0.32_145/20%)]" />
                  </div>
                );
              })}
              {/* RMS fill */}
              <div
                className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[oklch(0.85_0.32_145/80%)] to-[oklch(0.85_0.32_145)] shadow-[0_0_18px_oklch(0.85_0.32_145/70%)] transition-[height] duration-75"
                style={{ height: `${rmsPct}%` }}
              />
              {/* Peak-hold marker */}
              {peakHoldDb != null && (
                <div
                  className="absolute inset-x-0 h-0.5 bg-white shadow-[0_0_6px_oklch(0.85_0.32_145)]"
                  style={{ bottom: `${holdPct}%` }}
                />
              )}
            </div>
            {/* Scale labels */}
            <div className="relative flex h-56 flex-col justify-between font-mono text-[10px] text-muted-foreground">
              <span>0</span>
              <span>-12</span>
              <span>-24</span>
              <span>-36</span>
              <span>-48</span>
              <span>-60</span>
            </div>
          </div>

          {/* Readouts */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Readout
              label="RMS"
              value={rmsDb != null ? `${rmsDb.toFixed(1)}` : "—"}
              unit="dBFS"
              icon={<Activity className="size-3.5" />}
              highlight={rmsDb != null && rmsDb > -6}
            />
            <Readout
              label="Pico"
              value={peakDb != null ? `${peakDb.toFixed(1)}` : "—"}
              unit="dBFS"
              icon={<Zap className="size-3.5" />}
              highlight={peakDb != null && peakDb > -0.3}
              danger={peakDb != null && peakDb > -0.3}
            />
            <Readout
              label="Pico hold"
              value={peakHoldDb != null ? `${peakHoldDb.toFixed(1)}` : "—"}
              unit="dBFS"
              icon={<Activity className="size-3.5" />}
            />
            <Readout
              label="LUFS (estimativa)"
              value={lufsEst != null ? `${lufsEst.toFixed(1)}` : "—"}
              unit="LUFS"
              icon={<Gauge className="size-3.5" />}
              hint="Aproximação por RMS — sem K-weighting"
            />
            <Readout
              label="Faixa dinâmica"
              value={
                rmsDb != null && peakDb != null
                  ? `${(peakDb - rmsDb).toFixed(1)}`
                  : "—"
              }
              unit="dB"
              icon={<Activity className="size-3.5" />}
            />
            <Readout
              label="Pico relativo"
              value={peakPct != null ? `${peakPct.toFixed(0)}` : "—"}
              unit="%"
              icon={<Activity className="size-3.5" />}
            />
          </div>
        </div>

        {/* Reference targets */}
        <section className="space-y-2">
          <h3 className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
            <AlertTriangle className="size-3.5" />
            Alvos de loudness (referência)
          </h3>
          <div className="flex flex-wrap gap-2">
            {TARGETS.map((t) => (
              <div
                key={t.label}
                className="rounded-md border border-border bg-card/60 px-3 py-1.5"
              >
                <div className="text-xs text-muted-foreground">{t.label}</div>
                <div className="font-mono text-sm font-semibold text-[oklch(0.85_0.32_145)]">
                  {t.value}
                </div>
                <div className="text-[10px] text-muted-foreground">{t.hint}</div>
              </div>
            ))}
          </div>
        </section>

        <p className="text-xs text-muted-foreground">
          Nota: a estimativa LUFS aproxima-se do RMS normalizado e não substitui
          medição K-weighted (EBU R128 / ITU-R BS.1770). Use como referência
          rápida de mixagem.
        </p>
      </CardContent>
    </Card>
  );
}

function Readout({
  label,
  value,
  unit,
  icon,
  hint,
  highlight,
  danger,
}: {
  label: string;
  value: string;
  unit: string;
  icon?: React.ReactNode;
  hint?: string;
  highlight?: boolean;
  danger?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-card/60 p-3 transition-all",
        danger
          ? "border-destructive/60 bg-destructive/10"
          : highlight
            ? "border-[oklch(0.85_0.32_145/50%)] neon-glow"
            : "border-border"
      )}
    >
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="mt-1 flex items-baseline gap-1">
        <span
          className={cn(
            "font-mono text-2xl font-bold tabular-nums",
            danger
              ? "text-destructive"
              : highlight
                ? "text-[oklch(0.85_0.32_145)] neon-text"
                : "text-foreground"
          )}
        >
          {value}
        </span>
        <span className="font-mono text-[10px] text-muted-foreground">
          {unit}
        </span>
      </div>
      {hint && <div className="mt-0.5 text-[10px] text-muted-foreground">{hint}</div>}
    </div>
  );
}

export default PowerDetector;
