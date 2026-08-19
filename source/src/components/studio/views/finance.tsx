// BELENTANI OMEGA ULTRA
// Autoría: Pedro Belentani
// Fecha: 2026-08-14
'use client'

import { useEffect, useState, useCallback } from 'react'
import { Receipt, Plus, TrendingUp, TrendingDown, Euro, CheckCircle2, FileText } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { api } from '@/lib/api-client'
import { STATUS_LABELS_PT, STATUS_COLORS } from '@/lib/types'
import type { OperationalContext } from '@/lib/types'
import { can } from '@/lib/permissions'
import { cn } from '@/lib/utils'
import { InvoiceDialog } from '../invoice-dialog'

export function FinanceView({ ctx }: { ctx: OperationalContext }) {
  const [invoices, setInvoices] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [viewInvoiceId, setViewInvoiceId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [inv, c] = await Promise.all([api.invoices.list(), ctx.role === 'CLIENT' ? Promise.resolve([]) : api.clients.list()])
      setInvoices(inv); setClients(c)
    } finally { setLoading(false) }
  }, [ctx.role])

  useEffect(() => { load() }, [load])

  const totalPaid = invoices.filter((i) => i.status === 'paid').reduce((s, i) => s + i.amount, 0)
  const outstanding = invoices.filter((i) => i.status === 'sent' || i.status === 'overdue').reduce((s, i) => s + i.amount, 0)
  const overdue = invoices.filter((i) => i.status === 'overdue').reduce((s, i) => s + i.amount, 0)

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Financeiro</h1>
          <p className="text-sm text-muted-foreground">{invoices.length} faturas</p>
        </div>
        {can(ctx.role, 'finance:create') && <CreateInvoiceDialog open={createOpen} onOpenChange={setCreateOpen} clients={clients} onCreated={load} />}
      </div>

      {ctx.role !== 'CLIENT' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Recebido" value={`€${totalPaid.toFixed(0)}`} icon={TrendingUp} color="text-emerald-300" />
          <StatCard label="A receber" value={`€${outstanding.toFixed(0)}`} icon={Euro} color="text-[oklch(0.82_0.29_145)]" />
          <StatCard label="Vencido" value={`€${overdue.toFixed(0)}`} icon={TrendingDown} color="text-rose-300" />
          <StatCard label="Total faturas" value={String(invoices.length)} icon={Receipt} color="text-cyan-300" />
        </div>
      )}

      <Card className="bg-card/60 border-border/60">
        <CardHeader className="pb-3"><CardTitle className="text-base">Faturas</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
          ) : invoices.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Nenhuma fatura.</p>
          ) : (
            <div className="space-y-2">
              {invoices.map((i) => (
                <div key={i.id} className="flex items-center gap-3 rounded-lg border border-border/40 bg-background/40 p-3">
                  <div className="w-9 h-9 rounded-lg bg-[oklch(0.82_0.29_145/0.12)] flex items-center justify-center shrink-0">
                    <Receipt className="w-4 h-4 text-[oklch(0.82_0.29_145)]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-mono font-semibold">{i.number}</p>
                      <Badge className={cn('text-[9px]', STATUS_COLORS[i.status])}>{STATUS_LABELS_PT[i.status] ?? i.status}</Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate">{i.client?.name}{i.project ? ` · ${i.project.name}` : ''}{i.dueDate ? ` · vence ${new Date(i.dueDate).toLocaleDateString('pt-BR')}` : ''}</p>
                  </div>
                  <span className="text-sm font-bold tabular-nums">€{i.amount.toFixed(0)}</span>
                  <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={() => setViewInvoiceId(i.id)}>
                    <FileText className="w-3.5 h-3.5" /> Ver
                  </Button>
                  {can(ctx.role, 'finance:edit') && (
                    <Select onValueChange={async (v) => { await api.invoices.update(i.id, { status: v }); await load(); toast.success('Fatura atualizada') }}>
                      <SelectTrigger className="w-[110px] h-7 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
                      <SelectContent>{['draft', 'sent', 'paid', 'overdue', 'cancelled'].map((s) => <SelectItem key={s} value={s}>{STATUS_LABELS_PT[s] ?? s}</SelectItem>)}</SelectContent>
                    </Select>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <InvoiceDialog invoiceId={viewInvoiceId} open={!!viewInvoiceId} onOpenChange={(v) => !v && setViewInvoiceId(null)} canEdit={can(ctx.role, 'finance:edit')} />
    </div>
  )
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: string; icon: any; color: string }) {
  return (
    <Card className="bg-card/60 border-border/60">
      <CardContent className="p-4">
        <Icon className={cn('w-4 h-4 mb-2', color)} />
        <p className="text-xl font-bold tabular-nums">{value}</p>
        <p className="text-[11px] text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  )
}

function CreateInvoiceDialog({ open, onOpenChange, clients, onCreated }: { open: boolean; onOpenChange: (v: boolean) => void; clients: any[]; onCreated: () => void }) {
  const [form, setForm] = useState({ clientId: '', amount: 0, dueDate: '', status: 'draft' })
  const [saving, setSaving] = useState(false)
  const submit = async () => {
    if (!form.clientId || !form.amount) { toast.error('Cliente e valor obrigatórios'); return }
    setSaving(true)
    try { await api.invoices.create({ ...form, amount: Number(form.amount), dueDate: form.dueDate || undefined }); toast.success('Fatura criada'); onOpenChange(false); onCreated() }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Erro') }
    finally { setSaving(false) }
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild><Button size="sm" className="gap-2 bg-[oklch(0.82_0.29_145)] text-background neon-glow"><Plus className="w-4 h-4" /> Nova fatura</Button></DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Nova fatura</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          <Field label="Cliente *">
            <Select value={form.clientId} onValueChange={(v) => setForm({ ...form, clientId: v })}>
              <SelectTrigger><SelectValue placeholder="Selecionar…" /></SelectTrigger>
              <SelectContent>{clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Valor (€)"><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} /></Field>
            <Field label="Vencimento"><Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} /></Field>
          </div>
          <Field label="Status">
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{['draft', 'sent', 'paid', 'overdue', 'cancelled'].map((s) => <SelectItem key={s} value={s}>{STATUS_LABELS_PT[s] ?? s}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
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
