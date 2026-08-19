// BELENTANI OMEGA ULTRA
// Autoría: Pedro Belentani
// Fecha: 2026-08-14
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const PHRASES = [
  "Sonhar é o primeiro compasso da criação.",
  "A persistência afina qualquer talento.",
  "Cada silêncio ensina algo sobre o som.",
  "Conhecer-se é masterizar a própria frequência.",
  "A disciplina é o metrônomo do gênio.",
  "Ouvir é metade da produção.",
  "Toda masterização começa por dentro.",
  "O erro de hoje é o groove de amanhã.",
  "Ritmo não se força — se encontra.",
  "Crie antes de julgar.",
];

const STATUS_STEPS = [
  "Inicializando núcleo...",
  "Carregando CRM...",
  "Calibrando plugins...",
  "Sincronizando versões...",
  "Abrindo portal do cliente...",
  "Pronto.",
];

export interface LoadingScreenProps {
  onComplete: () => void;
  durationMs?: number;
}

export function LoadingScreen({ onComplete, durationMs = 4200 }: LoadingScreenProps) {
  const [progress, setProgress] = React.useState(0);
  const [phraseIdx, setPhraseIdx] = React.useState(0);
  const [statusIdx, setStatusIdx] = React.useState(0);
  const [prefersReduced, setPrefersReduced] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const completedRef = React.useRef(false);

  // Mount + prefers-reduced-motion
  React.useEffect(() => {
    setMounted(true);
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setPrefersReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Progress + complete
  React.useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const elapsed = now - start;
      const pct = Math.min(100, (elapsed / durationMs) * 100);
      setProgress(pct);
      const idx = Math.min(
        STATUS_STEPS.length - 1,
        Math.floor((pct / 100) * STATUS_STEPS.length)
      );
      setStatusIdx(idx);
      if (pct >= 100) {
        if (!completedRef.current) {
          completedRef.current = true;
          window.setTimeout(onComplete, 280);
        }
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [durationMs, onComplete]);

  // Phrase rotation (skipped when reduced motion)
  React.useEffect(() => {
    if (prefersReduced) return;
    const id = window.setInterval(() => {
      setPhraseIdx((i) => (i + 1) % PHRASES.length);
    }, 1400);
    return () => window.clearInterval(id);
  }, [prefersReduced]);

  // Canvas oscilloscope
  React.useEffect(() => {
    if (!mounted || prefersReduced) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    const t0 = performance.now();
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(canvas.clientWidth * dpr));
      canvas.height = Math.max(1, Math.floor(canvas.clientHeight * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    const draw = (now: number) => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      const tt = (now - t0) / 1000;
      ctx.clearRect(0, 0, w, h);

      // radial vignette glow
      const g = ctx.createRadialGradient(
        w / 2,
        h / 2,
        0,
        w / 2,
        h / 2,
        Math.max(w, h) / 1.2
      );
      g.addColorStop(0, "oklch(0.24 0.06 150 / 70%)");
      g.addColorStop(1, "oklch(0.16 0.012 200 / 0%)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      // stacked oscilloscope waves
      const layers = 5;
      for (let l = 0; l < layers; l++) {
        ctx.beginPath();
        const amp = h * 0.16 * (1 - l * 0.13);
        const freq = 0.0042 + l * 0.0013;
        const speed = 0.55 + l * 0.18;
        const phase = l * 0.7;
        const yMid = h * (0.5 + (l - (layers - 1) / 2) * 0.045);
        for (let x = 0; x <= w; x += 2) {
          const y =
            yMid +
            Math.sin(x * freq + tt * speed + phase) * amp +
            Math.sin(x * freq * 2.1 + tt * speed * 1.3 + phase) * amp * 0.32 +
            Math.sin(x * freq * 0.5 + tt * speed * 0.55) * amp * 0.5;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        const alpha = 0.65 - l * 0.1;
        ctx.strokeStyle = `oklch(0.85 0.32 145 / ${alpha})`;
        ctx.lineWidth = 1.4;
        ctx.shadowBlur = 14;
        ctx.shadowColor = "oklch(0.85 0.32 145)";
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // spectrum bars at bottom
      const bars = 72;
      const barW = w / bars;
      for (let i = 0; i < bars; i++) {
        const v =
          0.5 +
          0.5 *
            Math.sin(i * 0.16 + tt * 2) *
            Math.sin(i * 0.05 + tt * 0.7 + i * 0.01);
        const bh = Math.abs(v) * h * 0.22;
        ctx.fillStyle = `oklch(0.85 0.32 145 / ${0.18 * v + 0.05})`;
        ctx.fillRect(i * barW + 1, h - bh, Math.max(1, barW - 2), bh);
      }

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [mounted, prefersReduced]);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Carregando DUCK STUDIO OS"
      className="fixed inset-0 z-[100] overflow-hidden bg-background"
    >
      {/* Animated waveform canvas */}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="absolute inset-0 h-full w-full opacity-70"
      />
      {/* Static gradient fallback for reduced motion */}
      {prefersReduced && (
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 50% 45%, oklch(0.24 0.07 150 / 70%) 0%, oklch(0.16 0.012 200 / 0%) 65%)",
          }}
        />
      )}

      {/* Grid overlay */}
      <div className="bg-grid absolute inset-0 opacity-50" aria-hidden="true" />

      {/* Scan line */}
      {!prefersReduced && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-px animate-duck-scan bg-[oklch(0.85_0.32_145/75%)] shadow-[0_0_18px_oklch(0.85_0.32_145/65%)]"
        />
      )}

      {/* Edge vignette */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,oklch(0.16_0.012_200/85%)_100%)]"
      />

      {/* Center content */}
      <div className="relative z-10 flex h-full w-full flex-col items-center justify-center px-6">
        <div className="relative mb-6 flex items-center justify-center">
          {!prefersReduced && (
            <div
              aria-hidden="true"
              className="absolute inset-0 -m-12 rounded-full opacity-60 blur-2xl"
              style={{
                background:
                  "conic-gradient(from 0deg, oklch(0.85 0.32 145 / 0%), oklch(0.85 0.32 145 / 55%), oklch(0.85 0.32 145 / 0%), oklch(0.7 0.2 190 / 35%), oklch(0.85 0.32 145 / 0%))",
                animation: "duck-spin 8s linear infinite",
              }}
            />
          )}
          <DuckEmblem reduced={prefersReduced} />
        </div>

        <h1 className="neon-text text-center text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
          DUCK STUDIO OS
        </h1>
        <p className="mt-2 text-center text-xs uppercase tracking-[0.25em] text-[oklch(0.85_0.32_145)] sm:text-sm">
          RnF · Ritmo &amp; Frequência
        </p>

        <div className="relative mt-8 h-9 w-full max-w-xl text-center">
          {PHRASES.map((p, i) => (
            <span
              key={i}
              aria-hidden={i !== phraseIdx}
              className={cn(
                "absolute inset-0 text-sm text-muted-foreground transition-opacity duration-500 sm:text-base",
                i === phraseIdx ? "opacity-100" : "opacity-0"
              )}
            >
              {p}
            </span>
          ))}
        </div>

        <div className="mt-10 w-full max-w-xl">
          <div
            className="relative h-1 w-full overflow-hidden rounded-full bg-[oklch(0.85_0.32_145/15%)]"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress)}
          >
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-[oklch(0.85_0.32_145)] shadow-[0_0_12px_oklch(0.85_0.32_145/80%)] transition-[width] duration-150 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-3 flex items-center justify-between font-mono text-xs text-muted-foreground">
            <span className="text-[oklch(0.85_0.32_145)]">
              {STATUS_STEPS[statusIdx]}
            </span>
            <span>{Math.round(progress)}%</span>
          </div>
        </div>
      </div>

      <style>{`@keyframes duck-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function DuckEmblem({ reduced }: { reduced: boolean }) {
  return (
    <div
      className={cn(
        "neon-glow relative flex size-32 items-center justify-center rounded-full border-2 border-[oklch(0.85_0.32_145/55%)] bg-[oklch(0.18_0.04_160/65%)] sm:size-40",
        !reduced && "animate-duck-pulse"
      )}
    >
      <div className={cn(!reduced && "animate-duck-float")}>
        <svg
          viewBox="0 0 120 120"
          className="size-24 sm:size-32"
          aria-hidden="true"
        >
          <defs>
            <radialGradient id="duckGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="oklch(0.95 0.32 145)" />
              <stop offset="100%" stopColor="oklch(0.7 0.28 145 / 40%)" />
            </radialGradient>
          </defs>
          {/* Duck head silhouette */}
          <ellipse
            cx="60"
            cy="62"
            rx="34"
            ry="30"
            fill="oklch(0.85 0.32 145 / 14%)"
            stroke="oklch(0.85 0.32 145)"
            strokeWidth="2"
          />
          {/* Beak */}
          <path
            d="M60 70 L86 76 L60 84 Z"
            fill="oklch(0.82 0.29 95)"
            stroke="oklch(0.85 0.32 145 / 60%)"
            strokeWidth="1"
          />
          {/* Left eye */}
          <g
            className={cn(!reduced && "animate-duck-blink")}
            style={{ transformBox: "fill-box", transformOrigin: "center" }}
          >
            <circle cx="46" cy="56" r="5" fill="oklch(0.95 0.32 145)" />
            <circle cx="47" cy="55" r="1.4" fill="oklch(0.18 0.04 160)" />
          </g>
          {/* Right eye */}
          <g
            className={cn(!reduced && "animate-duck-blink")}
            style={{ transformBox: "fill-box", transformOrigin: "center" }}
          >
            <circle cx="74" cy="56" r="5" fill="oklch(0.95 0.32 145)" />
            <circle cx="75" cy="55" r="1.4" fill="oklch(0.18 0.04 160)" />
          </g>
          {/* Top highlight */}
          <ellipse
            cx="60"
            cy="40"
            rx="14"
            ry="5"
            fill="oklch(0.95 0.32 145 / 25%)"
          />
        </svg>
      </div>

      {/* Tick ring */}
      <div
        className="pointer-events-none absolute inset-0 rounded-full"
        aria-hidden="true"
      >
        {Array.from({ length: 24 }).map((_, i) => (
          <span
            key={i}
            className="absolute left-1/2 top-1/2 h-1 w-0.5 -translate-x-1/2 -translate-y-1/2 bg-[oklch(0.85_0.32_145/45%)]"
            style={{
              transform: `rotate(${i * 15}deg) translateY(-66px)`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default LoadingScreen;
