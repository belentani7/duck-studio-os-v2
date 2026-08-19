// BELENTANI OMEGA ULTRA
// Autoría: Pedro Belentani
// Fecha: 2026-08-14
'use client'

import { useEffect, useState } from 'react'
import { ShieldCheck, ScrollText } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { api } from '@/lib/api-client'
import type { OperationalContext } from '@/lib/types'

export function AuditView({ ctx }: { ctx: OperationalContext }) {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { api.audit().then(setLogs).catch(() => {}).finally(() => setLoading(false)) }, [])

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-[oklch(0.82_0.29_145)]" /> Auditoria
        </h1>
        <p className="text-sm text-muted-foreground">Trilha de auditoria de ações sensíveis · {logs.length} registros</p>
      </div>

      <Card className="bg-card/60 border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2"><ScrollText className="w-4 h-4" /> Log de eventos</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
          ) : logs.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Sem registros de auditoria.</p>
          ) : (
            <ScrollArea className="h-[560px] pr-3">
              <div className="space-y-1.5">
                {logs.map((l) => (
                  <div key={l.id} className="flex items-center gap-3 rounded-lg border border-border/40 bg-background/40 p-2.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-[oklch(0.82_0.29_145)] shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono">{l.action}</span>
                        <Badge variant="outline" className="text-[9px] py-0 px-1.5">{l.role}</Badge>
                        <span className="text-[11px] text-muted-foreground">{l.resource}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate">{l.detail ?? l.actor}</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground font-mono shrink-0">{new Date(l.createdAt).toLocaleString('pt-BR')}</span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
