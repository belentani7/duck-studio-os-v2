// BELENTANI OMEGA ULTRA
// Autoría: Pedro Belentani
// Fecha: 2026-08-14
'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Workflow, Plus, Star, Trash2, Play, Layers, Music, Tag, ArrowDown, GitBranch, Copy, CheckCircle2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { toast } from 'sonner'
import { api } from '@/lib/api-client'
import type { OperationalContext } from '@/lib/types'
import { can } from '@/lib/permissions'
import { cn } from '@/lib/utils'

const CATEGORIES = [
  { value: 'mastering', label: 'Mastering', color: 'border-[oklch(0.82_0.29_145/0.4)] text-[oklch(0.85_0.32_145)]' },
  { value: 'mixing', label: 'Mixing', color: 'border-cyan-500/40 text-cyan-300' },
  { value: 'vocal', label: 'Vocal', color: 'border-violet-500/40 text-violet-300' },
  { value: 'bus', label: 'Bus', color: 'border-amber-500/40 text-amber-300' },
  { value: 'stereo', label: 'Stereo', color: 'border-rose-500/40 text-rose-300' },
]

async function copyText(text: string) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    // fall through to legacy copy
  }

  try {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.setAttribute('readonly', 'true')
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    textarea.style.pointerEvents = 'none'
    document.body.appendChild(textarea)
    textarea.focus()
    textarea.select()
    textarea.setSelectionRange(0, textarea.value.length)
    const ok = document.execCommand('copy')
    document.body.removeChild(textarea)
    return ok
  } catch {
    return false
  }
}

function buildApplyCommand(chain: any) {
  return `curl -X POST http://localhost:3000/api/chains/${chain.id}`
}

export function ChainsView({ ctx }: { ctx: OperationalContext }) {
  const [chains, setChains] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [createOpen, setCreateOpen] = useState(false)
  const canEdit = can(ctx.role, 'projects:edit')

  const load = useCallback(async () => {
    setLoading(true)
    try { setChains(await api.chains.list()) } finally { setLoading(false) }
  }, [])

  useEffect(() => {
    let cancelled = false
    api.chains.list().then((c) => { if (!cancelled) setChains(c) }).finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const filtered = filter === 'all' ? chains : chains.filter((c) => c.category === filter)
  const favorites = chains.filter((c) => c.favorite)

  const toggleFav = async (chain: any) => {
    await api.chains.update(chain.id, { favorite: !chain.favorite })
    await load()
  }
  const apply = async (chain: any) => {
    await api.chains.apply(chain.id)
    await load()
    toast.success(`Cadeia "${chain.name}" aplicada (+1 uso)`)
  }
  const remove = async (id: string) => {
    await api.chains.delete(id)
    await load()
    toast.success('Cadeia removida')
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Workflow className="w-6 h-6 text-[oklch(0.82_0.29_145)]" /> Cadeias & Presets
          </h1>
          <p className="text-sm text-muted-foreground">{chains.length} cadeias de processamento · biblioteca reutilizável</p>
        </div>
        {canEdit && <CreateChainDialog open={createOpen} onOpenChange={setCreateOpen} onCreated={load} />}
      </div>

      {/* Favorites */}
      {favorites.length > 0 && (
        <Card className="bg-card/40 border-[oklch(0.82_0.29_145/0.2)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><Star className="w-4 h-4 text-[oklch(0.82_0.29_145)] fill-[oklch(0.82_0.29_145)]" /> Favoritas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {favorites.map((c) => {
                const cat = CATEGORIES.find((x) => x.value === c.category)
                return (
                  <button key={c.id} onClick={() => apply(c)} className="flex items-center gap-2 rounded-lg border border-border/60 bg-background/40 px-3 py-1.5 hover:neon-border transition-all">
                    <Layers className="w-3 h-3 text-[oklch(0.82_0.29_145)]" />
                    <span className="text-xs font-medium">{c.name}</span>
                    {cat && <Badge variant="outline" className={cn('text-[9px] py-0 px-1', cat.color)}>{cat.label}</Badge>}
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filter */}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setFilter('all')} className={cn('text-xs px-3 py-1.5 rounded-full border transition-all', filter === 'all' ? 'bg-[oklch(0.82_0.29_145/0.12)] text-[oklch(0.85_0.32_145)] neon-border' : 'border-border/60 text-muted-foreground hover:text-foreground')}>Todas</button>
        {CATEGORIES.map((c) => (
          <button key={c.value} onClick={() => setFilter(c.value)} className={cn('text-xs px-3 py-1.5 rounded-full border transition-all', filter === c.value ? cn(c.color, 'border') : 'border-border/60 text-muted-foreground hover:text-foreground')}>{c.label}</button>
        ))}
      </div>

      {/* Chains list */}
      <div className="grid gap-3 md:grid-cols-2">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)
        ) : filtered.length === 0 ? (
          <Card className="col-span-full bg-card/40 border-dash rounded"><CardContent className="py-12 text-center text-sm text-muted-foreground">Nenhuma cadeia nesta categoria.</CardContent></Card>
        ) : (
          filtered.map((chain) => <ChainCard key={chain.id} chain={chain} canEdit={canEdit} onToggleFav={() => toggleFav(chain)} onApply={() => apply(chain)} onDelete={() => remove(chain.id)} />)
        )}
      </div>
    </div>
  )
}

function ChainCard({ chain, canEdit, onToggleFav, onApply, onDelete }: { chain: any; canEdit: boolean; onToggleFav: () => void; onApply: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const cat = CATEGORIES.find((c) => c.value === chain.category)
  let steps: any[] = []
  try { steps = JSON.parse(chain.steps) } catch { /* ignore */ }
  const applyCommand = buildApplyCommand(chain)

  return (
    <Card className="bg-card/60 border-border/60 hover:neon-border transition-all">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0">
            <p className="font-semibold text-sm flex items-center gap-2"><Layers className="w-4 h-4 text-[oklch(0.82_0.29_145)] shrink-0" />{chain.name}</p>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              {cat && <Badge variant="outline" className={cn('text-[9px] py-0 px-1.5', cat.color)}>{cat.label}</Badge>}
              {chain.genre && <Badge variant="secondary" className="text-[9px] py-0 px-1.5"><Music className="w-2.5 h-2.5 mr-0.5" />{chain.genre}</Badge>}
              <span className="text-[10px] text-muted-foreground">{steps.length} passos · {chain.uses} usos</span>
            </div>
          </div>
          {canEdit && (
            <button onClick={onToggleFav} className="shrink-0">
              <Star className={cn('w-4 h-4', chain.favorite ? 'fill-[oklch(0.82_0.29_145)] text-[oklch(0.82_0.29_145)]' : 'text-muted-foreground')} />
            </button>
          )}
        </div>

        {chain.description && <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{chain.description}</p>}

        {/* Steps preview */}
        <div className="space-y-1.5">
          {steps.slice(0, open ? undefined : 3).map((step, i) => (
            <div key={i} className="flex items-center gap-2 rounded bg-background/40 p-1.5">
              <span className="w-4 h-4 rounded-full bg-[oklch(0.82_0.29_145/0.15)] text-[oklch(0.85_0.32_145)] text-[9px] font-mono flex items-center justify-center shrink-0">{step.order ?? i + 1}</span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium truncate">{step.plugin}</p>
                {step.settings && <p className="text-[10px] text-muted-foreground truncate font-mono">{step.settings}</p>}
              </div>
            </div>
          ))}
          {steps.length > 3 && (
            <Collapsible open={open} onOpenChange={setOpen}>
              <CollapsibleTrigger asChild>
                <button className="w-full text-[11px] text-[oklch(0.82_0.29_145)] hover:underline flex items-center justify-center gap-1 pt-1">
                  {open ? 'Recolher' : `Ver ${steps.length - 3} passos restantes`}
                  <ArrowDown className={cn('w-3 h-3 transition-transform', open && 'rotate-180')} />
                </button>
              </CollapsibleTrigger>
            </Collapsible>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/40">
          <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={onApply}><Play className="w-3 h-3" /> Aplicar</Button>
          <Button
            size="sm"
            variant="outline"
            className={cn(
              'h-7 gap-1 text-xs',
              copied && 'border-emerald-500/40 text-emerald-300'
            )}
            onClick={async () => {
              const ok = await copyText(applyCommand)
              if (!ok) {
                toast.error('No se pudo copiar el comando')
                return
              }
              setCopied(true)
              toast.success('Comando copiado')
              window.setTimeout(() => setCopied(false), 1500)
            }}
            title="Copiar comando de aplicación"
            aria-label="Copiar comando de aplicación"
          >
            {copied ? <><CheckCircle2 className="w-3 h-3" /> Copiado</> : <><Copy className="w-3 h-3" /> Copiar comando</>}
          </Button>
          {canEdit && <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-rose-300" onClick={onDelete}><Trash2 className="w-3.5 h-3.5" /></Button>}
        </div>
      </CardContent>
    </Card>
  )
}

function CreateChainDialog({ open, onOpenChange, onCreated }: { open: boolean; onOpenChange: (v: boolean) => void; onCreated: () => void }) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState('mastering')
  const [genre, setGenre] = useState('')
  const [description, setDescription] = useState('')
  const [steps, setSteps] = useState('[\n  {"plugin": "FabFilter Pro-Q 4", "order": 1, "settings": "HPF 30Hz", "notes": "Limpeza"},\n  {"plugin": "FabFilter Pro-L 3", "order": 2, "settings": "True peak -1dB", "notes": "Limit"}\n]')
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    if (!name.trim()) { toast.error('Nome obrigatório'); return }
    setSaving(true)
    try {
      await api.chains.create({ name, category, genre: genre || null, description: description || null, steps, favorite: false })
      toast.success('Cadeia criada')
      setName(''); setGenre(''); setDescription('')
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
        <Button size="sm" className="gap-2 bg-[oklch(0.82_0.29_145)] text-background neon-glow"><Plus className="w-4 h-4" /> Nova cadeia</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>Criar cadeia de processamento</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2 max-h-[60vh] overflow-y-auto">
          <div className="space-y-1.5"><Label className="text-xs">Nome *</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Master Pop Moderno" /></div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Categoria</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label className="text-xs">Gênero (opcional)</Label><Input value={genre} onChange={(e) => setGenre(e.target.value)} placeholder="pop, trap, indie…" /></div>
          </div>
          <div className="space-y-1.5"><Label className="text-xs">Descrição</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Para que serve esta cadeia?" /></div>
          <div className="space-y-1.5">
            <Label className="text-xs">Passos (JSON array)</Label>
            <Textarea value={steps} onChange={(e) => setSteps(e.target.value)} rows={6} className="font-mono text-xs" />
            <p className="text-[10px] text-muted-foreground">Cada passo: {'{ plugin, order, settings, notes }'}</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button disabled={saving} onClick={submit} className="bg-[oklch(0.82_0.29_145)] text-background">{saving ? 'Criando…' : 'Criar'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
