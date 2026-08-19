// BELENTANI OMEGA ULTRA
// Autoría: Pedro Belentani
// Fecha: 2026-08-14
'use client'

import { useEffect, useState, useCallback } from 'react'
import { Printer, X, Plus, Trash2, Music2, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { api } from '@/lib/api-client'
import { STATUS_LABELS_PT, STATUS_COLORS } from '@/lib/types'
import { cn } from '@/lib/utils'

export function InvoiceDialog({ invoiceId, open, onOpenChange, canEdit }: { invoiceId: string | null; open: boolean; onOpenChange: (v: boolean) => void; canEdit: boolean }) {
  const [invoice, setInvoice] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [newDesc, setNewDesc] = useState('')
  const [newQty, setNewQty] = useState(1)
  const [newPrice, setNewPrice] = useState(0)

  const load = useCallback(async () => {
    if (!invoiceId) return
    setLoading(true)
    try { setInvoice(await api.invoices.get(invoiceId)) } finally { setLoading(false) }
  }, [invoiceId])

  useEffect(() => {
    if (open && invoiceId) load()
  }, [open, invoiceId, load])

  const addItem = async () => {
    if (!newDesc.trim() || !invoiceId) return
    await api.invoices.update(invoiceId, { addItem: { description: newDesc, quantity: Number(newQty), unitPrice: Number(newPrice) } })
    setNewDesc(''); setNewQty(1); setNewPrice(0)
    await load()
    toast.success('Item adicionado')
  }

  const removeItem = async (itemId: string) => {
    await api.invoices.update(invoiceId!, { removeItemId: itemId })
    await load()
    toast.success('Item removido')
  }

  const setStatus = async (status: string) => {
    await api.invoices.update(invoiceId!, { status })
    await load()
    toast.success(`Status: ${STATUS_LABELS_PT[status] ?? status}`)
  }

  const print = () => {
    window.print()
  }

  const subtotal = invoice?.items?.reduce((s: number, i: any) => s + i.quantity * i.unitPrice, 0) ?? invoice?.amount ?? 0
  const vat = subtotal * 0.23 // IVA PT 23%
  const total = subtotal + vat

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto p-0">
        <DialogTitle className="sr-only">Fatura {invoice?.number}</DialogTitle>
        <DialogDescription className="sr-only">Visualização e impressão de fatura</DialogDescription>

        {/* Toolbar (no-print) */}
        <div className="no-print sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-border/60 bg-background/95 backdrop-blur px-4 py-2.5">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[oklch(0.82_0.29_145)]" />
            <span className="text-sm font-semibold font-mono">{invoice?.number ?? '...'}</span>
            {invoice && <Badge className={cn('text-[10px]', STATUS_COLORS[invoice.status])}>{STATUS_LABELS_PT[invoice.status] ?? invoice.status}</Badge>}
          </div>
          <div className="flex items-center gap-2">
            {canEdit && invoice && (
              <Select onValueChange={setStatus}>
                <SelectTrigger className="w-[120px] h-8 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>{['draft', 'sent', 'paid', 'overdue', 'cancelled'].map((s) => <SelectItem key={s} value={s}>{STATUS_LABELS_PT[s] ?? s}</SelectItem>)}</SelectContent>
              </Select>
            )}
            <Button size="sm" className="gap-1.5 h-8 bg-[oklch(0.82_0.29_145)] text-background" onClick={print}><Printer className="w-3.5 h-3.5" /> Imprimir / PDF</Button>
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onOpenChange(false)}><X className="w-4 h-4" /></Button>
          </div>
        </div>

        {/* Invoice document */}
        {loading || !invoice ? (
          <div className="p-12 text-center text-sm text-muted-foreground">Carregando fatura…</div>
        ) : (
          <div className="invoice-doc p-8 sm:p-10 space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-6">
              <div className="flex items-center gap-3">
                <div className="relative w-14 h-14">
                  <div className="absolute inset-0 rounded-full bg-[oklch(0.82_0.29_145/0.15)]" />
                  <div className="absolute inset-1.5 rounded-full border-2 border-[oklch(0.82_0.29_145)] flex items-center justify-center">
                    <Music2 className="w-6 h-6 text-[oklch(0.85_0.32_145)]" />
                  </div>
                </div>
                <div>
                  <h1 className="text-xl font-bold tracking-tight neon-text">DUCK STUDIO OS</h1>
                  <p className="text-[11px] text-muted-foreground font-mono uppercase tracking-widest">RnF · Ritmo & Frequência</p>
                  <p className="text-[10px] text-muted-foreground mt-1">Estúdio de Mastering & Produção Musical</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold tracking-tight">FATURA</p>
                <p className="text-sm font-mono text-[oklch(0.85_0.32_145)]">{invoice.number}</p>
                <p className="text-[11px] text-muted-foreground mt-1">Emitida: {new Date(invoice.createdAt).toLocaleDateString('pt-BR')}</p>
                {invoice.dueDate && <p className="text-[11px] text-muted-foreground">Vencimento: {new Date(invoice.dueDate).toLocaleDateString('pt-BR')}</p>}
              </div>
            </div>

            {/* Parties */}
            <div className="grid grid-cols-2 gap-6 text-sm">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">De</p>
                <p className="font-semibold">DUCK STUDIO — RnF</p>
                <p className="text-xs text-muted-foreground">duck@rnf.studio</p>
                <p className="text-xs text-muted-foreground">Lisboa, Portugal</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Para</p>
                <p className="font-semibold">{invoice.client?.name}</p>
                {invoice.client?.email && <p className="text-xs text-muted-foreground">{invoice.client.email}</p>}
                {invoice.client?.company && <p className="text-xs text-muted-foreground">{invoice.client.company}</p>}
                {invoice.client?.phone && <p className="text-xs text-muted-foreground">{invoice.client.phone}</p>}
              </div>
            </div>

            {/* Items */}
            <div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-[10px] uppercase tracking-wider text-muted-foreground">
                    <th className="py-2 pr-3">Descrição</th>
                    <th className="py-2 px-3 text-right w-20">Qtd</th>
                    <th className="py-2 px-3 text-right w-28">Preço unit.</th>
                    <th className="py-2 pl-3 text-right w-28">Total</th>
                    {canEdit && <th className="no-print w-8"></th>}
                  </tr>
                </thead>
                <tbody>
                  {invoice.items?.length > 0 ? (
                    invoice.items.map((item: any) => (
                      <tr key={item.id} className="border-b border-border/40">
                        <td className="py-2.5 pr-3">{item.description}</td>
                        <td className="py-2.5 px-3 text-right font-mono">{item.quantity}</td>
                        <td className="py-2.5 px-3 text-right font-mono">€{item.unitPrice.toFixed(2)}</td>
                        <td className="py-2.5 pl-3 text-right font-mono font-semibold">€{(item.quantity * item.unitPrice).toFixed(2)}</td>
                        {canEdit && <td className="no-print py-2.5"><button onClick={() => removeItem(item.id)} className="text-rose-300 hover:text-rose-200"><Trash2 className="w-3.5 h-3.5" /></button></td>}
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={canEdit ? 5 : 4} className="py-4 text-center text-xs text-muted-foreground">
                      {invoice.project ? `${invoice.project.service} — ${invoice.project.name}` : 'Serviço de estúdio musical'}
                    </td></tr>
                  )}
                </tbody>
              </table>

              {/* Add item (no-print) */}
              {canEdit && (
                <div className="no-print mt-3 flex gap-2 items-end">
                  <div className="flex-1"><Label className="text-[10px]">Descrição</Label><Input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Ex: Mastering de single" className="h-8 text-xs" /></div>
                  <div className="w-16"><Label className="text-[10px]">Qtd</Label><Input type="number" value={newQty} onChange={(e) => setNewQty(Number(e.target.value))} className="h-8 text-xs" /></div>
                  <div className="w-24"><Label className="text-[10px]">Preço (€)</Label><Input type="number" value={newPrice} onChange={(e) => setNewPrice(Number(e.target.value))} className="h-8 text-xs" /></div>
                  <Button size="sm" className="h-8 bg-[oklch(0.82_0.29_145)] text-background" onClick={addItem}><Plus className="w-3.5 h-3.5" /></Button>
                </div>
              )}
            </div>

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-64 space-y-1.5 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="font-mono">€{subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">IVA (23%)</span><span className="font-mono">€{vat.toFixed(2)}</span></div>
                <div className="flex justify-between border-t border-border pt-1.5"><span className="font-semibold">Total</span><span className="font-mono font-bold text-lg text-[oklch(0.85_0.32_145)]">€{total.toFixed(2)}</span></div>
              </div>
            </div>

            {/* Notes + footer */}
            {invoice.notes && (
              <div className="rounded-lg bg-muted/30 p-3 text-xs text-muted-foreground">
                <p className="font-semibold mb-1 text-foreground">Notas</p>
                {invoice.notes}
              </div>
            )}
            <div className="border-t border-border pt-4 text-center">
              <p className="text-[11px] text-muted-foreground italic">Obrigado pela confiança no DUCK STUDIO — RnF.</p>
              <p className="text-[10px] text-muted-foreground mt-1 font-mono">Pagamento por transferência bancária · IBAN disponível mediante solicitação</p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
