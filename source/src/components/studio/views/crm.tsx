// BELENTANI OMEGA ULTRA
// Autoría: Pedro Belentani
// Fecha: 2026-08-14
'use client'

import { useEffect, useState, useCallback } from 'react'
import { Plus, Search, Mail, Phone, Building2, Music, Tag, Trash2, Pencil, History } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { api } from '@/lib/api-client'
import type { OperationalContext } from '@/lib/types'
import { can } from '@/lib/permissions'
import { cn } from '@/lib/utils'
import { OnboardingDialog } from '../onboarding-dialog'

export function CrmView({ ctx }: { ctx: OperationalContext }) {
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<any | null>(null)
  const [open, setOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setClients(await api.clients.list())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = clients.filter((c) => {
    const q = query.toLowerCase()
    return !q || c.name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q) || c.artistName?.toLowerCase().includes(q) || c.tags?.toLowerCase().includes(q)
  })

  const canCreate = can(ctx.role, 'crm:create')
  const canEdit = can(ctx.role, 'crm:edit')

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">CRM · Clientes</h1>
          <p className="text-sm text-muted-foreground">{ctx.role === 'CLIENT' ? 'Seu cadastro' : `${clients.length} clientes cadastrados`}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar cliente…" className="pl-8 w-full sm:w-64 h-9" />
          </div>
          {canCreate && <OnboardingDialog onCreated={load} />}
          {canCreate && <CreateClientDialog open={createOpen} onOpenChange={setCreateOpen} onCreated={load} />}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)
          : filtered.length === 0
            ? <EmptyState text={query ? 'Nenhum cliente encontrado para a busca.' : 'Nenhum cliente cadastrado ainda.'} onCreate={canCreate ? () => setCreateOpen(true) : undefined} />
            : filtered.map((c) => (
              <Card key={c.id} className="bg-card/60 backdrop-blur-sm border-border/60 hover:neon-border transition-all cursor-pointer" onClick={() => { setSelected(c); setOpen(true) }}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[oklch(0.82_0.29_145)] to-[oklch(0.6_0.18_180)] flex items-center justify-center text-sm font-bold text-background shrink-0">
                      {c.name?.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold truncate">{c.name}</p>
                      {c.artistName && <p className="text-xs text-[oklch(0.85_0.32_145)] truncate">{c.artistName}</p>}
                      <p className="text-xs text-muted-foreground truncate mt-1">{c.email}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {c.tags?.split(',').filter(Boolean).map((t: string) => (
                          <Badge key={t} variant="secondary" className="text-[9px] py-0 px-1.5">{t.trim()}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/40 text-[11px] text-muted-foreground">
                    <span>{c._count?.projects ?? 0} projetos</span>
                    <span>{c.invoices?.length ?? 0} faturas</span>
                  </div>
                </CardContent>
              </Card>
            ))}
      </div>

      {/* Client detail sheet */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg p-0 overflow-y-auto">
          {selected && <ClientDetail client={selected} ctx={ctx} canEdit={canEdit} onReload={load} onClose={() => setOpen(false)} />}
        </SheetContent>
      </Sheet>
    </div>
  )
}

function ClientDetail({ client, ctx, canEdit, onReload, onClose }: { client: any; ctx: OperationalContext; canEdit: boolean; onReload: () => void; onClose: () => void }) {
  const [detail, setDetail] = useState<any>(client)
  const [editing, setEditing] = useState(false)

  const reload = useCallback(async () => {
    const d = await api.clients.get(client.id)
    setDetail(d)
  }, [client.id])

  useEffect(() => {
    let cancelled = false
    api.clients.get(client.id).then((d) => { if (!cancelled) setDetail(d) })
    return () => { cancelled = true }
  }, [client.id])

  const save = async (data: any) => {
    await api.clients.update(client.id, data)
    await reload()
    await onReload()
    setEditing(false)
    toast.success('Cliente atualizado')
  }

  return (
    <div className="flex flex-col h-full">
      <SheetHeader className="px-5 py-4 border-b border-border/60">
        <SheetTitle className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[oklch(0.82_0.29_145)] to-[oklch(0.6_0.18_180)] flex items-center justify-center text-sm font-bold text-background">
            {detail.name?.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p>{detail.name}</p>
            {detail.artistName && <p className="text-xs text-[oklch(0.85_0.32_145)] font-normal">{detail.artistName}</p>}
          </div>
        </SheetTitle>
      </SheetHeader>

      <ScrollArea className="flex-1">
        <div className="p-5 space-y-5">
          {editing ? (
            <EditForm client={detail} onSave={save} onCancel={() => setEditing(false)} />
          ) : (
            <>
              <div className="space-y-2">
                <DetailRow icon={Mail} label="Email" value={detail.email} />
                <DetailRow icon={Phone} label="Telefone" value={detail.phone} />
                <DetailRow icon={Building2} label="Empresa" value={detail.company} />
                <DetailRow icon={Music} label="Artista" value={detail.artistName} />
                <DetailRow icon={Tag} label="Tags" value={detail.tags?.split(',').filter(Boolean).join(', ')} />
              </div>
              {detail.notes && (
                <div className="rounded-lg border border-border/40 bg-background/40 p-3">
                  <p className="text-[11px] text-muted-foreground mb-1">Notas</p>
                  <p className="text-sm whitespace-pre-wrap">{detail.notes}</p>
                </div>
              )}
              {canEdit && (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="gap-2" onClick={() => setEditing(true)}>
                    <Pencil className="w-3.5 h-3.5" /> Editar
                  </Button>
                  {can(ctx.role, 'crm:delete') && (
                    <Button size="sm" variant="ghost" className="gap-2 text-rose-300" onClick={async () => {
                      await api.clients.delete(detail.id)
                      await onReload()
                      onClose()
                      toast.success('Cliente removido')
                    }}>
                      <Trash2 className="w-3.5 h-3.5" /> Excluir
                    </Button>
                  )}
                </div>
              )}
            </>
          )}

          {/* Histórico */}
          <div>
            <p className="text-sm font-semibold flex items-center gap-2 mb-2"><History className="w-4 h-4 text-[oklch(0.82_0.29_145)]" /> Histórico</p>
            {detail.histories?.length ? (
              <div className="space-y-2">
                {detail.histories.map((h: any) => (
                  <div key={h.id} className="rounded-lg border border-border/40 bg-background/40 p-2.5">
                    <p className="text-xs font-medium">{h.event}</p>
                    {h.detail && <p className="text-[11px] text-muted-foreground mt-0.5">{h.detail}</p>}
                    <p className="text-[10px] text-muted-foreground mt-1">{new Date(h.createdAt).toLocaleDateString('pt-BR')}</p>
                  </div>
                ))}
              </div>
            ) : <p className="text-xs text-muted-foreground">Sem histórico.</p>}
          </div>

          {/* Projetos */}
          <div>
            <p className="text-sm font-semibold mb-2">Projetos ({detail.projects?.length ?? 0})</p>
            {detail.projects?.length ? (
              <div className="space-y-2">
                {detail.projects.map((p: any) => (
                  <div key={p.id} className="rounded-lg border border-border/40 bg-background/40 p-2.5">
                    <p className="text-xs font-medium truncate">{p.name}</p>
                    <p className="text-[10px] text-muted-foreground">{p.service} · {p.status}</p>
                  </div>
                ))}
              </div>
            ) : <p className="text-xs text-muted-foreground">Sem projetos.</p>}
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}

function DetailRow({ icon: Icon, label, value }: { icon: any; label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div className="flex items-center gap-2.5 text-sm">
      <Icon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
      <span className="text-muted-foreground w-20 text-xs">{label}</span>
      <span className="truncate">{value}</span>
    </div>
  )
}

function EditForm({ client, onSave, onCancel }: { client: any; onSave: (d: any) => void; onCancel: () => void }) {
  const [form, setForm] = useState({
    name: client.name ?? '',
    email: client.email ?? '',
    phone: client.phone ?? '',
    company: client.company ?? '',
    artistName: client.artistName ?? '',
    tags: client.tags ?? '',
    notes: client.notes ?? '',
  })
  return (
    <div className="space-y-3">
      <Field label="Nome"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
      <Field label="Email"><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Telefone"><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
        <Field label="Artista"><Input value={form.artistName} onChange={(e) => setForm({ ...form, artistName: e.target.value })} /></Field>
      </div>
      <Field label="Empresa"><Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} /></Field>
      <Field label="Tags (vírgula)"><Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} /></Field>
      <Field label="Notas"><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} /></Field>
      <div className="flex gap-2 pt-1">
        <Button size="sm" className="bg-[oklch(0.82_0.29_145)] text-background" onClick={() => onSave(form)}>Salvar</Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>Cancelar</Button>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  )
}

function CreateClientDialog({ open, onOpenChange, onCreated }: { open: boolean; onOpenChange: (v: boolean) => void; onCreated: () => void }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', company: '', artistName: '', tags: '', notes: '' })
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    if (!form.name || !form.email) { toast.error('Nome e email são obrigatórios'); return }
    setSaving(true)
    try {
      await api.clients.create(form)
      toast.success('Cliente criado')
      setForm({ name: '', email: '', phone: '', company: '', artistName: '', tags: '', notes: '' })
      onOpenChange(false)
      onCreated()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao criar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2 bg-[oklch(0.82_0.29_145)] text-background hover:bg-[oklch(0.75_0.28_145)] neon-glow">
          <Plus className="w-4 h-4" /> Novo cliente
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Novo cliente</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <Field label="Nome *"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Email *"><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Telefone"><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
            <Field label="Artista"><Input value={form.artistName} onChange={(e) => setForm({ ...form, artistName: e.target.value })} /></Field>
          </div>
          <Field label="Tags (vírgula)"><Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} /></Field>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button disabled={saving} onClick={submit} className="bg-[oklch(0.82_0.29_145)] text-background">{saving ? 'Salvando…' : 'Criar'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function EmptyState({ text, onCreate }: { text: string; onCreate?: () => void }) {
  return (
    <Card className="col-span-full bg-card/40 border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center gap-3">
        <p className="text-sm text-muted-foreground">{text}</p>
        {onCreate && <Button size="sm" className="gap-2 bg-[oklch(0.82_0.29_145)] text-background" onClick={onCreate}><Plus className="w-4 h-4" /> Criar primeiro cliente</Button>}
      </CardContent>
    </Card>
  )
}
