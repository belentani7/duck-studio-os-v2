// BELENTANI OMEGA ULTRA
// Autoría: Pedro Belentani
// Fecha: 2026-08-14
'use client'

import type { ReactNode } from 'react'
import { useMemo, useState } from 'react'
import { ArrowRight, CheckCircle2, Copy, Disc3, Flame, SlidersHorizontal, Sparkles } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

type PremiumTool = {
  name: string
  role: string
  why: string
  tier: 'alto investimento' | 'suite premium'
}

type StylePreset = {
  id: string
  name: string
  audience: string
  outcome: string
  reference: string
  focus: string[]
}

type ChainStep = {
  tool: string
  use: string
  reason: string
}

const PREMIUM_TOOLS: PremiumTool[] = [
  {
    name: 'FabFilter Pro-Q 4',
    role: 'EQ cirúrgico',
    why: 'Limpeza fina, EQ dinâmico, controle de ressonância e visual rápido para decisão técnica.',
    tier: 'alto investimento',
  },
  {
    name: 'FabFilter Pro-L 3',
    role: 'limitador true-peak',
    why: 'Fechamento limpo, margem segura e entrega para streaming sem artefato desnecessário.',
    tier: 'alto investimento',
  },
  {
    name: 'FabFilter Pro-C 2',
    role: 'compressor transparente',
    why: 'Cola e controle de dinâmica com leitura simples e resposta precisa.',
    tier: 'alto investimento',
  },
  {
    name: 'Celemony Melodyne 5 studio',
    role: 'pitch + timing',
    why: 'Correção nota a nota para voz, instrumentos e arranjos com edição musical fina.',
    tier: 'suite premium',
  },
  {
    name: 'Antares Auto-Tune Pro 11',
    role: 'tuning vocal',
    why: 'Ajuste em tempo real para vocais modernos e assinatura sonora forte.',
    tier: 'suite premium',
  },
  {
    name: 'iZotope RX 12 Advanced',
    role: 'restauração',
    why: 'Remove click, hiss, de-reverb, ruído e problemas de diálogo com ferramentas de pós-produção.',
    tier: 'suite premium',
  },
  {
    name: 'iZotope Ozone 12 Advanced',
    role: 'mastering suite',
    why: 'Suite completa de mastering com módulos para EQ, dinâmica, largura, harmônicos e entrega final.',
    tier: 'suite premium',
  },
  {
    name: 'iZotope Insight 2',
    role: 'medição',
    why: 'Loudness, stereo, espectro e entrega técnica para validar a saída final.',
    tier: 'suite premium',
  },
  {
    name: 'Soundtoys 5',
    role: 'color suite',
    why: 'Coleção de saturação, delay, microshift e efeitos de caráter para refinamento e design.',
    tier: 'suite premium',
  },
  {
    name: 'Soundtoys Decapitator',
    role: 'saturação',
    why: 'Cor, grão e densidade quando a mix precisa de presença sem soar plana.',
    tier: 'alto investimento',
  },
  {
    name: 'Soundtoys Little AlterBoy',
    role: 'formant / pitch',
    why: 'Forma vozes, ad-libs e texturas vocais com rapidez e personalidade.',
    tier: 'alto investimento',
  },
  {
    name: 'Soundtoys EchoBoy',
    role: 'delay criativo',
    why: 'Delay musical para profundidade, movimento e ambiência com caráter.',
    tier: 'suite premium',
  },
  {
    name: 'Soundtoys MicroShift',
    role: 'largura estéreo',
    why: 'Abre o topo e as camadas sem destruir o centro da mix.',
    tier: 'alto investimento',
  },
  {
    name: 'Valhalla VintageVerb',
    role: 'reverb',
    why: 'Espaço musical para dar dimensão sem embolar a frente.',
    tier: 'alto investimento',
  },
  {
    name: 'Soothe2',
    role: 'de-resonance',
    why: 'Reduz aspereza, picos e dureza de forma controlada e musical.',
    tier: 'alto investimento',
  },
]

const STYLE_PRESETS: StylePreset[] = [
  {
    id: 'luxury-pop',
    name: 'Pop Luxo',
    audience: 'pop / rádio / streaming',
    outcome: 'acabamento brilhante, moderno e muito limpo',
    reference: 'Ideal quando a voz precisa ficar na frente sem perder brilho.',
    focus: ['voz forte', 'brilho controlado', 'limite limpo'],
  },
  {
    id: 'vocal-rescue',
    name: 'Resgate Vocal',
    audience: 'voz cantada / podcast',
    outcome: 'reparação, afinação e clareza',
    reference: 'Bom para arquivos com sibilância, desafinação ou ruído de gravação.',
    focus: ['reparo', 'tuning', 'inteligibilidade'],
  },
  {
    id: 'club-loud',
    name: 'Club Loud',
    audience: 'EDM / trap / urbano',
    outcome: 'peso, densidade e impacto',
    reference: 'Quando o master precisa aguentar volume alto sem embolar kick e baixo.',
    focus: ['impacto', 'densidade', 'grave firme'],
  },
  {
    id: 'cinema-wide',
    name: 'Cinema Wide',
    audience: 'trailer / OST / ambient',
    outcome: 'largura, profundidade e escala',
    reference: 'Para masters grandes, amplos e com movimento espacial.',
    focus: ['largura', 'profundidade', 'escala'],
  },
  {
    id: 'acoustic-clean',
    name: 'Acústico Clean',
    audience: 'folk / violão / voz / piano',
    outcome: 'naturalidade e transparência',
    reference: 'Quando a prioridade é parecer que nada foi exagerado.',
    focus: ['natural', 'transparente', 'microdinâmica'],
  },
]

function buildChain(profile: StylePreset, knobs: Record<string, number>): ChainStep[] {
  const steps: ChainStep[] = []
  const repair = knobs.repair
  const vocal = knobs.vocal
  const glue = knobs.glue
  const brightness = knobs.brightness
  const width = knobs.width
  const punch = knobs.punch

  if (repair >= 65 || profile.id === 'vocal-rescue') {
    steps.push({
      tool: 'iZotope RX 12 Advanced',
      use: 'restauração',
      reason: 'limpa ruído, respiração dura, hiss, click e de-reverb antes da finalização',
    })
  }

  if (vocal >= 45 || profile.id === 'vocal-rescue' || profile.id === 'luxury-pop') {
    steps.push({
      tool: 'Celemony Melodyne 5 studio',
      use: 'pitch + timing',
      reason: 'corrige nota, timing, vibrato e formant sem destruir a interpretação',
    })
  }

  if (vocal >= 60 || profile.id === 'vocal-rescue' || profile.id === 'luxury-pop') {
    steps.push({
      tool: 'Antares Auto-Tune Pro 11',
      use: 'tuning vocal',
      reason: 'aplica assinatura vocal moderna ou correção discreta em tempo real',
    })
  }

  steps.push({
    tool: 'FabFilter Pro-Q 4',
    use: 'EQ cirúrgico',
    reason: brightness >= 55 ? 'abre espaço e limpa low-mid com precisão' : 'faz limpeza e correção sem mudar o caráter',
  })

  if (punch >= 55 || glue >= 55 || profile.id === 'club-loud') {
    steps.push({
      tool: 'FabFilter Pro-C 2',
      use: 'compressão',
      reason: punch >= 55 ? 'segura pico e dá impacto' : 'cola o material com controle transparente',
    })
  }

  if (punch >= 70 || profile.id === 'club-loud') {
    steps.push({
      tool: 'iZotope Ozone 12 Advanced',
      use: 'mastering suite',
      reason: 'acelera decisões de balanceamento, largura, harmônicos e entrega final',
    })
  }

  if (brightness >= 55 || profile.id === 'cinema-wide') {
    steps.push({
      tool: 'Soothe2',
      use: 'de-resonance',
      reason: 'suaviza aspereza e energia agressiva em 2-8 kHz sem matar o ar',
    })
  }

  if (width >= 50 || profile.id === 'cinema-wide') {
    steps.push({
      tool: 'Soundtoys MicroShift',
      use: 'largura estéreo',
      reason: 'abre as bordas sem deslocar o centro da mix',
    })
  }

  if (profile.id === 'cinema-wide' || brightness >= 65) {
    steps.push({
      tool: 'Valhalla VintageVerb',
      use: 'espaço',
      reason: 'coloca profundidade e leitura espacial sem reverb feio',
    })
  }

  steps.push({
    tool: 'iZotope Insight 2',
    use: 'medição',
    reason: 'confirma loudness, stereo e tradução técnica antes de exportar',
  })

  steps.push({
    tool: 'FabFilter Pro-L 3',
    use: 'limitador true-peak',
    reason: 'fecha a entrega com margem segura e sem clipping oculto',
  })

  if (profile.id === 'acoustic-clean') {
    return steps.filter((step) => step.tool !== 'iZotope Ozone 12 Advanced')
  }

  return steps
}

function presetSummary(steps: ChainStep[]) {
  return steps.map((step, index) => `${index + 1}. ${step.tool} | ${step.use} | ${step.reason}`).join('\n')
}

async function copyText(text: string) {
  if (!navigator.clipboard?.writeText) {
    throw new Error('Clipboard indisponível')
  }
  await navigator.clipboard.writeText(text)
}

export function MasteringRack() {
  const [activeId, setActiveId] = useState(STYLE_PRESETS[0].id)
  const [repair, setRepair] = useState(72)
  const [glue, setGlue] = useState(58)
  const [brightness, setBrightness] = useState(64)
  const [width, setWidth] = useState(52)
  const [punch, setPunch] = useState(68)
  const [vocal, setVocal] = useState(63)
  const [copyState, setCopyState] = useState<'text' | 'json' | null>(null)

  const activeProfile = useMemo(
    () => STYLE_PRESETS.find((profile) => profile.id === activeId) ?? STYLE_PRESETS[0],
    [activeId]
  )

  const chain = useMemo(
    () => buildChain(activeProfile, { repair, glue, brightness, width, punch, vocal }),
    [activeProfile, repair, glue, brightness, width, punch, vocal]
  )

  const handleCopy = async (mode: 'text' | 'json') => {
    try {
      const payload = mode === 'text'
        ? [`Perfil: ${activeProfile.name}`, `Público: ${activeProfile.audience}`, `Meta: ${activeProfile.outcome}`, '', presetSummary(chain)].join('\n')
        : JSON.stringify({ profile: activeProfile, knobs: { repair, glue, brightness, width, punch, vocal }, chain }, null, 2)

      await copyText(payload)
      setCopyState(mode)
      toast.success(mode === 'text' ? 'Cadeia copiada' : 'JSON copiado')
      window.setTimeout(() => setCopyState(null), 1400)
    } catch {
      toast.error('Nao foi possivel copiar')
    }
  }

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Disc3 className="w-6 h-6 text-[oklch(0.82_0.29_145)]" /> Mastering Rack Premium
        </h2>
        <p className="text-sm text-muted-foreground">
          Ferramentas caras, reais e úteis. O foco aqui e personalização: quanto mais você ajusta o perfil, mais o rack decide a cadeia certa.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <Stat label="Ferramentas reais" value={PREMIUM_TOOLS.length.toString()} icon={<Sparkles className="w-4 h-4 text-[oklch(0.82_0.29_145)]" />} />
        <Stat label="Perfis" value={STYLE_PRESETS.length.toString()} icon={<Flame className="w-4 h-4 text-cyan-300" />} />
        <Stat label="Ajustes" value="6" icon={<SlidersHorizontal className="w-4 h-4 text-violet-300" />} />
        <Stat label="Saída" value="-1 dBTP" icon={<CheckCircle2 className="w-4 h-4 text-emerald-300" />} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="grid gap-3 md:grid-cols-2">
          {STYLE_PRESETS.map((profile) => {
            const isActive = profile.id === activeProfile.id
            return (
              <button
                key={profile.id}
                onClick={() => setActiveId(profile.id)}
                className={cn(
                  'text-left rounded-2xl border p-4 transition-all bg-card/50 backdrop-blur-sm',
                  isActive
                    ? 'border-[oklch(0.82_0.29_145/0.45)] neon-border shadow-[0_0_0_1px_oklch(0.82_0.29_145/0.12)]'
                    : 'border-border/60 hover:border-[oklch(0.82_0.29_145/0.24)]'
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-sm">{profile.name}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{profile.audience}</p>
                  </div>
                  <Badge variant={isActive ? 'default' : 'outline'} className={cn('text-[10px]', isActive && 'bg-[oklch(0.82_0.29_145)] text-background')}>
                    ativo
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-3 line-clamp-2">{profile.outcome}</p>
                <p className="text-[11px] text-[oklch(0.82_0.29_145)] mt-3">{profile.reference}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {profile.focus.map((item) => (
                    <Badge key={item} variant="secondary" className="text-[10px] py-0 px-1.5">{item}</Badge>
                  ))}
                </div>
              </button>
            )
          })}
        </div>

        <Card className="bg-card/50 border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ArrowRight className="w-4 h-4 text-[oklch(0.82_0.29_145)]" /> Cadeia gerada
            </CardTitle>
            <CardDescription>{activeProfile.outcome}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {chain.map((step, index) => (
                <div key={`${step.tool}-${index}`} className="rounded-xl border border-border/60 bg-background/40 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-sm">{index + 1}. {step.tool}</p>
                      <p className="text-[11px] text-[oklch(0.82_0.29_145)] mt-1">{step.use}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px] shrink-0">etapa {index + 1}</Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-2">{step.reason}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={() => handleCopy('text')} className="gap-2 bg-[oklch(0.82_0.29_145)] text-background">
                <Copy className="w-3.5 h-3.5" /> {copyState === 'text' ? 'Cadeia copiada' : 'Copiar cadeia'}
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleCopy('json')} className="gap-2">
                <Copy className="w-3.5 h-3.5" /> {copyState === 'json' ? 'JSON copiado' : 'Copiar JSON'}
              </Button>
            </div>

            <div className="rounded-xl border border-dashed border-[oklch(0.82_0.29_145/0.25)] bg-[oklch(0.82_0.29_145/0.04)] p-3">
              <p className="text-[11px] uppercase tracking-[0.2em] text-[oklch(0.82_0.29_145)] mb-2">Leitura rápida</p>
              <p className="text-xs text-muted-foreground">
                Quanto maior o ajuste em reparo, voz e punch, mais o rack empurra RX / Melodyne / Auto-Tune / Ozone.
                Quanto maior largura e brilho, mais ele chama MicroShift, VintageVerb e Soothe2.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="bg-card/50 border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Personalização</CardTitle>
            <CardDescription>Ajuste o perfil e o rack reorganiza as ferramentas caras em tempo real.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Knob label="Reparo" value={repair} onChange={setRepair} hint="ruído, click, de-reverb, limpeza" />
            <Knob label="Cola" value={glue} onChange={setGlue} hint="compressão, densidade e coesão" />
            <Knob label="Brilho" value={brightness} onChange={setBrightness} hint="air, aspereza, presença de alto" />
            <Knob label="Largura" value={width} onChange={setWidth} hint="estéreo, bordas e centro" />
            <Knob label="Impacto" value={punch} onChange={setPunch} hint="punch, transiente, pressão" />
            <Knob label="Voz" value={vocal} onChange={setVocal} hint="pitch, formant e presença vocal" />
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Ferramentas premium úteis</CardTitle>
            <CardDescription>Nome real, uso real, motivo real. Sem enfeite.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {PREMIUM_TOOLS.map((tool) => (
              <div key={tool.name} className="rounded-xl border border-border/60 bg-background/40 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{tool.name}</p>
                    <p className="text-[11px] text-[oklch(0.82_0.29_145)] mt-0.5">{tool.role}</p>
                  </div>
                  <Badge variant="outline" className="text-[10px] shrink-0">{tool.tier}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-2">{tool.why}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function Knob({
  label,
  value,
  onChange,
  hint,
}: {
  label: string
  value: number
  onChange: (value: number) => void
  hint: string
}) {
  return (
    <div className="space-y-2 rounded-xl border border-border/60 bg-background/40 p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium">{label}</p>
          <p className="text-[11px] text-muted-foreground">{hint}</p>
        </div>
        <Badge variant="outline" className="text-[10px] shrink-0">{value}%</Badge>
      </div>
      <Slider value={[value]} min={0} max={100} step={1} onValueChange={(next) => onChange(next[0] ?? 0)} />
    </div>
  )
}

function Stat({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
  return (
    <Card className="bg-card/50 border-border/60">
      <CardContent className="p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl border border-border/60 bg-background/40 flex items-center justify-center shrink-0">{icon}</div>
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
          <p className="text-lg font-semibold mt-0.5">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}
