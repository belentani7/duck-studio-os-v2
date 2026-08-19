// BELENTANI OMEGA ULTRA
// Autoría: Pedro Belentani
// Fecha: 2026-08-14
'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Zap, Plus, Play, Trash2, Power, PowerOff, Clock, CheckCircle2, XCircle,
  MinusCircle, ArrowRight, RefreshCw, Sparkles, History,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { toast } from 'sonner'
import { api } from '@/lib/api-client'
import type { OperationalContext } from '@/lib/types'
import { can } from '@/lib/permissions'
import { cn } from '@/lib/utils'

const TRIGGERS = [
  { value: 'project_status_change', label: 'Status do projeto mudou', desc: 'Quando o status de um projeto é alterado' },
  { value: 'file_uploaded', label: 'Arquivo subiu', desc: 'Quando um arquivo é registrado num projeto' },
  { value: 'version_created', label: 'Versão criada', desc: 'Quando uma nova versão é criada' },
  { value: 'version_approved', label: 'Versão aprovada', desc: 'Quando o cliente aprova uma versão' },
  { value: 'version_request_changes', label: 'Pedido de ajuste', desc: 'Quando o cliente pede alterações' },
  { value: 'task_overdue', label: 'Tarefa vencida', desc: 'Quando uma tarefa passa do prazo (check agendado)' },
  { value: 'invoice_overdue', label: 'Fatura vencida', desc: 'Quando uma fatura passa do vencimento' },
]

const ACTIONS = [
  { value: 'notify_owner', label: 'Notificar Owner', desc: 'Cria notificação para o proprietário' },
  { value: 'notify_client', label: 'Notificar Cliente', desc: 'Cria notificação para o cliente do projeto' },
  { value: 'create_task', label: 'Criar Tarefa', desc: 'Cria uma tarefa no projeto' },
  { value: 'set_status', label: 'Mudar Status', desc: 'Altera o status do projeto' },
  { value: 'create_invoice', label: 'Criar Fatura', desc: 'Cria uma fatura para o cliente' },
]

export function AutomationsView({ ctx }: { ctx: OperationalContext }) {
  const [automations, setAutomations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const canManage = can(ctx.role, 'studio:settings')

  const load = useCallback(async () => {
    setLoading(true)
    try { setAutomations(await api.automations.list()) } finally { setLoading(false) }
  }, [])

  useEffect(() => {
    let cancelled = false
    api.automations.list().then((a) => { if (!cancelled) setAutomations(a) }).finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const toggle = async (auto: any) => {
    await api.automations.update(auto.id, { enabled: !auto.enabled })
    await load()
    toast.success(`Automação ${!auto.enabled ? 'ativada' : 'desativada'}`)
  }

  const test = async (auto: any) => {
    toast.info('Disparando trigger de teste…')
    await api.automations.test(auto.id)
    await load()
    toast.success('Trigger executado — verifique runs recentes')
  }

  const remove = async (id: string) => {
    await api.automations.delete(id)
    await load()
    toast.success('Automação removida')
  }

  const enabledCount = automations.filter((a) => a.enabled).length
  const totalRuns = automations.reduce((s, a) => s + a.runs, 0)

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Zap className="w-6 h-6 text-[oklch(0.82_0.29_145)]" /> Automações
          </h1>
          <p className="text-sm text-muted-foreground">{enabledCount} ativas · {totalRuns} execuções totais</p>
        </div>
        {canManage && <CreateAutomationDialog open={createOpen} onOpenChange={setCreateOpen} onCreated={load} />}
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="bg-card/60 border-border/60"><CardContent className="p-3"><Zap className="w-3.5 h-3.5 text-[oklch(0.82_0.29_145)] mb-1" /><p className="text-lg font-bold">{automations.length}</p><p className="text-[10px] text-muted-foreground">total</p></CardContent></Card>
        <Card className="bg-card/60 border-border/60"><CardContent className="p-3"><Power className="w-3.5 h-3.5 text-emerald-300 mb-1" /><p className="text-lg font-bold">{enabledCount}</p><p className="text-[10px] text-muted-foreground">ativas</p></CardContent></Card>
        <Card className="bg-card/60 border-border/60"><CardContent className="p-3"><History className="w-3.5 h-3.5 text-cyan-300 mb-1" /><p className="text-lg font-bold">{totalRuns}</p><p className="text-[10px] text-muted-foreground">execuções</p></CardContent></Card>
      </div>

      {/* Automation list */}
      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)
        ) : automations.length === 0 ? (
          <Card className="bg-card/40 border-dashed"><CardContent className="py-12 text-center text-sm text-muted-foreground">Nenhuma automação configurada.</CardContent></Card>
        ) : (
          automations.map((auto) => <AutomationCard key={auto.id} auto={auto} canManage={canManage} onToggle={() => toggle(auto)} onTest={() => test(auto)} onDelete={() => remove(auto.id)} />)
        )}
      </div>

      {/* Help card */}
      <Card className="bg-card/40 border-border/60">
        <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Sparkles className="w-4 h-4 text-[oklch(0.82_0.29_145)]" /> Como funciona</CardTitle></CardHeader>
        <CardContent className="text-xs text-muted-foreground space-y-1">
          <p>• Cada automação tem um <strong>trigger</strong> (quando dispara), uma <strong>condição</strong> opcional (filtro) e uma <strong>ação</strong> (o que executa).</p>
          <p>• Triggers são disparados por eventos reais (mudança de status, upload, aprovação) ou por checks agendados (tarefas/faturas vencidas).</p>
          <p>• Cada execução é registrada com status (success/failed/skipped) e detalhe — verifique os runs recentes em cada card.</p>
          <p>• Use o botão <Play className="inline w-3 h-3" /> "Testar" para disparar manualmente com um projeto de exemplo.</p>
        </CardContent>
      </Card>
    </div>
  )
}

function AutomationCard({ auto, canManage, onToggle, onTest, onDelete }: { auto: any; canManage: boolean; onToggle: () => void; onTest: () => void; onDelete: () => void }) {
  const trigger = TRIGGERS.find((t) => t.value === auto.trigger)
  let action: any = {}
  try { action = JSON.parse(auto.action) } catch { /* ignore */ }
  const actionMeta = ACTIONS.find((a) => a.value === action.type)

  return (
    <Card className={cn('bg-card/60 border-border/60 transition-all', auto.enabled ? 'neon-border' : 'opacity-75')}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center shrink-0', auto.enabled ? 'bg-[oklch(0.82_0.29_145/0.12)]' : 'bg-muted')}>
              <Zap className={cn('w-4 h-4', auto.enabled ? 'text-[oklch(0.82_0.29_145)]' : 'text-muted-foreground')} />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm">{auto.name}</p>
              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                <Badge variant="outline" className="text-[9px] py-0 px-1.5 border-cyan-500/40 text-cyan-300">{trigger?.label ?? auto.trigger}</Badge>
                <ArrowRight className="w-3 h-3 text-muted-foreground" />
                <Badge variant="outline" className="text-[9px] py-0 px-1.5 border-[oklch(0.82_0.29_145/0.4)] text-[oklch(0.85_0.32_145)]">{actionMeta?.label ?? action.type}</Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {canManage && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onTest}><Play className="w-3.5 h-3.5" /></Button>
                  </TooltipTrigger>
                  <TooltipContent>Testar trigger</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {canManage && (
              <Switch checked={auto.enabled} onCheckedChange={onToggle} />
            )}
            {canManage && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-rose-300" onClick={onDelete}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </TooltipTrigger>
                  <TooltipContent>Remover</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>

        {/* Action payload preview */}
        {action.payload && Object.keys(action.payload).length > 0 && (
          <div className="mt-3 rounded-lg bg-background/40 p-2.5 text-[11px] font-mono">
            {Object.entries(action.payload).map(([k, v]) => (
              <div key={k} className="flex gap-2"><span className="text-muted-foreground">{k}:</span><span className="text-[oklch(0.85_0.32_145)]">{String(v)}</span></div>
            ))}
          </div>
        )}

        {/* Runs */}
        <div className="mt-3 pt-3 border-t border-border/40 flex items-center justify-between">
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1"><History className="w-3 h-3" /> {auto.runs} runs</span>
            {auto.lastRunAt && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(auto.lastRunAt).toLocaleString('pt-BR')}</span>}
          </div>
          {auto.runLogs?.length > 0 && (
            <div className="flex items-center gap-1">
              {auto.runLogs.slice(0, 5).map((r: any) => (
                <TooltipProvider key={r.id}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className={cn('w-2 h-2 rounded-full', r.status === 'success' ? 'bg-emerald-400' : r.status === 'failed' ? 'bg-rose-400' : 'bg-zinc-500')} />
                    </TooltipTrigger>
                    <TooltipContent className="text-xs">{r.status}: {r.detail}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function CreateAutomationDialog({ open, onOpenChange, onCreated }: { open: boolean; onOpenChange: (v: boolean) => void; onCreated: () => void }) {
  const [name, setName] = useState('')
  const [trigger, setTrigger] = useState('project_status_change')
  const [condition, setCondition] = useState('')
  const [actionType, setActionType] = useState('notify_owner')
  const [actionPayload, setActionPayload] = useState('{"title": "Atualização", "body": "Houve uma mudança no seu projeto."}')
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    if (!name.trim()) { toast.error('Nome obrigatório'); return }
    setSaving(true)
    try {
      await api.automations.create({
        name, trigger,
        condition: condition.trim() || null,
        action: JSON.stringify({ type: actionType, payload: JSON.parse(actionPayload) }),
        enabled: true,
      })
      toast.success('Automação criada')
      setName(''); setCondition('')
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
        <Button size="sm" className="gap-2 bg-[oklch(0.82_0.29_145)] text-background neon-glow"><Plus className="w-4 h-4" /> Nova automação</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>Criar automação</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2 max-h-[60vh] overflow-y-auto">
          <div className="space-y-1.5"><Label className="text-xs">Nome *</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Notificar cliente ao aprovar" /></div>
          <div className="space-y-1.5">
            <Label className="text-xs">Trigger (quando dispara)</Label>
            <Select value={trigger} onValueChange={setTrigger}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{TRIGGERS.map((t) => <SelectItem key={t.value} value={t.value}><div><p>{t.label}</p><p className="text-[10px] text-muted-foreground">{t.desc}</p></div></SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Condição (JSON, opcional)</Label>
            <Textarea value={condition} onChange={(e) => setCondition(e.target.value)} placeholder='{"field": "to", "equals": "Client Review"}' rows={2} className="font-mono text-xs" />
            <p className="text-[10px] text-muted-foreground">Campos: to, from, projectName, status. Operadores: equals, contains.</p>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Ação</Label>
            <Select value={actionType} onValueChange={setActionType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{ACTIONS.map((a) => <SelectItem key={a.value} value={a.value}><div><p>{a.label}</p><p className="text-[10px] text-muted-foreground">{a.desc}</p></div></SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Payload da ação (JSON)</Label>
            <Textarea value={actionPayload} onChange={(e) => setActionPayload(e.target.value)} rows={3} className="font-mono text-xs" />
            <p className="text-[10px] text-muted-foreground">notify_owner/notify_client: title, body. create_task: title, priority. set_status: status. create_invoice: amount.</p>
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
