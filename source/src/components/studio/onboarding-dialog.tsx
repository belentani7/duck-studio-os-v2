// BELENTANI OMEGA ULTRA
// Autoría: Pedro Belentani
// Fecha: 2026-08-14
'use client'

import { useState } from 'react'
import { UserPlus, ArrowRight, ArrowLeft, Check, Music2, Heart, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { api } from '@/lib/api-client'
import { cn } from '@/lib/utils'

const STEPS = ['Identidade', 'Contato', 'Preferências', 'Primeiro projeto', 'Confirmação']

const GENRES = ['Pop', 'Rock', 'Hip-Hop/Trap', 'Eletrónica', 'Indie', 'Folk', 'Jazz', 'Clássica', 'Ambiente', 'Experimental']
const SERVICES = ['Mastering', 'Mixing', 'Mix & Master', 'Produção', 'Edição Vocal', 'Beatmaking']

export function OnboardingDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({
    name: '', email: '', phone: '', company: '', artistName: '',
    language: 'pt-BR', timezone: 'Europe/Madrid',
    genres: [] as string[],
    loudnessTarget: '-9 LUFS',
    notes: '',
    createProject: true,
    projectName: '', projectService: 'Mastering', projectPrice: 0,
  })
  const [saving, setSaving] = useState(false)

  const toggleGenre = (g: string) => {
    setForm((f) => ({ ...f, genres: f.genres.includes(g) ? f.genres.filter((x) => x !== g) : [...f.genres, g] }))
  }

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1))
  const back = () => setStep((s) => Math.max(s - 1, 0))

  const submit = async () => {
    if (!form.name || !form.email) { toast.error('Nome e email obrigatórios'); return }
    setSaving(true)
    try {
      // 1. Cria cliente
      const client = await api.clients.create({
        name: form.name, email: form.email, phone: form.phone, company: form.company, artistName: form.artistName,
        tags: form.genres.join(','), notes: form.notes || `Onboarding: loudness alvo ${form.loudnessTarget}`,
      })
      // 2. Cria primeiro projeto (se marcado)
      if (form.createProject && form.projectName) {
        await api.projects.create({
          name: form.projectName, clientId: client.id, service: form.projectService,
          status: 'Lead', price: Number(form.projectPrice) || 0,
        })
      }
      toast.success(`Cliente ${form.name} onboardado!${form.createProject ? ' Projeto criado.' : ''}`)
      setStep(0)
      setForm({ name: '', email: '', phone: '', company: '', artistName: '', language: 'pt-BR', timezone: 'Europe/Madrid', genres: [], loudnessTarget: '-9 LUFS', notes: '', createProject: true, projectName: '', projectService: 'Mastering', projectPrice: 0 })
      setOpen(false)
      onCreated()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro no onboarding')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-2 border-[oklch(0.82_0.29_145/0.4)] text-[oklch(0.85_0.32_145)] hover:bg-[oklch(0.82_0.29_145/0.1)]">
          <UserPlus className="w-4 h-4" /> Onboarding
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[oklch(0.82_0.29_145/0.12)] flex items-center justify-center">
              <UserPlus className="w-4 h-4 text-[oklch(0.82_0.29_145)]" />
            </div>
            Onboarding de cliente
          </DialogTitle>
        </DialogHeader>

        {/* Stepper */}
        <div className="flex items-center gap-1 mb-4">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center flex-1 last:flex-none">
              <div className={cn(
                'flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold shrink-0 transition-all',
                i < step ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : i === step ? 'bg-[oklch(0.82_0.29_145)] text-background neon-glow' : 'bg-muted text-muted-foreground border border-border',
              )}>
                {i < step ? <Check className="w-3 h-3" /> : i + 1}
              </div>
              {i < STEPS.length - 1 && <div className={cn('flex-1 h-0.5 mx-1 rounded', i < step ? 'bg-emerald-500/40' : 'bg-border')} />}
            </div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground -mt-2 mb-3 text-center">{STEPS[step]}</p>

        {/* Step content */}
        <div className="min-h-[180px]">
          {step === 0 && (
            <div className="space-y-3 animate-duck-fade-in">
              <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Music2 className="w-3.5 h-3.5 text-[oklch(0.82_0.29_145)]" /> Quem é o novo cliente?</p>
              <Field label="Nome *"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ana Silva" /></Field>
              <Field label="Email *"><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="ana@email.com" /></Field>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Telefone"><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+351 ..." /></Field>
                <Field label="Empresa"><Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="Silva Records" /></Field>
              </div>
              <Field label="Nome artístico"><Input value={form.artistName} onChange={(e) => setForm({ ...form, artistName: e.target.value })} placeholder="ANA S" /></Field>
            </div>
          )}
          {step === 1 && (
            <div className="space-y-3 animate-duck-fade-in">
              <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Heart className="w-3.5 h-3.5 text-[oklch(0.82_0.29_145)]" /> Preferências de comunicação</p>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Idioma">
                  <Select value={form.language} onValueChange={(v) => setForm({ ...form, language: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{['pt-BR', 'pt-PT', 'en', 'es', 'fr'].map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                <Field label="Fuso horário">
                  <Select value={form.timezone} onValueChange={(v) => setForm({ ...form, timezone: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{['Europe/Madrid', 'Europe/Lisbon', 'America/Sao_Paulo', 'America/New_York', 'UTC'].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
              </div>
              <Field label="Alvo de loudness preferido">
                <Select value={form.loudnessTarget} onValueChange={(v) => setForm({ ...form, loudnessTarget: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{['-9 LUFS', '-10 LUFS', '-11 LUFS', '-14 LUFS', '-16 LUFS', '-23 LUFS'].map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
            </div>
          )}
          {step === 2 && (
            <div className="space-y-3 animate-duck-fade-in">
              <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Music2 className="w-3.5 h-3.5 text-[oklch(0.82_0.29_145)]" /> Que gêneros musicais produz?</p>
              <div className="flex flex-wrap gap-1.5">
                {GENRES.map((g) => (
                  <button key={g} onClick={() => toggleGenre(g)} className={cn('text-xs px-2.5 py-1.5 rounded-full border transition-all', form.genres.includes(g) ? 'bg-[oklch(0.82_0.29_145/0.12)] text-[oklch(0.85_0.32_145)] neon-border' : 'border-border/60 text-muted-foreground hover:text-foreground')}>
                    {g}
                  </button>
                ))}
              </div>
              <Field label="Notas sobre o cliente (opcional)">
                <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} placeholder="Preferências sonoras, referências, estilo de comunicação..." />
              </Field>
            </div>
          )}
          {step === 3 && (
            <div className="space-y-3 animate-duck-fade-in">
              <label className="flex items-center justify-between gap-2 cursor-pointer">
                <div>
                  <p className="text-sm font-medium">Criar primeiro projeto agora</p>
                  <p className="text-[11px] text-muted-foreground">Pula direto para Lead no pipeline</p>
                </div>
                <input type="checkbox" checked={form.createProject} onChange={(e) => setForm({ ...form, createProject: e.target.checked })} className="w-9 h-5 accent-[oklch(0.82_0.29_145)]" />
              </label>
              {form.createProject && (
                <div className="space-y-3 pt-2 border-t border-border/40">
                  <Field label="Nome do projeto"><Input value={form.projectName} onChange={(e) => setForm({ ...form, projectName: e.target.value })} placeholder="Master — Single debut" /></Field>
                  <div className="grid grid-cols-2 gap-2">
                    <Field label="Serviço">
                      <Select value={form.projectService} onValueChange={(v) => setForm({ ...form, projectService: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{SERVICES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                      </Select>
                    </Field>
                    <Field label="Preço (€)"><Input type="number" value={form.projectPrice} onChange={(e) => setForm({ ...form, projectPrice: Number(e.target.value) })} /></Field>
                  </div>
                </div>
              )}
            </div>
          )}
          {step === 4 && (
            <div className="space-y-3 animate-duck-fade-in">
              <div className="rounded-lg border border-[oklch(0.82_0.29_145/0.3)] bg-[oklch(0.82_0.29_145/0.04)] p-4 space-y-2">
                <p className="text-sm font-semibold flex items-center gap-2"><Check className="w-4 h-4 text-emerald-300" /> Pronto para onboardar</p>
                <div className="text-xs space-y-1 text-muted-foreground">
                  <Row label="Cliente" value={form.name} />
                  <Row label="Email" value={form.email} />
                  {form.artistName && <Row label="Artista" value={form.artistName} />}
                  <Row label="Gêneros" value={form.genres.join(', ') || '-'} />
                  <Row label="Loudness" value={form.loudnessTarget} />
                  {form.createProject && <Row label="Projeto" value={form.projectName || '-'} />}
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground flex items-center gap-1.5"><Zap className="w-3 h-3 text-[oklch(0.82_0.29_145)]" /> O cliente será criado no CRM com tags de gênero e notas de preferência.</p>
            </div>
          )}
        </div>

        {/* Footer nav */}
        <div className="flex items-center justify-between pt-3 border-t border-border/40">
          <Button variant="ghost" size="sm" onClick={back} disabled={step === 0} className="gap-1"><ArrowLeft className="w-3.5 h-3.5" /> Voltar</Button>
          {step < STEPS.length - 1 ? (
            <Button size="sm" onClick={next} className="gap-1 bg-[oklch(0.82_0.29_145)] text-background">Próximo <ArrowRight className="w-3.5 h-3.5" /></Button>
          ) : (
            <Button size="sm" onClick={submit} disabled={saving} className="gap-1 bg-[oklch(0.82_0.29_145)] text-background neon-glow">
              <Check className="w-3.5 h-3.5" /> {saving ? 'Criando…' : 'Onboardar cliente'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-xs">{label}</Label>{children}</div>
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between gap-2"><span className="text-muted-foreground">{label}</span><span className="font-medium text-foreground text-right truncate max-w-[60%]">{value || '-'}</span></div>
}
