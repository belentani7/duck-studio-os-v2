// BELENTANI OMEGA ULTRA
// Autoría: Pedro Belentani
// Fecha: 2026-08-14
"use client";

import * as React from "react";
import {
  Music2,
  Play,
  Square,
  ChevronDown,
  ListMusic,
  Info,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

interface ScaleDef {
  label: string;
  intervals: number[];
  family: "major" | "minor" | "blues" | "penta-major" | "penta-minor";
}

const SCALES: Record<string, ScaleDef> = {
  major: {
    label: "Maior (Jônio)",
    intervals: [0, 2, 4, 5, 7, 9, 11],
    family: "major",
  },
  naturalMinor: {
    label: "Menor Natural (Eólio)",
    intervals: [0, 2, 3, 5, 7, 8, 10],
    family: "minor",
  },
  harmonicMinor: {
    label: "Menor Harmônica",
    intervals: [0, 2, 3, 5, 7, 8, 11],
    family: "minor",
  },
  melodicMinor: {
    label: "Menor Melódica",
    intervals: [0, 2, 3, 5, 7, 9, 11],
    family: "minor",
  },
  pentatonicMajor: {
    label: "Pentatônica Maior",
    intervals: [0, 2, 4, 7, 9],
    family: "penta-major",
  },
  pentatonicMinor: {
    label: "Pentatônica Menor",
    intervals: [0, 3, 5, 7, 10],
    family: "penta-minor",
  },
  blues: {
    label: "Blues",
    intervals: [0, 3, 5, 6, 7, 10],
    family: "blues",
  },
};

interface ModeDef {
  name: string;
  formula: string;
  intervals: number[];
  description: string;
}

const GREEK_MODES: ModeDef[] = [
  {
    name: "Jônio",
    formula: "T–T–st–T–T–T–st",
    intervals: [0, 2, 4, 5, 7, 9, 11],
    description: "Modo maior. Brilhante, resolutivo e estável. Base da tonalidade maior.",
  },
  {
    name: "Dórico",
    formula: "T–st–T–T–T–st–T",
    intervals: [0, 2, 3, 5, 7, 9, 10],
    description: "Menor com 6ª maior. Jazz, folk e rock progressivo. Sonoridade aveludada e esperançosa.",
  },
  {
    name: "Frígio",
    formula: "st–T–T–T–st–T–T",
    intervals: [0, 1, 3, 5, 7, 8, 10],
    description: "Menor com 2ª menor. Sombrio, hispano-oriental. Comum em metal e flamenco.",
  },
  {
    name: "Lídio",
    formula: "T–T–T–st–T–T–st",
    intervals: [0, 2, 4, 6, 7, 9, 11],
    description: "Maior com 4ª aumentada. Onírico, etéreo, cinematográfico.",
  },
  {
    name: "Mixolídio",
    formula: "T–T–st–T–T–st–T",
    intervals: [0, 2, 4, 5, 7, 9, 10],
    description: "Maior com 7ª menor. Bluesy, rock, dominante. Base do groove dominante.",
  },
  {
    name: "Eólio",
    formula: "T–st–T–T–st–T–T",
    intervals: [0, 2, 3, 5, 7, 8, 10],
    description: "Menor natural. Melancólico, contemplativo. Base da tonalidade menor.",
  },
  {
    name: "Lócrio",
    formula: "st–T–T–st–T–T–T",
    intervals: [0, 1, 3, 5, 6, 8, 10],
    description: "Menor com 5ª diminuta. Tenso, instável, raramente usado como tônica.",
  },
];

interface ProgressionDef {
  label: string;
  degrees: number[];
}

const MAJOR_PROGRESSIONS: ProgressionDef[] = [
  { label: "I–V–vi–IV (pop)", degrees: [0, 4, 5, 3] },
  { label: "ii–V–I (jazz)", degrees: [1, 4, 0] },
  { label: "vi–IV–I–V (ballad)", degrees: [5, 3, 0, 4] },
  { label: "I–IV–V (rock/blues)", degrees: [0, 3, 4] },
  { label: "I–vi–IV–V (doo-wop)", degrees: [0, 5, 3, 4] },
];

const MINOR_PROGRESSIONS: ProgressionDef[] = [
  { label: "i–VII–VI–VII (menor clássico)", degrees: [0, 6, 5, 6] },
  { label: "i–iv–VII–III (andamento)", degrees: [0, 3, 6, 2] },
  { label: "i–VII–VI–v (descending)", degrees: [0, 6, 5, 4] },
  { label: "ii°–v–i (jazz menor)", degrees: [1, 4, 0] },
];

const BLUES_PROGRESSION: ProgressionDef = {
  label: "12-bar blues (I7–IV7–V7)",
  degrees: [0, 0, 0, 0, 3, 3, 0, 0, 4, 3, 0, 4],
};

// ---------- Music theory helpers ----------
function noteIndex(name: string) {
  return NOTES.indexOf(name);
}

function transpose(note: string, semis: number) {
  const idx = noteIndex(note);
  return NOTES[((idx + semis) % 12 + 12) % 12];
}

function noteAtDegree(rootNote: string, intervals: number[], degree: number) {
  const len = intervals.length;
  const idx = noteIndex(rootNote);
  const offset = intervals[degree % len] + Math.floor(degree / len) * 12;
  return NOTES[((idx + offset) % 12 + 12) % 12];
}

type Quality = "maj" | "m" | "dim" | "aug" | "sus2" | "sus4" | "maj6" | "m6" | "5";

function chordQuality(intervals: number[], degree: number): {
  quality: Quality | null;
  symbol: string;
  roman: string;
} {
  const len = intervals.length;
  if (len < 5) {
    // Pentatonic / blues — tertian harmony is ambiguous
    return { quality: null, symbol: "", roman: "" };
  }
  const root = intervals[degree];
  const thirdIdx = (degree + 2) % len;
  const thirdOctave = Math.floor((degree + 2) / len);
  const fifthIdx = (degree + 4) % len;
  const fifthOctave = Math.floor((degree + 4) / len);
  const thirdInt = intervals[thirdIdx] + thirdOctave * 12 - root;
  const fifthInt = intervals[fifthIdx] + fifthOctave * 12 - root;

  let quality: Quality;
  if (thirdInt === 4 && fifthInt === 7) quality = "maj";
  else if (thirdInt === 3 && fifthInt === 7) quality = "m";
  else if (thirdInt === 3 && fifthInt === 6) quality = "dim";
  else if (thirdInt === 4 && fifthInt === 8) quality = "aug";
  else if (thirdInt === 2 && fifthInt === 7) quality = "sus2";
  else if (thirdInt === 5 && fifthInt === 7) quality = "sus4";
  else if (thirdInt === 4 && fifthInt === 9) quality = "maj6";
  else if (thirdInt === 3 && fifthInt === 9) quality = "m6";
  else quality = "5";

  const symbols: Record<Quality, string> = {
    maj: "maj",
    m: "m",
    dim: "°",
    aug: "+",
    sus2: "sus2",
    sus4: "sus4",
    maj6: "6",
    m6: "m6",
    "5": "5",
  };
  const romanBase = ["I", "II", "III", "IV", "V", "VI", "VII"][degree] || "?";
  let roman = romanBase;
  if (quality === "m" || quality === "dim" || quality === "m6") {
    roman = romanBase.toLowerCase();
  }
  if (quality === "dim") roman += "°";
  if (quality === "aug") roman += "+";
  if (quality === "sus2") roman += "sus2";
  if (quality === "sus4") roman += "sus4";
  if (quality === "maj6") roman += "6";
  if (quality === "m6") roman += "6";

  return { quality, symbol: symbols[quality], roman };
}

function noteToFreq(midi: number) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function chordMidis(rootNote: string, intervals: number[], degree: number): number[] {
  const len = intervals.length;
  const root = noteIndex(rootNote);
  const rootMidi = (4 + 1) * 12 + root; // octave 4
  if (len < 5) {
    // pentatonic/blues — just play root note as a power-ish cluster (root + 5th if available)
    const fifth = intervals[(degree + 4) % len] + Math.floor((degree + 4) / len) * 12;
    return [rootMidi, rootMidi + fifth, rootMidi + fifth + 12];
  }
  const third = intervals[(degree + 2) % len] + Math.floor((degree + 2) / len) * 12;
  const fifth = intervals[(degree + 4) % len] + Math.floor((degree + 4) / len) * 12;
  return [rootMidi, rootMidi + third, rootMidi + fifth];
}

interface DegreeInfo {
  note: string;
  roman: string;
  symbol: string;
  quality: Quality | null;
}

function buildDegrees(rootNote: string, intervals: number[]): DegreeInfo[] {
  const len = intervals.length;
  return intervals.map((_, i) => {
    const note = noteAtDegree(rootNote, intervals, i);
    const { quality, symbol, roman } = chordQuality(intervals, i);
    const romanDisplay =
      roman || ["I", "II", "III", "IV", "V", "VI", "VII"][i] || "?";
    return { note, roman: romanDisplay, symbol, quality };
  });
}

function progressionsForScale(scale: ScaleDef): ProgressionDef[] {
  switch (scale.family) {
    case "major":
    case "penta-major":
      return MAJOR_PROGRESSIONS;
    case "minor":
    case "penta-minor":
      return MINOR_PROGRESSIONS;
    case "blues":
      return [BLUES_PROGRESSION];
    default:
      return [];
  }
}

const ROMAN_FOR_DEGREE: Record<number, string> = {
  0: "I",
  1: "ii",
  2: "iii",
  3: "IV",
  4: "V",
  5: "vi",
  6: "vii°",
};

export function HarmonicCatalog() {
  const [key, setKey] = React.useState("C");
  const [scaleId, setScaleId] = React.useState("major");
  const [modesOpen, setModesOpen] = React.useState(false);
  const [playingLabel, setPlayingLabel] = React.useState<string | null>(null);

  const ctxRef = React.useRef<AudioContext | null>(null);
  const stopTimersRef = React.useRef<ReturnType<typeof setTimeout>[]>([]);

  const scale = SCALES[scaleId];
  const degrees = React.useMemo(
    () => buildDegrees(key, scale.intervals),
    [key, scale]
  );
  const progressions = React.useMemo(
    () => progressionsForScale(scale),
    [scale]
  );

  React.useEffect(() => {
    return () => {
      stopTimersRef.current.forEach((t) => clearTimeout(t));
      stopTimersRef.current = [];
      const ctx = ctxRef.current;
      if (ctx && ctx.state !== "closed") {
        try {
          ctx.close();
        } catch {
          /* noop */
        }
      }
    };
  }, []);

  const ensureCtx = React.useCallback(async () => {
    if (!ctxRef.current || ctxRef.current.state === "closed") {
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      ctxRef.current = new Ctor();
    }
    const ctx = ctxRef.current;
    if (ctx.state === "suspended") {
      try {
        await ctx.resume();
      } catch {
        /* noop */
      }
    }
    return ctx;
  }, []);

  const stopAll = React.useCallback(() => {
    stopTimersRef.current.forEach((t) => clearTimeout(t));
    stopTimersRef.current = [];
    const ctx = ctxRef.current;
    if (ctx) {
      // Master mute: rebuild a fresh ctx to cut sound quickly
      try {
        ctx.close();
      } catch {
        /* noop */
      }
      ctxRef.current = null;
    }
    setPlayingLabel(null);
  }, []);

  const playProgression = React.useCallback(
    async (prog: ProgressionDef) => {
      if (playingLabel === prog.label) {
        stopAll();
        return;
      }
      stopAll();
      const ctx = await ensureCtx();
      const now = ctx.currentTime + 0.08;
      const chordDur = 0.4;
      const noteStride = 0.06;

      prog.degrees.forEach((deg, i) => {
        const midis = chordMidis(key, scale.intervals, deg);
        const start = now + i * chordDur;
        midis.forEach((m, j) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = j === 0 ? "triangle" : "sine";
          osc.frequency.value = noteToFreq(m);
          const t = start + j * noteStride;
          gain.gain.setValueAtTime(0.0001, t);
          gain.gain.exponentialRampToValueAtTime(0.18, t + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0008, t + chordDur);
          osc.connect(gain).connect(ctx.destination);
          osc.start(t);
          osc.stop(t + chordDur + 0.05);
        });
      });

      setPlayingLabel(prog.label);
      const total = prog.degrees.length * chordDur * 1000 + 200;
      const t = setTimeout(() => {
        setPlayingLabel((cur) => (cur === prog.label ? null : cur));
      }, total);
      stopTimersRef.current.push(t);
    },
    [key, scale, ensureCtx, stopAll, playingLabel]
  );

  return (
    <Card className="neon-border w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Music2 className="size-5 text-[oklch(0.85_0.32_145)]" />
          Catálogo Harmônico
        </CardTitle>
        <CardDescription>
          Campo harmônico, progressões comuns e modos gregos — computados em
          tempo real.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Key + Scale selectors */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-xs uppercase tracking-wider text-muted-foreground">
              Tonalidade
            </label>
            <Select value={key} onValueChange={setKey}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Tonalidade" />
              </SelectTrigger>
              <SelectContent>
                {NOTES.map((n) => (
                  <SelectItem key={n} value={n}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs uppercase tracking-wider text-muted-foreground">
              Escala
            </label>
            <Select value={scaleId} onValueChange={setScaleId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Escala" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(SCALES).map(([id, def]) => (
                  <SelectItem key={id} value={id}>
                    {def.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Scale degrees */}
        <section className="space-y-2">
          <h3 className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
            <Sparkles className="size-3.5" />
            Graus do campo harmônico · {key} {scale.label}
          </h3>
          <div className="flex flex-wrap gap-2">
            {degrees.map((d, i) => (
              <div
                key={i}
                className="neon-border flex min-w-[88px] flex-col items-center gap-0.5 rounded-lg bg-[oklch(0.85_0.32_145/8%)] px-3 py-2"
              >
                <span className="font-mono text-[10px] uppercase tracking-wider text-[oklch(0.85_0.32_145/85%)]">
                  {d.roman}
                </span>
                <span className="text-lg font-semibold text-[oklch(0.85_0.32_145)] neon-text">
                  {d.note}
                  {d.symbol ? (
                    <span className="text-sm text-muted-foreground">
                      {d.symbol}
                    </span>
                  ) : null}
                </span>
              </div>
            ))}
          </div>
          {degrees.length < 5 && (
            <p className="text-xs text-muted-foreground">
              Escalas pentatônicas/blues não possuem campo harmônico tradicional
              — use como fonte melódica sobre o campo maior/menor.
            </p>
          )}
        </section>

        {/* Progressions */}
        <section className="space-y-3">
          <h3 className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
            <ListMusic className="size-3.5" />
            Progressões comuns
          </h3>
          {progressions.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Sem progressões clássicas associadas a esta escala.
            </p>
          ) : (
            <ul className="space-y-2">
              {progressions.map((prog) => {
                const isPlaying = playingLabel === prog.label;
                return (
                  <li
                    key={prog.label}
                    className="flex flex-col gap-2 rounded-lg border border-border bg-card/60 p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="mr-1 text-sm text-muted-foreground">
                        {prog.label}
                      </span>
                      {prog.degrees.map((deg, i) => {
                        const info = degrees[deg];
                        const roman = info?.roman || ROMAN_FOR_DEGREE[deg] || "?";
                        const note = info?.note || "?";
                        const sym = info?.symbol || "";
                        return (
                          <Badge
                            key={i}
                            variant="outline"
                            className={cn(
                              "border-[oklch(0.85_0.32_145/40%)] bg-[oklch(0.85_0.32_145/10%)] font-mono text-xs text-[oklch(0.85_0.32_145)]"
                            )}
                          >
                            {note}
                            {sym}
                            <span className="ml-1 text-[10px] text-muted-foreground">
                              {roman}
                            </span>
                          </Badge>
                        );
                      })}
                    </div>
                    <Button
                      size="sm"
                      variant={isPlaying ? "destructive" : "outline"}
                      onClick={() => playProgression(prog)}
                      className="shrink-0"
                    >
                      {isPlaying ? (
                        <>
                          <Square className="size-3.5" /> Parar
                        </>
                      ) : (
                        <>
                          <Play className="size-3.5" /> Tocar
                        </>
                      )}
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Greek modes */}
        <Collapsible open={modesOpen} onOpenChange={setModesOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between">
              <span className="flex items-center gap-2 text-sm">
                <Info className="size-4 text-[oklch(0.85_0.32_145)]" />
                Modos Gregos
              </span>
              <ChevronDown
                className={cn(
                  "size-4 transition-transform",
                  modesOpen && "rotate-180"
                )}
              />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3">
            <ul className="space-y-2">
              {GREEK_MODES.map((m) => (
                <li
                  key={m.name}
                  className="rounded-lg border border-border bg-card/50 p-3"
                >
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="text-sm font-semibold text-[oklch(0.85_0.32_145)]">
                      {m.name}
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {m.formula}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {m.description}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {m.intervals.map((iv, i) => (
                      <span
                        key={i}
                        className="rounded bg-[oklch(0.85_0.32_145/12%)] px-1.5 py-0.5 font-mono text-[10px] text-[oklch(0.85_0.32_145)]"
                      >
                        {transpose(key, iv)}
                      </span>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}

export default HarmonicCatalog;
