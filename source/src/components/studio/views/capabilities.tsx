// BELENTANI OMEGA ULTRA
// Autoría: Pedro Belentani
// Fecha: 2026-08-14
'use client'

import { useEffect, useState } from 'react'
import { Cpu, CheckCircle2, AlertTriangle, XCircle, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/lib/api-client'
import type { OperationalContext } from '@/lib/types'
import { cn } from '@/lib/utils'

export function CapabilitiesView({ ctx }: { ctx: OperationalContext }) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const load = () => { setLoading(true); api.capabilities().then(setData).finally(() => setLoading(false)) }
  useEffect(() => {
    let cancelled = false
    api.capabilities()
      .then((d) => { if (!cancelled) setData(d) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const caps: any[] = data?.capabilities ?? ctx.capabilities

  const iconFor = (c: any) => {
    if (!c.enabled) return <XCircle className="w-4 h-4 text-zinc-400" />
    if (c.healthy) return <CheckCircle2 className="w-4 h-4 text-emerald-300" />
    return <AlertTriangle className="w-4 h-4 text-amber-300" />
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Cpu className="w-6 h-6 text-[oklch(0.82_0.29_145)]" /> Capacidades do sistema
          </h1>
          <p className="text-sm text-muted-foreground">Registry verificável — o que o sistema PODE e NÃO PODE fazer agora</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2" onClick={load}><RefreshCw className="w-3.5 h-3.5" /> Reverificar</Button>
      </div>

      <Card className="bg-card/60 border-border/60">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-300" /><span className="text-2xl font-bold">{caps.filter((c) => c.healthy).length}</span><span className="text-muted-foreground text-xs">saudáveis</span></div>
            <div className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-300" /><span className="text-2xl font-bold">{caps.filter((c) => c.enabled && !c.healthy).length}</span><span className="text-muted-foreground text-xs">indisponíveis</span></div>
            <div className="flex items-center gap-2"><XCircle className="w-4 h-4 text-zinc-400" /><span className="text-2xl font-bold">{caps.filter((c) => !c.enabled).length}</span><span className="text-muted-foreground text-xs">desativadas</span></div>
            <Badge variant="outline" className="ml-auto">{data?.isDesktopBridge ? 'Desktop Bridge conectado' : 'Web Runtime (navegador)'}</Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 md:grid-cols-2">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
          : caps.map((c) => (
            <Card key={c.key} className="bg-card/60 border-border/60">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="shrink-0 mt-0.5">{iconFor(c)}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-mono font-medium truncate">{c.key}</p>
                      <Badge variant="outline" className={cn('text-[9px]', c.healthy ? 'border-emerald-500/40 text-emerald-300' : c.enabled ? 'border-amber-500/40 text-amber-300' : 'border-zinc-600 text-zinc-400')}>
                        {c.healthy ? 'saudável' : c.enabled ? 'indisponível' : 'desativada'}
                      </Badge>
                    </div>
                    {c.provider && <p className="text-[11px] text-[oklch(0.85_0.32_145)] mt-0.5">{c.provider}</p>}
                    {c.reason && <p className="text-[11px] text-muted-foreground mt-1">{c.reason}</p>}
                    <p className="text-[10px] text-muted-foreground mt-1">verificado: {new Date(c.lastChecked).toLocaleString('pt-BR')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
      </div>

      <Card className="bg-card/40 border-border/60">
        <CardHeader><CardTitle className="text-sm">Matriz de capacidades Web vs Desktop</CardTitle><CardDescription className="text-xs">Honestidade sobre o que cada runtime permite</CardDescription></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-muted-foreground border-b border-border/60">
                  <th className="py-2 pr-4">Capacidade</th><th className="py-2 px-2">Web</th><th className="py-2 px-2">Desktop</th><th className="py-2 pl-2">Companion</th>
                </tr>
              </thead>
              <tbody className="font-mono">
                {[['CRM', 'Sim', 'Sim', 'Sim'], ['Gestão de projetos', 'Sim', 'Sim', 'Sim'], ['Metadados de arquivos', 'Parcial', 'Sim', 'Sim'], ['Scanner de plugins', 'Não', 'Sim', 'Sim'], ['Bridge DAW local', 'Não', 'Sim', 'Sim'], ['Sistema de arquivos nativo', 'Limitado', 'Sim', 'Sim']].map((r) => (
                  <tr key={r[0]} className="border-b border-border/30">
                    <td className="py-2 pr-4">{r[0]}</td><td className="py-2 px-2 text-[oklch(0.85_0.32_145)]">{r[1]}</td><td className="py-2 px-2 text-emerald-300">{r[2]}</td><td className="py-2 pl-2 text-emerald-300">{r[3]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
