// BELENTANI OMEGA ULTRA
// Autoría: Pedro Belentani
// Fecha: 2026-08-14
'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  FolderKanban, GitBranch, Receipt, CheckCircle2, RotateCcw, MessageSquare,
  Music2, Heart, Calendar, Euro, ChevronRight, Send,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { api } from '@/lib/api-client'
import { STATUS_LABELS_PT, STATUS_COLORS } from '@/lib/types'
import type { OperationalContext } from '@/lib/types'
import { cn } from '@/lib/utils'
import { WaveformPlayer } from '../waveform-player'

const MOTIVATION = [
  'Sua música merece o melhor tratamento. Estamos nisso juntos. 🎧',
  'Cada revisão nos aproxima do som perfeito. Obrigado pela confiança. ✨',
  'O ritmo certo transforma uma faixa em uma experiência. Continue sonhando. 🎶',
]

export function ClientPortal({ ctx, onOpenProject }: { ctx: OperationalContext; onOpenProject: (id: string) => void }) {
  const [projects, setProjects] = useState<any[]>([])
  const [invoices, setInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [p, inv] = await Promise.all([api.projects.list(), api.invoices.list()])
      setProjects(p); setInvoices(inv)
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const versionsInReview = projects.flatMap((p) => (p.versions ?? []).filter((v: any) => v.status === 'review').map((v: any) => ({ ...v, project: p })))
  const outstanding = invoices.filter((i) => i.status === 'sent' || i.status === 'overdue').reduce((s, i) => s + i.amount, 0)

  return (
    <div className="space-y-5">
      {/* Greeting */}
      <Card className="bg-gradient-to-br from-[oklch(0.82_0.29_145/0.12)] to-[oklch(0.6_0.18_180/0.08)] border-[oklch(0.82_0.29_145/0.3)]">
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[oklch(0.82_0.29_145)] to-[oklch(0.6_0.18_180)] flex items-center justify-center shrink-0">
              <Music2 className="w-5 h-5 text-background" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                Olá, <span className="neon-text text-[oklch(0.85_0.32_145)]">{ctx.clientName ?? ctx.userName}</span> 👋
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">{ctx.studioName} · Portal do cliente</p>
              <p className="text-xs text-[oklch(0.85_0.32_145)] mt-2 italic">{MOTIVATION[Math.floor(Date.now() / 8000) % MOTIVATION.length]}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-card/60 border-border/60"><CardContent className="p-4"><FolderKanban className="w-4 h-4 text-[oklch(0.82_0.29_145)] mb-2" /><p className="text-xl font-bold tabular-nums">{projects.length}</p><p className="text-[11px] text-muted-foreground">projetos</p></CardContent></Card>
        <Card className="bg-card/60 border-border/60"><CardContent className="p-4"><GitBranch className="w-4 h-4 text-violet-300 mb-2" /><p className="text-xl font-bold tabular-nums">{versionsInReview.length}</p><p className="text-[11px] text-muted-foreground">em revisão</p></CardContent></Card>
        <Card className="bg-card/60 border-border/60"><CardContent className="p-4"><Receipt className="w-4 h-4 text-amber-300 mb-2" /><p className="text-xl font-bold tabular-nums">€{outstanding.toFixed(0)}</p><p className="text-[11px] text-muted-foreground">a pagar</p></CardContent></Card>
        <Card className="bg-card/60 border-border/60"><CardContent className="p-4"><Heart className="w-4 h-4 text-rose-300 mb-2" /><p className="text-xl font-bold tabular-nums">{projects.filter((p) => p.status === 'Delivered').length}</p><p className="text-[11px] text-muted-foreground">entregues</p></CardContent></Card>
      </div>

      <Tabs defaultValue="review">
        <TabsList className="grid grid-cols-3 w-full max-w-md h-9">
          <TabsTrigger value="review" className="text-xs gap-1"><GitBranch className="w-3.5 h-3.5" />Revisões</TabsTrigger>
          <TabsTrigger value="projects" className="text-xs gap-1"><FolderKanban className="w-3.5 h-3.5" />Projetos</TabsTrigger>
          <TabsTrigger value="billing" className="text-xs gap-1"><Receipt className="w-3.5 h-3.5" />Faturas</TabsTrigger>
        </TabsList>

        {/* Versions in review */}
        <TabsContent value="review" className="mt-4 space-y-3">
          {loading ? <Skeleton className="h-32" /> : versionsInReview.length === 0 ? (
            <Card className="bg-card/40 border-dashed"><CardContent className="py-10 text-center text-sm text-muted-foreground">Nenhuma versão aguardando sua revisão no momento. 🎵</CardContent></Card>
          ) : (
            versionsInReview.map((v) => <ReviewCard key={v.id} version={v} onReload={load} onOpenProject={() => onOpenProject(v.project.id)} />)
          )}
        </TabsContent>

        {/* Projects */}
        <TabsContent value="projects" className="mt-4">
          <div className="grid gap-3 md:grid-cols-2">
            {loading ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32" />) : projects.map((p) => (
              <Card key={p.id} className="bg-card/60 border-border/60 hover:neon-border transition-all cursor-pointer group" onClick={() => onOpenProject(p.id)}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Badge className={cn('text-[10px]', STATUS_COLORS[p.status])}>{STATUS_LABELS_PT[p.status] ?? p.status}</Badge>
                    <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100" />
                  </div>
                  <p className="font-semibold line-clamp-2">{p.name}</p>
                  <div className="flex items-center justify-between mt-2 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1"><Music2 className="w-3 h-3" />{p.service}</span>
                    {p.deadline && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(p.deadline).toLocaleDateString('pt-BR')}</span>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Billing */}
        <TabsContent value="billing" className="mt-4">
          <Card className="bg-card/60 border-border/60">
            <CardHeader className="pb-3"><CardTitle className="text-base">Suas faturas</CardTitle></CardHeader>
            <CardContent>
              {invoices.length === 0 ? <p className="text-sm text-muted-foreground py-6 text-center">Sem faturas.</p> : (
                <div className="space-y-2">
                  {invoices.map((i) => (
                    <div key={i.id} className="flex items-center gap-3 rounded-lg border border-border/40 bg-background/40 p-3">
                      <Receipt className="w-4 h-4 text-[oklch(0.82_0.29_145)] shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-mono">{i.number}</p>
                        <p className="text-[11px] text-muted-foreground">{i.project?.name}{i.dueDate ? ` · vence ${new Date(i.dueDate).toLocaleDateString('pt-BR')}` : ''}</p>
                      </div>
                      <Badge className={cn('text-[10px]', STATUS_COLORS[i.status])}>{STATUS_LABELS_PT[i.status] ?? i.status}</Badge>
                      <span className="text-sm font-bold">€{i.amount.toFixed(0)}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function ReviewCard({ version, onReload, onOpenProject }: { version: any; onReload: () => void; onOpenProject: () => void }) {
  const [comment, setComment] = useState('')
  const [comments, setComments] = useState<any[]>(version.comments ?? [])

  const approve = async () => { await api.versions.approve(version.id); toast.success('Versão aprovada! O estúdio foi notificado. 🎉'); onReload() }
  const requestChanges = async () => {
    const note = prompt('Que ajuste você gostaria?')
    if (note !== null) { await api.versions.requestChanges(version.id, note); toast.success('Alteração solicitada'); onReload() }
  }
  const sendComment = async () => {
    if (!comment.trim()) return
    const c = await api.versions.comment(version.id, comment)
    setComments([...comments, c]); setComment('')
  }

  return (
    <Card className="bg-card/60 border-border/60 border-violet-500/20">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-semibold flex items-center gap-2"><GitBranch className="w-4 h-4 text-[oklch(0.82_0.29_145)]" />{version.name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{version.project.name} · criada {new Date(version.createdAt).toLocaleDateString('pt-BR')}</p>
          </div>
          <Badge className="text-[10px] bg-violet-500/15 text-violet-300 border-violet-500/30">Em revisão</Badge>
        </div>
        {version.notes && <p className="text-sm text-muted-foreground bg-background/40 rounded-lg p-2.5">{version.notes}</p>}
        <WaveformPlayer
          comments={comments.filter((c) => c.timestamp != null).map((c) => ({ id: c.id, timestamp: c.timestamp, body: c.body, author: c.author?.name }))}
          onAddComment={async (timestamp, body) => {
            const c = await api.versions.comment(version.id, body, timestamp)
            setComments([...comments, c])
            toast.success('Comentário com timestamp adicionado')
          }}
        />
        <div className="flex flex-wrap gap-2">
          <Button size="sm" className="gap-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30" onClick={approve}>
            <CheckCircle2 className="w-3.5 h-3.5" /> Aprovar versão
          </Button>
          <Button size="sm" variant="outline" className="gap-1.5 text-amber-300 border-amber-500/40" onClick={requestChanges}>
            <RotateCcw className="w-3.5 h-3.5" /> Pedir ajuste
          </Button>
          <Button size="sm" variant="ghost" className="gap-1.5" onClick={onOpenProject}>Ver projeto <ChevronRight className="w-3.5 h-3.5" /></Button>
        </div>
        {comments.length > 0 && (
          <div className="space-y-1.5 pt-2 border-t border-border/40">
            <p className="text-xs font-semibold flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5" /> Conversa ({comments.length})</p>
            {comments.map((c) => (
              <div key={c.id} className="rounded bg-background/40 p-2">
                <p className="text-xs">{c.body}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{c.author?.name} · {new Date(c.createdAt).toLocaleString('pt-BR')}</p>
              </div>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <Input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Escreva uma mensagem ao estúdio…" className="h-8 text-xs" onKeyDown={(e) => e.key === 'Enter' && sendComment()} />
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={sendComment}><Send className="w-3.5 h-3.5" /></Button>
        </div>
      </CardContent>
    </Card>
  )
}
