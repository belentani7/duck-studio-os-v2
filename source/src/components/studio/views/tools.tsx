// BELENTANI OMEGA ULTRA
// Autoría: Pedro Belentani
// Fecha: 2026-08-14
'use client'

import { Wrench, Music, Gauge, AudioWaveform, Disc3 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tuner } from '../tools/tuner'
import { HarmonicCatalog } from '../tools/harmonic-catalog'
import { PowerDetector } from '../tools/power-detector'
import { MasteringRack } from '../tools/mastering-rack'

export function ToolsView() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Wrench className="w-6 h-6 text-[oklch(0.82_0.29_145)]" /> Ferramentas de estúdio
        </h1>
        <p className="text-sm text-muted-foreground">Simuladores funcionais para checagem geral de instrumentos e sinais — rodam 100% no navegador via Web Audio API.</p>
      </div>

      <Tabs defaultValue="tuner">
        <TabsList className="grid grid-cols-4 w-full max-w-2xl h-9">
          <TabsTrigger value="tuner" className="text-xs gap-1"><Music className="w-3.5 h-3.5" />Afinador</TabsTrigger>
          <TabsTrigger value="power" className="text-xs gap-1"><Gauge className="w-3.5 h-3.5" />Potência</TabsTrigger>
          <TabsTrigger value="harmonic" className="text-xs gap-1"><AudioWaveform className="w-3.5 h-3.5" />Harmônicos</TabsTrigger>
          <TabsTrigger value="mastering" className="text-xs gap-1"><Disc3 className="w-3.5 h-3.5" />Mastering</TabsTrigger>
        </TabsList>
        <TabsContent value="tuner" className="mt-4"><Tuner /></TabsContent>
        <TabsContent value="power" className="mt-4"><PowerDetector /></TabsContent>
        <TabsContent value="harmonic" className="mt-4"><HarmonicCatalog /></TabsContent>
        <TabsContent value="mastering" className="mt-4"><MasteringRack /></TabsContent>
      </Tabs>

      <Card className="bg-card/40 border-border/60">
        <CardHeader><CardTitle className="text-sm">Sobre as ferramentas</CardTitle></CardHeader>
        <CardContent className="text-xs text-muted-foreground space-y-1">
          <p>• <strong>Afinador:</strong> detecção de pitch por autocorrelação no sinal do microfone, com medidor de cents e tom de referência A4.</p>
          <p>• <strong>Detector de potência:</strong> medidor RMS/peak/LUFS estimado em tempo real, com indicador de clipping.</p>
          <p>• <strong>Catálogo harmônico:</strong> campo harmônico de 7 escalas, progressões comuns tocáveis e modos gregos.</p>
          <p className="text-amber-300/70">As ferramentas precisam de permissão de microfone. Nenhum áudio é enviado a servidores.</p>
        </CardContent>
      </Card>
    </div>
  )
}
