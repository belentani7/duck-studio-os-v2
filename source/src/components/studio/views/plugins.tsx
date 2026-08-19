// BELENTANI OMEGA ULTRA
// Autoría: Pedro Belentani
// Fecha: 2026-08-14
'use client'

import { useEffect, useState, useCallback } from 'react'
import { Plug, Star, ExternalLink, Plus, Search, ShieldAlert, Cpu, Puzzle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { toast } from 'sonner'
import { api } from '@/lib/api-client'
import { PLUGIN_STATUSES, STATUS_LABELS_PT, STATUS_COLORS } from '@/lib/types'
import type { OperationalContext } from '@/lib/types'
import { can } from '@/lib/permissions'
import { cn } from '@/lib/utils'

export function PluginsView({ ctx }: { ctx: OperationalContext }) {
  const [data, setData] = useState<{ plugins: any[]; desktopBridge: boolean; scannerAvailable: any } | null>(null)
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [createOpen, setCreateOpen] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try { setData(await api.plugins.list()) } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const plugins = data?.plugins ?? []
  const filtered = plugins.filter((p) => {
    const q = query.toLowerCase()
    const matchQ = !q || p.name?.toLowerCase().includes(q) || p.developer?.toLowerCase().includes(q) || p.tags?.toLowerCase().includes(q)
    const matchS = statusFilter === 'all' || p.status === statusFilter
    return matchQ && matchS
  })

  const installed = plugins.filter((p) => p.status === 'installed').length
  const missing = plugins.filter((p) => p.status === 'missing' || p.status === 'incompatible').length

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Plugins · Asset Manager</h1>
          <p className="text-sm text-muted-foreground">{plugins.length} plugins no registry · {installed} instalados · {missing} ausentes/incompatíveis</p>
        </div>
        {can(ctx.role, 'plugins:edit') && <CreatePluginDialog open={createOpen} onOpenChange={setCreateOpen} onCreated={load} />}
      </div>

      {/* Capability warning — honestidade sobre limitações do navegador */}
      <Alert className="border-amber-500/30 bg-amber-500/5">
        <ShieldAlert className="w-4 h-4 text-amber-300" />
        <AlertTitle className="text-amber-200">Scanner de plugins indisponível neste runtime</AlertTitle>
        <AlertDescription className="text-amber-200/80 text-xs">
          A detecção real de VST3/AU/AAX no sistema de arquivos requer um <strong>bridge desktop</strong> (Electron/Tauri ou companion service).
          Atualmente executando em <strong>navegador</strong>: os status abaixo refletem o registry cadastrado (não uma varredura em tempo real).
          Nenhum status é inventado — "Instalado" só aparece quando há registro de instalação verificada.
        </AlertDescription>
      </Alert>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar plugin, desenvolvedor, tag…" className="pl-8 h-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[170px] h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos status</SelectItem>
            {PLUGIN_STATUSES.map((s) => <SelectItem key={s} value={s}>{STATUS_LABELS_PT[s] ?? s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)
          : filtered.map((p) => (
            <Card key={p.id} className="bg-card/60 backdrop-blur-sm border-border/60 hover:neon-border transition-all">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-[oklch(0.82_0.29_145/0.12)] flex items-center justify-center shrink-0">
                      <Puzzle className="w-4 h-4 text-[oklch(0.82_0.29_145)]" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{p.name}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{p.developer} · v{p.version}</p>
                    </div>
                  </div>
                  <button
                    onClick={async () => { await api.plugins.update(p.id, { favorite: !p.favorite }); await load() }}
                    className="shrink-0"
                    title="Favorito"
                  >
                    <Star className={cn('w-4 h-4', p.favorite ? 'fill-[oklch(0.82_0.29_145)] text-[oklch(0.82_0.29_145)]' : 'text-muted-foreground')} />
                  </button>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={cn('text-[10px]', STATUS_COLORS[p.status])}>{STATUS_LABELS_PT[p.status] ?? p.status}</Badge>
                  <Badge variant="outline" className="text-[10px]">{p.format}</Badge>
                  <Badge variant="outline" className="text-[10px]">{p.category}</Badge>
                </div>
                {p.notes && <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{p.notes}</p>}
                {p.installations?.length > 0 && (
                  <div className="rounded bg-background/40 p-2 mb-2">
                    <p className="text-[10px] text-muted-foreground font-mono truncate">{p.installations[0].path}</p>
                    <p className="text-[10px] text-emerald-300/70">detectado em {new Date(p.installations[0].lastScanned).toLocaleDateString('pt-BR')}</p>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-1">
                    {p.tags?.split(',').filter(Boolean).slice(0, 3).map((t: string) => (
                      <Badge key={t} variant="secondary" className="text-[9px] py-0 px-1.5">{t.trim()}</Badge>
                    ))}
                  </div>
                  {p.officialUrl && (
                    <a href={p.officialUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-[oklch(0.82_0.29_145)] hover:underline flex items-center gap-1">
                      oficial <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
                {can(ctx.role, 'plugins:edit') && (
                  <Select onValueChange={async (v) => { await api.plugins.update(p.id, { status: v }); await load(); toast.success('Status atualizado') }}>
                    <SelectTrigger className="h-7 mt-3 text-xs"><SelectValue placeholder="Mudar status" /></SelectTrigger>
                    <SelectContent>{PLUGIN_STATUSES.map((s) => <SelectItem key={s} value={s}>{STATUS_LABELS_PT[s] ?? s}</SelectItem>)}</SelectContent>
                  </Select>
                )}
              </CardContent>
            </Card>
          ))}
      </div>
      {!loading && filtered.length === 0 && (
        <Card className="bg-card/40 border-dashed"><CardContent className="py-12 text-center text-sm text-muted-foreground">Nenhum plugin encontrado.</CardContent></Card>
      )}
    </div>
  )
}

function CreatePluginDialog({ open, onOpenChange, onCreated }: { open: boolean; onOpenChange: (v: boolean) => void; onCreated: () => void }) {
  const [form, setForm] = useState({ name: '', developer: '', version: '1.0', format: 'VST3', category: 'Mastering', tags: '', officialUrl: '', notes: '', status: 'known' })
  const [saving, setSaving] = useState(false)
  const submit = async () => {
    if (!form.name) { toast.error('Nome obrigatório'); return }
    setSaving(true)
    try { await api.plugins.create(form); toast.success('Plugin adicionado'); onOpenChange(false); onCreated() }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Erro') }
    finally { setSaving(false) }
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2 bg-[oklch(0.82_0.29_145)] text-background neon-glow"><Plus className="w-4 h-4" /> Adicionar plugin</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Adicionar plugin ao registry</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          <Field label="Nome *"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Desenvolvedor"><Input value={form.developer} onChange={(e) => setForm({ ...form, developer: e.target.value })} /></Field>
            <Field label="Versão"><Input value={form.version} onChange={(e) => setForm({ ...form, version: e.target.value })} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Formato">
              <Select value={form.format} onValueChange={(v) => setForm({ ...form, format: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{['VST3', 'AU', 'AAX', 'CLAP', 'Standalone'].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Status">
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PLUGIN_STATUSES.map((s) => <SelectItem key={s} value={s}>{STATUS_LABELS_PT[s] ?? s}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
          </div>
          <Field label="Categoria"><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></Field>
          <Field label="Tags (vírgula)"><Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} /></Field>
          <Field label="URL oficial"><Input value={form.officialUrl} onChange={(e) => setForm({ ...form, officialUrl: e.target.value })} /></Field>
          <Field label="Notas"><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} /></Field>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button disabled={saving} onClick={submit} className="bg-[oklch(0.82_0.29_145)] text-background">{saving ? 'Salvando…' : 'Adicionar'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-xs">{label}</Label>{children}</div>
}
