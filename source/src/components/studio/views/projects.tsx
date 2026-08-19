// BELENTANI OMEGA ULTRA
// Autoría: Pedro Belentani
// Fecha: 2026-08-14
'use client'

import { useEffect, useState, useCallback } from 'react'
import { Plus, FolderKanban, Calendar, Euro, ChevronRight, Filter } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { api } from '@/lib/api-client'
import { PROJECT_STATUSES, STATUS_LABELS_PT, STATUS_COLORS } from '@/lib/types'
import type { OperationalContext } from '@/lib/types'
import { can } from '@/lib/permissions'
import { cn } from '@/lib/utils'

export function ProjectsView({ ctx, onOpenProject }: { ctx: OperationalContext; onOpenProject: (id: string) => void }) {
  const [projects, setProjects] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [createOpen, setCreateOpen] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [p, c] = await Promise.all([
        api.projects.list(statusFilter !== 'all' ? { status: statusFilter } : undefined),
        ctx.role === 'CLIENT' ? Promise.resolve([]) : api.clients.list(),
      ])
      setProjects(p)
      setClients(c)
    } finally {
      setLoading(false)
    }
  }, [statusFilter, ctx.role])

  useEffect(() => { load() }, [load])

  const canCreate = can(ctx.role, 'projects:create')

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projetos</h1>
          <p className="text-sm text-muted-foreground">{ctx.role === 'CLIENT' ? 'Seus projetos' : `${projects.length} projetos`}</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px] h-9">
              <Filter className="w-3.5 h-3.5 mr-1 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              {PROJECT_STATUSES.map((s) => <SelectItem key={s} value={s}>{STATUS_LABELS_PT[s] ?? s}</SelectItem>)}
            </SelectContent>
          </Select>
          {canCreate && <CreateProjectDialog open={createOpen} onOpenChange={setCreateOpen} clients={clients} onCreated={load} />}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-36 rounded-xl" />)
          : projects.length === 0
            ? <EmptyState text="Nenhum projeto encontrado." onCreate={canCreate ? () => setCreateOpen(true) : undefined} />
            : projects.map((p) => (
              <Card key={p.id} className="bg-card/60 backdrop-blur-sm border-border/60 hover:neon-border transition-all cursor-pointer group" onClick={() => onOpenProject(p.id)}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <Badge className={cn('text-[10px]', STATUS_COLORS[p.status])}>{STATUS_LABELS_PT[p.status] ?? p.status}</Badge>
                    <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className="font-semibold leading-tight line-clamp-2">{p.name}</p>
                  <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1"><FolderKanban className="w-3 h-3" /> {p.service}</span>
                    {p.client && <span className="truncate">{p.client.name}</span>}
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/40 text-[11px]">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      {p.deadline && <><Calendar className="w-3 h-3" /> {new Date(p.deadline).toLocaleDateString('pt-BR')}</>}
                    </span>
                    <div className="flex items-center gap-3">
                      {p.price > 0 && <span className="flex items-center gap-0.5"><Euro className="w-3 h-3" />{p.price}</span>}
                      <span className="text-muted-foreground">{p._count?.versions ?? 0}v · {p._count?.files ?? 0}f · {p._count?.tasks ?? 0}t</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
      </div>
    </div>
  )
}

function CreateProjectDialog({ open, onOpenChange, clients, onCreated }: { open: boolean; onOpenChange: (v: boolean) => void; clients: any[]; onCreated: () => void }) {
  const [form, setForm] = useState({ name: '', clientId: '', service: 'Mastering', status: 'Lead', price: 0, deadline: '', description: '' })
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    if (!form.name || !form.clientId) { toast.error('Nome e cliente obrigatórios'); return }
    setSaving(true)
    try {
      await api.projects.create({ ...form, price: Number(form.price) || 0, deadline: form.deadline || undefined })
      toast.success('Projeto criado')
      setForm({ name: '', clientId: '', service: 'Mastering', status: 'Lead', price: 0, deadline: '', description: '' })
      onOpenChange(false)
      onCreated()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2 bg-[oklch(0.82_0.29_145)] text-background hover:bg-[oklch(0.75_0.28_145)] neon-glow">
          <Plus className="w-4 h-4" /> Novo projeto
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Novo projeto</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          <Field label="Nome *"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Cliente *">
            <Select value={form.clientId} onValueChange={(v) => setForm({ ...form, clientId: v })}>
              <SelectTrigger><SelectValue placeholder="Selecionar cliente…" /></SelectTrigger>
              <SelectContent>{clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Serviço">
              <Select value={form.service} onValueChange={(v) => setForm({ ...form, service: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['Mastering', 'Mixing', 'Mix & Master', 'Produção', 'Edição Vocal', 'Beatmaking'].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Status">
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PROJECT_STATUSES.map((s) => <SelectItem key={s} value={s}>{STATUS_LABELS_PT[s] ?? s}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Preço (€)"><Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} /></Field>
            <Field label="Prazo"><Input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} /></Field>
          </div>
          <Field label="Descrição"><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} /></Field>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button disabled={saving} onClick={submit} className="bg-[oklch(0.82_0.29_145)] text-background">{saving ? 'Salvando…' : 'Criar'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-xs">{label}</Label>{children}</div>
}

function EmptyState({ text, onCreate }: { text: string; onCreate?: () => void }) {
  return (
    <Card className="col-span-full bg-card/40 border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center gap-3">
        <p className="text-sm text-muted-foreground">{text}</p>
        {onCreate && <Button size="sm" className="gap-2 bg-[oklch(0.82_0.29_145)] text-background" onClick={onCreate}><Plus className="w-4 h-4" /> Criar projeto</Button>}
      </CardContent>
    </Card>
  )
}
