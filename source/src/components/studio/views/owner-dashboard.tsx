// BELENTANI OMEGA ULTRA
// Autoría: Pedro Belentani
// Fecha: 2026-08-14
'use client'

import { useEffect, useState } from 'react'
import {
  Users, FolderKanban, ListTodo, GitBranch, Plug, Receipt, TrendingUp,
  Clock, AlertTriangle, ArrowRight, CheckCircle2, Activity as ActivityIcon, Cpu,
  Zap, Workflow,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/lib/api-client'
import { STATUS_LABELS_PT, STATUS_COLORS } from '@/lib/types'
import type { OperationalContext } from '@/lib/types'
import type { ViewId } from '../studio-shell'
import { cn } from '@/lib/utils'

interface Stats {
  role: string
  clientsCount: number
  activeProjects: number
  pendingTasks: number
  versionsInReview: number
  pluginsInstalled: number
  pluginsTotal: number
  outstanding: number
  outstandingCount: number
  recentActivity: any[]
  upcomingDeadlines: any[]
  projectsByStatus: { status: string; _count: number }[]
  automationsTotal: number
  automationsActive: number
  chainsTotal: number
  isDemo: boolean
}

export function OwnerDashboard({
  ctx,
  onOpenProject,
  onNavigate,
}: {
  ctx: OperationalContext
  onOpenProject: (id: string) => void
  onNavigate: (v: ViewId) => void
}) {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.stats().then(setStats).finally(() => setLoading(false))
  }, [])

  const statCards = [
    { label: 'Clientes', value: stats?.clientsCount, icon: Users, color: 'text-[oklch(0.82_0.29_145)]', view: 'crm' as ViewId },
    { label: 'Projetos ativos', value: stats?.activeProjects, icon: FolderKanban, color: 'text-cyan-300', view: 'projects' as ViewId },
    { label: 'Tarefas pendentes', value: stats?.pendingTasks, icon: ListTodo, color: 'text-amber-300', view: 'projects' as ViewId },
    { label: 'Versões em revisão', value: stats?.versionsInReview, icon: GitBranch, color: 'text-violet-300', view: 'projects' as ViewId },
    { label: 'Plugins instalados', value: stats ? `${stats.pluginsInstalled}/${stats.pluginsTotal}` : null, icon: Plug, color: 'text-[oklch(0.82_0.29_145)]', view: 'plugins' as ViewId },
    { label: 'Cadeias', value: stats?.chainsTotal, icon: Workflow, color: 'text-[oklch(0.85_0.32_145)]', view: 'chains' as ViewId },
    { label: 'Automações ativas', value: stats ? `${stats.automationsActive}/${stats.automationsTotal}` : null, icon: Zap, color: 'text-cyan-300', view: 'automations' as ViewId },
    { label: 'A receber', value: stats ? `€${stats.outstanding.toFixed(0)}` : null, icon: Receipt, color: 'text-emerald-300', view: 'finance' as ViewId },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Bem-vindo, <span className="neon-text text-[oklch(0.85_0.32_145)]">{ctx.userName}</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Command Center · {ctx.studioName}
            {ctx.isDemo && <span className="ml-2 text-amber-300">(DEMO WORKSPACE)</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-[oklch(0.82_0.29_145/0.4)] text-[oklch(0.85_0.32_145)]">
            <Cpu className="w-3 h-3 mr-1" />
            {ctx.capabilities.filter((c) => c.healthy).length}/{ctx.capabilities.length} caps
          </Badge>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {statCards.map((s) => {
          const Icon = s.icon
          return (
            <Card
              key={s.label}
              className="bg-card/60 backdrop-blur-sm border-border/60 hover:neon-border transition-all cursor-pointer group"
              onClick={() => onNavigate(s.view)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Icon className={cn('w-4 h-4', s.color)} />
                  <ArrowRight className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="text-2xl font-bold tabular-nums">
                  {loading ? <Skeleton className="h-7 w-12" /> : s.value ?? 0}
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">{s.label}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Main grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Activity feed */}
        <Card className="lg:col-span-2 bg-card/60 backdrop-blur-sm border-border/60">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <ActivityIcon className="w-4 h-4 text-[oklch(0.82_0.29_145)]" />
                Atividade recente
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => onNavigate('projects')}>
                Ver projetos <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : stats?.recentActivity?.length ? (
              <ScrollArea className="h-[340px] pr-3">
                <div className="space-y-2">
                  {stats.recentActivity.map((a) => (
                    <div key={a.id} className="flex items-start gap-3 rounded-lg border border-border/40 bg-background/40 p-3">
                      <div className="w-8 h-8 rounded-full bg-[oklch(0.82_0.29_145/0.12)] flex items-center justify-center shrink-0">
                        <ActivityIcon className="w-3.5 h-3.5 text-[oklch(0.82_0.29_145)]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm">{a.detail}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {a.actor?.name ?? 'sistema'} · {new Date(a.createdAt).toLocaleString('pt-BR')}
                          {a.project && <span className="ml-1">· {a.project.name}</span>}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <EmptyState text="Nenhuma atividade registrada ainda." />
            )}
          </CardContent>
        </Card>

        {/* Upcoming deadlines */}
        <Card className="bg-card/60 backdrop-blur-sm border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-300" />
              Prazos próximos
            </CardTitle>
            <CardDescription className="text-xs">Projetos com prazo futuro</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
            ) : stats?.upcomingDeadlines?.length ? (
              <div className="space-y-2">
                {stats.upcomingDeadlines.map((p) => {
                  const days = Math.ceil((new Date(p.deadline).getTime() - Date.now()) / 86400000)
                  return (
                    <button
                      key={p.id}
                      onClick={() => onOpenProject(p.id)}
                      className="w-full text-left rounded-lg border border-border/40 bg-background/40 p-3 hover:neon-border transition-all"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium truncate">{p.name}</p>
                        <Badge className={cn('text-[10px]', STATUS_COLORS[p.status])}>{STATUS_LABELS_PT[p.status]}</Badge>
                      </div>
                      <div className="flex items-center justify-between mt-1.5">
                        <p className="text-[11px] text-muted-foreground truncate">{p.client?.name}</p>
                        <span className={cn('text-[11px] font-mono', days <= 2 ? 'text-rose-300' : days <= 5 ? 'text-amber-300' : 'text-muted-foreground')}>
                          {days <= 0 ? 'hoje' : `${days}d`}
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
            ) : (
              <EmptyState text="Nenhum prazo futuro." />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Projects by status */}
      <Card className="bg-card/60 backdrop-blur-sm border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[oklch(0.82_0.29_145)]" />
            Pipeline por status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-24 w-full" />
          ) : stats?.projectsByStatus?.length ? (
            <div className="flex flex-wrap gap-2">
              {stats.projectsByStatus.map((s) => (
                <div key={s.status} className="flex items-center gap-2 rounded-lg border border-border/40 bg-background/40 px-3 py-2">
                  <Badge className={cn('text-[10px]', STATUS_COLORS[s.status] ?? 'bg-zinc-500/15 text-zinc-300')}>
                    {STATUS_LABELS_PT[s.status] ?? s.status}
                  </Badge>
                  <span className="text-sm font-bold tabular-nums">{s._count}</span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState text="Sem projetos para agrupar." />
          )}
        </CardContent>
      </Card>

      {/* Capability quick glance */}
      <Card className="bg-card/60 backdrop-blur-sm border-border/60">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Cpu className="w-4 h-4 text-[oklch(0.82_0.29_145)]" />
              Capacidades do sistema
            </CardTitle>
            <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => onNavigate('capabilities')}>
              Detalhes <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {ctx.capabilities.map((c) => (
              <div key={c.key} className="flex items-center gap-2 rounded-lg border border-border/40 bg-background/40 px-3 py-2">
                {c.healthy ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                ) : (
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="text-xs font-mono truncate">{c.key}</p>
                  {c.reason && <p className="text-[10px] text-muted-foreground truncate">{c.reason}</p>}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  )
}
