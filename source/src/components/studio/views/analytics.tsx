// BELENTANI OMEGA ULTRA
// Autoría: Pedro Belentani
// Fecha: 2026-08-14
'use client'

import { useEffect, useState } from 'react'
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip as RechartTooltip, ResponsiveContainer, Legend,
} from 'recharts'
import {
  TrendingUp, PieChart as PieIcon, Activity, Target, Zap, Users, CheckCircle2,
  BarChart3, RefreshCw,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/lib/api-client'
import type { OperationalContext } from '@/lib/types'
import { cn } from '@/lib/utils'

const STATUS_PIE_COLORS = ['#0d9488', '#0891b2', '#7c3aed', '#c026d3', '#db2777', '#ea580c', '#ca8a04', '#16a34a', '#dc2626', '#6b7280', '#9333ea', '#0284c7', '#65a30d', '#b45309', '#be123c']
const NEON = 'oklch(0.85 0.32 145)'

export function AnalyticsView({ ctx }: { ctx: OperationalContext }) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    api.analytics().then((d) => { if (!cancelled) setData(d) }).catch(() => {}).finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const reload = () => { setLoading(true); api.analytics().then(setData).finally(() => setLoading(false)) }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid md:grid-cols-2 gap-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-64 rounded-xl" />)}</div>
      </div>
    )
  }
  if (!data) return <p className="text-sm text-muted-foreground">Sem dados de analytics.</p>

  const statusPieData = data.projectsByStatus.map((s: any, i: number) => ({ name: s.status, value: s._count, fill: STATUS_PIE_COLORS[i % STATUS_PIE_COLORS.length] }))
  const serviceBarData = data.projectsByService.map((s: any) => ({ name: s.service, projetos: s._count }))
  const topClientsData = data.topClients.map((c: any) => ({ name: c.name.split(' ')[0], projetos: c.projects, receita: c.revenue }))

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-[oklch(0.82_0.29_145)]" /> Analytics
          </h1>
          <p className="text-sm text-muted-foreground">Métricas reais do estúdio · receita, projetos, produtividade</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2" onClick={reload}><RefreshCw className="w-3.5 h-3.5" /> Atualizar</Button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="Taxa conclusão tarefas" value={`${data.taskCompletionRate}%`} sub={`${data.tasksDone}/${data.tasksTotal}`} icon={CheckCircle2} color="text-emerald-300" />
        <KpiCard label="Taxa aprovação versões" value={`${data.versionApprovalRate}%`} sub={`${data.versionsApproved}/${data.versionsTotal}`} icon={Target} color="text-[oklch(0.85_0.32_145)]" />
        <KpiCard label="Receita anual (pago)" value={`€${data.revenueByMonth.reduce((s: number, m: any) => s + m.revenue, 0).toFixed(0)}`} sub={`${data.revenueByMonth.filter((m: any) => m.count > 0).length} meses com faturas`} icon={TrendingUp} color="text-cyan-300" />
        <KpiCard label="Clientes ativos" value={String(data.topClients.length)} sub="top 5 por projetos" icon={Users} color="text-violet-300" />
      </div>

      {/* Revenue line chart */}
      <Card className="bg-card/60 border-border/60">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2"><TrendingUp className="w-4 h-4 text-[oklch(0.82_0.29_145)]" /> Receita mensal ({new Date().getFullYear()})</CardTitle>
          <CardDescription className="text-xs">Faturas pagas por mês em €</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={data.revenueByMonth} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.3 0.02 160 / 30%)" />
              <XAxis dataKey="month" tick={{ fill: 'oklch(0.7 0.02 160)', fontSize: 11 }} axisLine={{ stroke: 'oklch(0.3 0.02 160 / 50%)' }} />
              <YAxis tick={{ fill: 'oklch(0.7 0.02 160)', fontSize: 11 }} axisLine={{ stroke: 'oklch(0.3 0.02 160 / 50%)' }} />
              <RechartTooltip contentStyle={{ background: 'oklch(0.2 0.014 200)', border: '1px solid oklch(0.82 0.29 145 / 40%)', borderRadius: '8px', fontSize: '12px' }} />
              <Line type="monotone" dataKey="revenue" stroke={NEON} strokeWidth={2.5} dot={{ fill: NEON, r: 4 }} activeDot={{ r: 6, fill: NEON }} name="Receita (€)" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Two-column: status pie + service bar */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="bg-card/60 border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2"><PieIcon className="w-4 h-4 text-[oklch(0.82_0.29_145)]" /> Projetos por status</CardTitle>
          </CardHeader>
          <CardContent>
            {statusPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={statusPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
                    {statusPieData.map((entry: any, i: number) => <Cell key={i} fill={entry.fill} />)}
                  </Pie>
                  <RechartTooltip contentStyle={{ background: 'oklch(0.2 0.014 200)', border: '1px solid oklch(0.82 0.29 145 / 40%)', borderRadius: '8px', fontSize: '12px' }} />
                  <Legend wrapperStyle={{ fontSize: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : <p className="text-sm text-muted-foreground py-16 text-center">Sem projetos para agrupar.</p>}
          </CardContent>
        </Card>

        <Card className="bg-card/60 border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2"><BarChart3 className="w-4 h-4 text-[oklch(0.82_0.29_145)]" /> Projetos por serviço</CardTitle>
          </CardHeader>
          <CardContent>
            {serviceBarData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={serviceBarData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.3 0.02 160 / 30%)" />
                  <XAxis dataKey="name" tick={{ fill: 'oklch(0.7 0.02 160)', fontSize: 10 }} axisLine={{ stroke: 'oklch(0.3 0.02 160 / 50%)' }} />
                  <YAxis tick={{ fill: 'oklch(0.7 0.02 160)', fontSize: 11 }} axisLine={{ stroke: 'oklch(0.3 0.02 160 / 50%)' }} allowDecimals={false} />
                  <RechartTooltip contentStyle={{ background: 'oklch(0.2 0.014 200)', border: '1px solid oklch(0.82 0.29 145 / 40%)', borderRadius: '8px', fontSize: '12px' }} />
                  <Bar dataKey="projetos" fill={NEON} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-sm text-muted-foreground py-16 text-center">Sem projetos para agrupar.</p>}
          </CardContent>
        </Card>
      </div>

      {/* Activity trend + top clients */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="bg-card/60 border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2"><Activity className="w-4 h-4 text-[oklch(0.82_0.29_145)]" /> Atividade (7 dias)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.activityByDay} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.3 0.02 160 / 30%)" />
                <XAxis dataKey="day" tick={{ fill: 'oklch(0.7 0.02 160)', fontSize: 11 }} axisLine={{ stroke: 'oklch(0.3 0.02 160 / 50%)' }} />
                <YAxis tick={{ fill: 'oklch(0.7 0.02 160)', fontSize: 11 }} axisLine={{ stroke: 'oklch(0.3 0.02 160 / 50%)' }} allowDecimals={false} />
                <RechartTooltip contentStyle={{ background: 'oklch(0.2 0.014 200)', border: '1px solid oklch(0.82 0.29 145 / 40%)', borderRadius: '8px', fontSize: '12px' }} />
                <Bar dataKey="activities" fill="oklch(0.6 0.18 190)" radius={[4, 4, 0, 0]} name="Atividades" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-card/60 border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2"><Users className="w-4 h-4 text-[oklch(0.82_0.29_145)]" /> Top clientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {topClientsData.length > 0 ? topClientsData.map((c: any, i: number) => (
                <div key={i} className="flex items-center gap-3 rounded-lg border border-border/40 bg-background/40 p-2.5">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[oklch(0.82_0.29_145)] to-[oklch(0.6_0.18_180)] flex items-center justify-center text-[10px] font-bold text-background shrink-0">{i + 1}</div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{c.name}</p>
                    <p className="text-[10px] text-muted-foreground">{c.projetos} projetos</p>
                  </div>
                  <span className="text-sm font-bold tabular-nums text-[oklch(0.85_0.32_145)]">€{c.receita.toFixed(0)}</span>
                </div>
              )) : <p className="text-sm text-muted-foreground py-8 text-center">Sem clientes ainda.</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function KpiCard({ label, value, sub, icon: Icon, color }: { label: string; value: string; sub?: string; icon: any; color: string }) {
  return (
    <Card className="bg-card/60 border-border/60">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <Icon className={cn('w-4 h-4', color)} />
        </div>
        <p className="text-2xl font-bold tabular-nums">{value}</p>
        <p className="text-[11px] text-muted-foreground">{label}</p>
        {sub && <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  )
}
