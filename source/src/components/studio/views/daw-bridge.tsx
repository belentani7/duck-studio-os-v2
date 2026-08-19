// BELENTANI OMEGA ULTRA
// Autoría: Pedro Belentani
// Fecha: 2026-08-14
'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Cpu, Zap, Plug, AlertTriangle, CheckCircle2, XCircle, PlugZap, RefreshCw,
  Music, Radio, ArrowRight,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { api } from '@/lib/api-client'
import type { OperationalContext } from '@/lib/types'
import { cn } from '@/lib/utils'

const CAPABILITY_LABELS: Record<string, string> = {
  'project.open': 'Abrir projeto',
  'track.list': 'Listar faixas',
  'render.start': 'Iniciar render',
  'tempo.set': 'Definir tempo',
  'export.stems': 'Exportar stems',
  'automation.read': 'Ler automação',
}

export function DawBridgeView({ ctx }: { ctx: OperationalContext }) {
  const [data, setData] = useState<{ adapters: any[]; allCapabilities: string[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState<string | null>(null)
  const [result, setResult] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try { setData(await api.dawBridge.list()) } finally { setLoading(false) }
  }, [])

  useEffect(() => {
    let cancelled = false
    api.dawBridge.list().then((d) => { if (!cancelled) setData(d) }).finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const connect = async (dawId: string) => {
    setConnecting(dawId)
    setResult(null)
    try {
      const res = await api.dawBridge.connect(dawId)
      setResult(res.message)
      await load()
    } finally {
      setConnecting(null)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Cpu className="w-6 h-6 text-[oklch(0.82_0.29_145)]" /> DAW Bridge
          </h1>
          <p className="text-sm text-muted-foreground">Abstração de adaptadores para integração com DAWs</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2" onClick={load}><RefreshCw className="w-3.5 h-3.5" /> Reverificar</Button>
      </div>

      {/* Honest warning about web limitations */}
      <Alert className="border-amber-500/30 bg-amber-500/5">
        <AlertTriangle className="w-4 h-4 text-amber-300" />
        <AlertTitle className="text-amber-200">Bridge desktop não conectado</AlertTitle>
        <AlertDescription className="text-amber-200/80 text-xs">
          A integração real com DAWs (Ableton, FL Studio, Logic, etc.) requer um <strong>companion desktop</strong> (Electron/Tauri)
          que comunique via OSC, scripting API ou diretórios monitorados. No navegador, todos os adapters permanecem
          <strong> disconnected</strong> — isto é modelado honestamente, sem simular conexões inexistentes.
          A arquitetura abaixo está pronta para when o companion for instalado.
        </AlertDescription>
      </Alert>

      {result && (
        <Alert className="border-[oklch(0.82_0.29_145/0.3)] bg-[oklch(0.82_0.29_145/0.05)]">
          <PlugZap className="w-4 h-4 text-[oklch(0.82_0.29_145)]" />
          <AlertDescription className="text-xs">{result}</AlertDescription>
        </Alert>
      )}

      {/* Capability matrix */}
      {data && data.allCapabilities.length > 0 && (
        <Card className="bg-card/60 border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><Radio className="w-4 h-4 text-[oklch(0.82_0.29_145)]" /> Matriz de capacidades por DAW</CardTitle>
            <CardDescription className="text-xs">Quais operações cada adapter pode suportar quando conectado</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/60">
                    <th className="py-2 pr-3 text-left text-muted-foreground">DAW</th>
                    {data.allCapabilities.map((cap) => (
                      <th key={cap} className="py-2 px-1.5 text-center text-[10px] text-muted-foreground min-w-[70px]">{CAPABILITY_LABELS[cap] ?? cap}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.adapters.map((daw) => (
                    <tr key={daw.id} className="border-b border-border/30 hover:bg-background/30">
                      <td className="py-2 pr-3">
                        <div className="flex items-center gap-1.5">
                          <Music className="w-3 h-3 text-[oklch(0.82_0.29_145)]" />
                          <span className="font-medium">{daw.name}</span>
                        </div>
                      </td>
                      {data.allCapabilities.map((cap) => (
                        <td key={cap} className="py-2 px-1.5 text-center">
                          {daw.capabilities.includes(cap) ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300 inline" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5 text-zinc-600 inline" />
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Adapter cards */}
      <div className="grid gap-3 md:grid-cols-2">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)
        ) : data?.adapters.map((daw) => (
          <Card key={daw.id} className="bg-card/60 border-border/60">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-[oklch(0.82_0.29_145/0.12)] flex items-center justify-center shrink-0">
                    <Music className="w-4 h-4 text-[oklch(0.82_0.29_145)]" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{daw.name}</p>
                    <p className="text-[11px] text-muted-foreground">{daw.manufacturer}</p>
                  </div>
                </div>
                <Badge variant="outline" className={cn('text-[9px] py-0 px-1.5 shrink-0', daw.status === 'connected' ? 'border-emerald-500/40 text-emerald-300' : daw.status === 'error' ? 'border-rose-500/40 text-rose-300' : 'border-zinc-600 text-zinc-400')}>
                  {daw.status}
                </Badge>
              </div>

              {/* Protocols */}
              <div className="mb-2">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Protocolos</p>
                <div className="flex flex-wrap gap-1">
                  {daw.protocols.map((p: string) => (
                    <Badge key={p} variant="secondary" className="text-[9px] py-0 px-1.5"><Radio className="w-2.5 h-2.5 mr-0.5" />{p}</Badge>
                  ))}
                </div>
              </div>

              {/* Reason */}
              {daw.reason && (
                <p className="text-[11px] text-muted-foreground italic mb-3">{daw.reason}</p>
              )}

              {/* Connect button */}
              <Button
                size="sm"
                variant="outline"
                className="w-full h-8 gap-1.5 text-xs"
                disabled={connecting === daw.id}
                onClick={() => connect(daw.id)}
              >
                {connecting === daw.id ? (
                  <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Conectando…</>
                ) : (
                  <><PlugZap className="w-3.5 h-3.5" /> Tentar conectar <ArrowRight className="w-3 h-3" /></>
                )}
              </Button>
              {daw.lastChecked && (
                <p className="text-[9px] text-muted-foreground text-center mt-1.5 font-mono">verificado: {new Date(daw.lastChecked).toLocaleTimeString('pt-BR')}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
