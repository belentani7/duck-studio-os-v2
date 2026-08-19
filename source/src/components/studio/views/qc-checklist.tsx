// BELENTANI OMEGA ULTRA
// Autoría: Pedro Belentani
// Fecha: 2026-08-14
'use client'

import { useEffect, useState, useCallback } from 'react'
import { CheckCircle2, Circle, Plus, ListChecks, RotateCcw, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { api } from '@/lib/api-client'
import type { OperationalContext } from '@/lib/types'
import { can } from '@/lib/permissions'
import { cn } from '@/lib/utils'

const CATEGORY_LABELS: Record<string, string> = {
  format: 'Formato',
  levels: 'Níveis & Loudness',
  fades: 'Fades & Edição',
  metadata: 'Metadados',
  delivery: 'Entrega',
  artistic: 'Artístico',
  general: 'Geral',
}

const CATEGORY_COLORS: Record<string, string> = {
  format: 'border-cyan-500/40 text-cyan-300',
  levels: 'border-[oklch(0.82_0.29_145/0.4)] text-[oklch(0.85_0.32_145)]',
  fades: 'border-violet-500/40 text-violet-300',
  metadata: 'border-amber-500/40 text-amber-300',
  delivery: 'border-emerald-500/40 text-emerald-300',
  artistic: 'border-rose-500/40 text-rose-300',
  general: 'border-zinc-500/40 text-zinc-300',
}

export function QcChecklist({ projectId, ctx }: { projectId: string; ctx: OperationalContext }) {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [newLabel, setNewLabel] = useState('')
  const [newCategory, setNewCategory] = useState('general')
  const canEdit = can(ctx.role, 'projects:edit')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.qc.get(projectId)
      setItems(res.items)
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    let cancelled = false
    api.qc.get(projectId).then((res) => { if (!cancelled) setItems(res.items) }).finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [projectId])

  const toggle = async (item: any) => {
    if (!canEdit) return
    setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, checked: !i.checked } : i))
    try {
      await api.qc.toggle(projectId, item.id, !item.checked)
    } catch {
      setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, checked: item.checked } : i))
      toast.error('Erro ao atualizar QC')
    }
  }

  const add = async () => {
    if (!newLabel.trim()) return
    try {
      const item = await api.qc.add(projectId, newLabel, newCategory)
      setItems((prev) => [...prev, item])
      setNewLabel('')
      toast.success('Item adicionado ao QC')
    } catch {
      toast.error('Erro ao adicionar item')
    }
  }

  const checkedCount = items.filter((i) => i.checked).length
  const progress = items.length > 0 ? (checkedCount / items.length) * 100 : 0

  // Group by category
  const grouped: Record<string, any[]> = {}
  for (const item of items) {
    const cat = item.category || 'general'
    if (!grouped[cat]) grouped[cat] = []
    grouped[cat].push(item)
  }

  return (
    <div className="space-y-4">
      {/* Progress header */}
      <Card className="bg-card/60 border-border/60">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <ListChecks className="w-4 h-4 text-[oklch(0.82_0.29_145)]" />
              <p className="text-sm font-semibold">Progresso do QC</p>
            </div>
            <Badge className={cn('text-xs', progress === 100 ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-zinc-500/15 text-zinc-300')}>
              {checkedCount}/{items.length}
            </Badge>
          </div>
          <Progress value={progress} className="h-2 bg-muted [&>div]:bg-[oklch(0.82_0.29_145)] [&>div]:neon-glow" />
          <p className="text-[11px] text-muted-foreground mt-1.5">
            {progress === 100 ? '✓ Todas as verificações concluídas — pronto para entrega' : `${Math.round(progress)}% concluído`}
          </p>
        </CardContent>
      </Card>

      {/* Add custom item */}
      {canEdit && (
        <Card className="bg-card/40 border-border/60">
          <CardContent className="p-3">
            <div className="flex gap-2">
              <Input value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="Adicionar verificação customizada…" className="h-9" onKeyDown={(e) => e.key === 'Enter' && add()} />
              <Select value={newCategory} onValueChange={setNewCategory}>
                <SelectTrigger className="w-[150px] h-9"><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(CATEGORY_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
              </Select>
              <Button size="sm" className="bg-[oklch(0.82_0.29_145)] text-background shrink-0" onClick={add}><Plus className="w-4 h-4" /></Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Checklist grouped by category */}
      {loading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
      ) : (
        <div className="space-y-3">
          {Object.entries(grouped).map(([cat, catItems]) => {
            const catChecked = catItems.filter((i) => i.checked).length
            return (
              <Card key={cat} className="bg-card/60 border-border/60">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Badge variant="outline" className={cn('text-[10px]', CATEGORY_COLORS[cat])}>{CATEGORY_LABELS[cat] ?? cat}</Badge>
                    </CardTitle>
                    <span className="text-[11px] text-muted-foreground font-mono">{catChecked}/{catItems.length}</span>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-1">
                  {catItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => toggle(item)}
                      disabled={!canEdit}
                      className={cn(
                        'w-full flex items-center gap-3 rounded-lg p-2 text-left transition-all',
                        canEdit && 'hover:bg-background/40 cursor-pointer',
                        item.checked && 'opacity-60',
                      )}
                    >
                      {item.checked ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
                      ) : (
                        <Circle className="w-4 h-4 text-muted-foreground shrink-0" />
                      )}
                      <span className={cn('text-sm flex-1', item.checked && 'line-through text-muted-foreground')}>{item.label}</span>
                      {item.checked && <span className="text-[10px] text-emerald-300/70 font-mono">✓</span>}
                    </button>
                  ))}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
