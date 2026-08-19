// BELENTANI OMEGA ULTRA
// Autoría: Pedro Belentani
// Fecha: 2026-08-14
"use client";

import * as React from "react";
import { Mic, MicOff, Play, Square, Volume2, Activity, Gauge } from "lucide-react";
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

const NOTE_NAMES = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
] as const;

interface AudioCtxGuts {
  ctx: AudioContext;
  analyser: AnalyserNode;
  source: MediaStreamAudioSourceNode;
  stream: MediaStream;
}

interface DetectedPitch {
  freq: number;
  noteIdx: number;
  octave: number;
  cents: number;
}

/**
 * Autocorrelation pitch detection (no external libraries).
 * Based on the classic algorithm popularized by Chris Wilson (PitchDetect).
 * Returns the fundamental frequency in Hz, or null if signal is too weak.
 */
function autoCorrelate(buf: Float32Array, sampleRate: number): number | null {
  const SIZE = buf.length;
  let rms = 0;
  for (let i = 0; i < SIZE; i++) {
    const v = buf[i];
    rms += v * v;
  }
  rms = Math.sqrt(rms / SIZE);
  if (rms < 0.01) return null; // silence

  // Trim edges below threshold to reduce noise correlation
  const threshold = 0.2;
  let r1 = 0;
  let r2 = SIZE - 1;
  for (let i = 0; i < SIZE / 2; i++) {
    if (Math.abs(buf[i]) < threshold) {
      r1 = i;
      break;
    }
  }
  for (let i = 1; i < SIZE / 2; i++) {
    if (Math.abs(buf[SIZE - i]) < threshold) {
      r2 = SIZE - i;
      break;
    }
  }
  const buf2 = buf.subarray(r1, r2);
  const SIZE2 = buf2.length;
  if (SIZE2 < 4) return null;

  // Compute autocorrelation
  const c = new Float32Array(SIZE2);
  for (let i = 0; i < SIZE2; i++) {
    let sum = 0;
    for (let j = 0; j < SIZE2 - i; j++) {
      sum += buf2[j] * buf2[j + i];
    }
    c[i] = sum;
  }

  // Skip the initial descending portion
  let d = 0;
  while (d < SIZE2 - 1 && c[d] > c[d + 1]) d++;

  // Find the peak after d
  let maxval = -Infinity;
  let maxpos = -1;
  for (let i = d; i < SIZE2; i++) {
    if (c[i] > maxval) {
      maxval = c[i];
      maxpos = i;
    }
  }
  if (maxpos <= 0) return null;

  // Parabolic interpolation for sub-sample accuracy
  let T0 = maxpos;
  const x1 = c[T0 - 1] ?? 0;
  const x2 = c[T0];
  const x3 = c[T0 + 1] ?? 0;
  const a = (x1 + x3 - 2 * x2) / 2;
  const b = (x3 - x1) / 2;
  if (a !== 0) T0 = T0 - b / (2 * a);

  const freq = sampleRate / T0;
  if (freq < 60 || freq > 1500) return null; // out of useful range
  return freq;
}

function freqToPitch(freq: number): DetectedPitch {
  const noteNumFloat = 12 * (Math.log(freq / 440) / Math.log(2)) + 69;
  const midi = Math.round(noteNumFloat);
  const cents = Math.round((noteNumFloat - midi) * 100);
  const octave = Math.floor(midi / 12) - 1;
  const noteIdx = ((midi % 12) + 12) % 12;
  return { freq, noteIdx, octave, cents };
}

export function Tuner() {
  const [running, setRunning] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [unsupported, setUnsupported] = React.useState(false);
  const [pitch, setPitch] = React.useState<DetectedPitch | null>(null);
  const [refPlaying, setRefPlaying] = React.useState(false);

  const gutsRef = React.useRef<AudioCtxGuts | null>(null);
  const rafRef = React.useRef<number | null>(null);
  const bufRef = React.useRef<Float32Array<ArrayBuffer> | null>(null);
  const refCtxRef = React.useRef<AudioContext | null>(null);
  const refOscRef = React.useRef<OscillatorNode | null>(null);
  const refGainRef = React.useRef<GainNode | null>(null);

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
    setRunning(false);
    setPitch(null);
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
      // Reference tone cleanup
      const rctx = refCtxRef.current;
      if (rctx) {
        try {
          rctx.close();
        } catch {
          /* noop */
        }
      }
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
      analyser.smoothingTimeConstant = 0.6;
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
        const f = autoCorrelate(buf, guts.ctx.sampleRate);
        if (f) {
          setPitch(freqToPitch(f));
        } else {
          setPitch(null);
        }
        rafRef.current = requestAnimationFrame(loop);
      };
      rafRef.current = requestAnimationFrame(loop);
    } catch (e) {
      const err = e as { name?: string; message?: string };
      if (err?.name === "NotAllowedError" || err?.name === "SecurityError") {
        setError(
          "Permissão de microfone negada. Autorize o acesso nas configurações do navegador para usar o afinador."
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

  const toggleRefTone = React.useCallback(async () => {
    if (refPlaying) {
      const osc = refOscRef.current;
      const gain = refGainRef.current;
      const rctx = refCtxRef.current;
      if (osc && gain && rctx) {
        const now = rctx.currentTime;
        gain.gain.cancelScheduledValues(now);
        gain.gain.setValueAtTime(gain.gain.value, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.08);
        osc.stop(now + 0.12);
        refOscRef.current = null;
        refGainRef.current = null;
      }
      setRefPlaying(false);
      return;
    }
    try {
      if (!refCtxRef.current || refCtxRef.current.state === "closed") {
        const Ctor =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext;
        refCtxRef.current = new Ctor();
      }
      const rctx = refCtxRef.current;
      if (rctx.state === "suspended") {
        try {
          await rctx.resume();
        } catch {
          /* noop */
        }
      }
      const osc = rctx.createOscillator();
      const gain = rctx.createGain();
      osc.type = "sine";
      osc.frequency.value = 440;
      const now = rctx.currentTime;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.18, now + 0.05);
      osc.connect(gain).connect(rctx.destination);
      osc.start(now);
      refOscRef.current = osc;
      refGainRef.current = gain;
      setRefPlaying(true);
    } catch {
      setError("Não foi possível gerar o tom de referência.");
    }
  }, [refPlaying]);

  const cents = pitch?.cents ?? 0;
  const centsClamped = Math.max(-50, Math.min(50, cents));
  const inTune = Math.abs(cents) <= 5 && pitch != null;
  const meterPct = ((centsClamped + 50) / 100) * 100; // 0..100

  return (
    <Card className="neon-border w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Gauge className="size-5 text-[oklch(0.85_0.32_145)]" />
          Afinação · Tuner
        </CardTitle>
        <CardDescription>
          Detecção de altura por autocorrelação via Web Audio API.
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
          <Button
            onClick={toggleRefTone}
            variant={refPlaying ? "secondary" : "outline"}
          >
            {refPlaying ? (
              <Square className="size-4" />
            ) : (
              <Play className="size-4" />
            )}
            Tom de referência · A4 (440Hz)
          </Button>
          {refPlaying && (
            <Volume2 className="size-4 animate-pulse text-[oklch(0.85_0.32_145)]" />
          )}
        </div>

        {/* Main readout */}
        <div className="grid gap-4 sm:grid-cols-[auto_1fr] sm:items-center">
          <div className="flex items-baseline gap-2">
            <div
              className={cn(
                "font-mono text-6xl font-bold tabular-nums tracking-tight",
                inTune
                  ? "text-[oklch(0.85_0.32_145)] neon-text"
                  : "text-foreground"
              )}
              aria-live="polite"
            >
              {pitch ? `${NOTE_NAMES[pitch.noteIdx]}${pitch.octave}` : "—"}
            </div>
            <div className="font-mono text-sm text-muted-foreground">
              {pitch ? `${pitch.freq.toFixed(1)} Hz` : "0.0 Hz"}
            </div>
          </div>

          {/* Cents meter */}
          <div className="space-y-1">
            <div className="flex items-center justify-between font-mono text-xs text-muted-foreground">
              <span>♭ flat</span>
              <span
                className={cn(
                  "tabular-nums",
                  inTune
                    ? "text-[oklch(0.85_0.32_145)]"
                    : Math.abs(cents) > 25
                      ? "text-destructive"
                      : "text-foreground"
                )}
              >
                {pitch ? `${cents > 0 ? "+" : ""}${cents} cents` : "— cents"}
              </span>
              <span>♯ sharp</span>
            </div>
            <div
              className="relative h-3 w-full overflow-hidden rounded-full border border-border bg-[oklch(0.2_0.014_200)]"
              role="meter"
              aria-label="Desvio de afinação em cents"
              aria-valuemin={-50}
              aria-valuemax={50}
              aria-valuenow={cents}
            >
              {/* center marker */}
              <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-[oklch(0.85_0.32_145/40%)]" />
              {/* fill */}
              {pitch && (
                <div
                  className={cn(
                    "absolute inset-y-0 transition-all duration-100",
                    inTune
                      ? "bg-[oklch(0.85_0.32_145)] shadow-[0_0_12px_oklch(0.85_0.32_145/80%)]"
                      : "bg-destructive/80"
                  )}
                  style={{
                    left: cents >= 0 ? "50%" : `${meterPct}%`,
                    right: cents >= 0 ? `${100 - meterPct}%` : "50%",
                  }}
                />
              )}
              {/* scale ticks */}
              {[-25, 25].map((t) => (
                <div
                  key={t}
                  className="absolute inset-y-0 w-px bg-[oklch(0.85_0.32_145/20%)]"
                  style={{ left: `${((t + 50) / 100) * 100}%` }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Note pills */}
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
            <Activity className="size-3.5" />
            Nota detectada
          </div>
          <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-12">
            {NOTE_NAMES.map((n, i) => {
              const active = pitch?.noteIdx === i;
              return (
                <div
                  key={n}
                  className={cn(
                    "flex h-9 items-center justify-center rounded-md border font-mono text-sm transition-all",
                    active
                      ? "border-[oklch(0.85_0.32_145)] bg-[oklch(0.85_0.32_145/15%)] text-[oklch(0.85_0.32_145)] neon-glow"
                      : "border-border bg-card text-muted-foreground"
                  )}
                >
                  {n}
                </div>
              );
            })}
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Dica: permita o microfone, toque uma nota sustained e observe o
          medidor. Centro verde = afinado (±5 cents).
        </p>
      </CardContent>
    </Card>
  );
}

export default Tuner;
