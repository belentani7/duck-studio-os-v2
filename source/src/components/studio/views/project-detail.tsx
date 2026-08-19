// BELENTANI OMEGA ULTRA
// Autoría: Pedro Belentani
// Fecha: 2026-08-14
'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  ArrowLeft, ArrowRight, FileAudio, GitBranch, ListTodo, Activity as ActivityIcon, Plus,
  Send, CheckCircle2, RotateCcw, Paperclip, Calendar, Euro, MessageSquare, Upload, ClipboardCheck,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import { api } from '@/lib/api-client'
import { PROJECT_STATUSES, STATUS_LABELS_PT, STATUS_COLORS } from '@/lib/types'
import type { OperationalContext } from '@/lib/types'
import { can } from '@/lib/permissions'
import { cn } from '@/lib/utils'
import { QcChecklist } from './qc-checklist'
import { WaveformPlayer } from '../waveform-player'

export function ProjectDetail({
  ctx,
  projectId,
  onBack,
  onOpenProject,
}: {
  ctx: OperationalContext
  projectId: string
  onBack: () => void
  onOpenProject?: (id: string) => void
}) {
  const [project, setProject] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [relatedProjects, setRelatedProjects] = useState<any[]>([])

  const load = useCallback(async () => {
    setLoading(true)
    try { setProject(await api.projects.get(projectId)) } finally { setLoading(false) }
  }, [projectId])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const [detailResult, listResult] = await Promise.allSettled([api.projects.get(projectId), api.projects.list()])
        if (cancelled) return
        if (detailResult.status === 'fulfilled') {
          setProject(detailResult.value)
          setRelatedProjects(
            listResult.status === 'fulfilled' && Array.isArray(listResult.value)
              ? buildRelatedProjects(detailResult.value, listResult.value)
              : [],
          )
        } else {
          setProject(null)
          setRelatedProjects([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [projectId])

  useEffect(() => {
    if (!onOpenProject || relatedProjects.length === 0) return
    const handler = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return
      const target = e.target as HTMLElement | null
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable)) return
      if (e.key.toLowerCase() === 'r') {
        e.preventDefault()
        onOpenProject(relatedProjects[0].id)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onOpenProject, relatedProjects])

  if (loading) return <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
  if (!project) return <p className="text-sm text-muted-foreground">Projeto não encontrado.</p>

  const canEdit = can(ctx.role, 'projects:edit')
  const canAdvance = can(ctx.role, 'projects:advance_status')
  const isClient = ctx.role === 'CLIENT'

  const advanceStatus = async (status: string) => {
    await api.projects.update(projectId, { status })
    await load()
    toast.success(`Status: ${STATUS_LABELS_PT[status] ?? status}`)
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Button variant="ghost" size="icon" className="shrink-0" onClick={onBack}><ArrowLeft className="w-4 h-4" /></Button>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight truncate">{project.name}</h1>
            <Badge className={cn('text-[10px]', STATUS_COLORS[project.status])}>{STATUS_LABELS_PT[project.status] ?? project.status}</Badge>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span>{project.client?.name}</span>
            <span>· {project.service}</span>
            {project.deadline && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(project.deadline).toLocaleDateString('pt-BR')}</span>}
            {project.price > 0 && <span className="flex items-center gap-0.5"><Euro className="w-3 h-3" />{project.price}</span>}
          </div>
        </div>
        {canAdvance && (
          <Select onValueChange={advanceStatus}>
            <SelectTrigger className="w-[200px] h-9"><SelectValue placeholder="Mudar status" /></SelectTrigger>
            <SelectContent>{PROJECT_STATUSES.map((s) => <SelectItem key={s} value={s}>{STATUS_LABELS_PT[s] ?? s}</SelectItem>)}</SelectContent>
          </Select>
        )}
      </div>

      {project.description && (
        <Card className="bg-card/40 border-border/60">
          <CardContent className="p-3 text-sm text-muted-foreground">{project.description}</CardContent>
        </Card>
      )}

      {onOpenProject && relatedProjects.length > 0 && (
        <Card className="bg-card/50 border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Relacionados</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2">
            {relatedProjects.slice(0, 4).map((item, index) => (
              <button
                key={item.id}
                onClick={() => onOpenProject(item.id)}
                className="flex items-center gap-3 rounded-lg border border-border/50 bg-background/40 px-3 py-2 text-left transition-colors hover:border-[oklch(0.82_0.29_145/0.45)] hover:bg-[oklch(0.82_0.29_145/0.08)]"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[oklch(0.82_0.29_145/0.12)] text-[oklch(0.82_0.29_145)]">
                  <ArrowRight className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{item.name}</p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {item.service} · {item.client?.name ?? 'sem cliente'}
                  </p>
                </div>
                {index === 0 && (
                  <span className="rounded-full border border-[oklch(0.82_0.29_145/0.3)] bg-[oklch(0.82_0.29_145/0.12)] px-2 py-0.5 text-[10px] font-mono text-[oklch(0.82_0.29_145)]">
                    r
                  </span>
                )}
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="versions">
        <TabsList className="grid grid-cols-6 w-full max-w-2xl h-9">
          <TabsTrigger value="versions" className="text-xs gap-1"><GitBranch className="w-3.5 h-3.5" />Versões</TabsTrigger>
          <TabsTrigger value="files" className="text-xs gap-1"><FileAudio className="w-3.5 h-3.5" />Arquivos</TabsTrigger>
          <TabsTrigger value="tasks" className="text-xs gap-1"><ListTodo className="w-3.5 h-3.5" />Tarefas</TabsTrigger>
          <TabsTrigger value="qc" className="text-xs gap-1"><ClipboardCheck className="w-3.5 h-3.5" />QC</TabsTrigger>
          <TabsTrigger value="activity" className="text-xs gap-1"><ActivityIcon className="w-3.5 h-3.5" />Atividade</TabsTrigger>
          <TabsTrigger value="info" className="text-xs gap-1">Info</TabsTrigger>
        </TabsList>

        {/* Versions tab */}
        <TabsContent value="versions" className="mt-4">
          <VersionsTab project={project} ctx={ctx} canCreate={can(ctx.role, 'versions:create')} onReload={load} />
        </TabsContent>

        {/* Files tab */}
        <TabsContent value="files" className="mt-4">
          <FilesTab project={project} ctx={ctx} canUpload={can(ctx.role, 'files:upload')} onReload={load} />
        </TabsContent>

        {/* Tasks tab */}
        <TabsContent value="tasks" className="mt-4">
          <TasksTab project={project} ctx={ctx} canEdit={can(ctx.role, 'tasks:edit')} canCreate={can(ctx.role, 'tasks:create')} onReload={load} />
        </TabsContent>

        {/* QC tab */}
        <TabsContent value="qc" className="mt-4">
          <QcChecklist projectId={projectId} ctx={ctx} />
        </TabsContent>

        {/* Activity tab */}
        <TabsContent value="activity" className="mt-4">
          <Card className="bg-card/60 border-border/60">
            <CardHeader className="pb-3"><CardTitle className="text-base">Atividade do projeto</CardTitle></CardHeader>
            <CardContent>
              {project.activities?.length ? (
                <ScrollArea className="h-[400px] pr-3">
                  <div className="space-y-2">
                    {project.activities.map((a: any) => (
                      <div key={a.id} className="flex items-start gap-3 rounded-lg border border-border/40 bg-background/40 p-2.5">
                        <div className="w-7 h-7 rounded-full bg-[oklch(0.82_0.29_145/0.12)] flex items-center justify-center shrink-0">
                          <ActivityIcon className="w-3 h-3 text-[oklch(0.82_0.29_145)]" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm">{a.detail}</p>
                          <p className="text-[11px] text-muted-foreground">{a.actor?.name ?? 'sistema'} · {new Date(a.createdAt).toLocaleString('pt-BR')}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : <p className="text-sm text-muted-foreground py-6 text-center">Sem atividade registrada.</p>}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Info tab */}
        <TabsContent value="info" className="mt-4">
          <Card className="bg-card/60 border-border/60">
            <CardContent className="p-4 space-y-2 text-sm">
              <Row label="ID" value={project.id} />
              <Row label="Cliente" value={project.client?.name} />
              <Row label="Serviço" value={project.service} />
              <Row label="Preço" value={project.price ? `€${project.price}` : '-'} />
              <Row label="Prazo" value={project.deadline ? new Date(project.deadline).toLocaleDateString('pt-BR') : '-'} />
              <Row label="Criado em" value={new Date(project.createdAt).toLocaleString('pt-BR')} />
              <Row label="Criado por" value={project.createdBy?.name} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function buildRelatedProjects(project: any, projects: any[]) {
  const currentText = tokenize([project.name, project.service, project.description, project.client?.name].filter(Boolean).join(' '))
  const currentHints = [
    project.name,
    project.service,
    project.description,
    project.client?.name,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  return projects
    .filter((candidate) => candidate.id !== project.id)
    .map((candidate) => {
      let score = 0
      if (candidate.clientId === project.clientId) score += 120
      if (candidate.service === project.service) score += 60
      if (candidate.status === project.status) score += 10
      if (candidate.currency === project.currency) score += 4

      const candidateText = tokenize([candidate.name, candidate.service, candidate.description, candidate.client?.name].filter(Boolean).join(' '))
      for (const token of candidateText) {
        if (currentText.has(token)) score += Math.min(10, Math.max(2, token.length))
      }

      const joined = [candidate.name, candidate.service, candidate.description, candidate.client?.name].filter(Boolean).join(' ').toLowerCase()
      if (currentHints.includes('token') && joined.includes('meter')) score += 80
      if (currentHints.includes('cost') || currentHints.includes('budget') || currentHints.includes('price')) {
        if (joined.includes('model') || joined.includes('meter') || joined.includes('limit') || joined.includes('router')) score += 40
      }
      if (currentHints.includes('hallucination') || currentHints.includes('truth') || currentHints.includes('ground')) {
        if (joined.includes('truth') || joined.includes('ground') || joined.includes('verify')) score += 40
      }

      return { ...candidate, score }
    })
    .filter((candidate) => candidate.score > 0)
    .sort((a, b) => b.score - a.score || new Date(b.updatedAt ?? 0).getTime() - new Date(a.updatedAt ?? 0).getTime())
}

function tokenize(input: string) {
  return new Set((input.toLowerCase().match(/[a-z0-9]+/g) ?? []).filter(Boolean))
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return <div className="flex justify-between gap-4 py-1 border-b border-border/40 last:border-0"><span className="text-muted-foreground text-xs">{label}</span><span className="font-mono text-xs truncate">{value ?? '-'}</span></div>
}

function VersionsTab({ project, ctx, canCreate, onReload }: { project: any; ctx: OperationalContext; canCreate: boolean; onReload: () => void }) {
  const [newName, setNewName] = useState('')
  const [newNotes, setNewNotes] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)

  const create = async () => {
    if (!newName.trim()) return
    await api.projects.addVersion(project.id, { name: newName, notes: newNotes })
    setNewName(''); setNewNotes('')
    await onReload()
    toast.success('Versão criada')
  }

  return (
    <div className="space-y-3">
      {canCreate && (
        <Card className="bg-card/40 border-border/60">
          <CardContent className="p-3 space-y-2">
            <div className="flex gap-2">
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nome da versão (ex: Master v4)" className="h-9" />
              <Button size="sm" className="bg-[oklch(0.82_0.29_145)] text-background shrink-0" onClick={create}><Plus className="w-4 h-4" /></Button>
            </div>
            <Input value={newNotes} onChange={(e) => setNewNotes(e.target.value)} placeholder="Notas (opcional)" className="h-9" />
          </CardContent>
        </Card>
      )}

      {project.versions?.length ? (
        <div className="space-y-2">
          {project.versions.map((v: any) => (
            <Card key={v.id} className="bg-card/60 border-border/60">
              <CardContent className="p-3">
                <div className="flex items-center justify-between gap-2">
                  <button className="flex items-center gap-2 text-left min-w-0" onClick={() => setExpanded(expanded === v.id ? null : v.id)}>
                    <GitBranch className="w-4 h-4 text-[oklch(0.82_0.29_145)] shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{v.name}</p>
                      <p className="text-[11px] text-muted-foreground">{v.creator?.name} · {new Date(v.createdAt).toLocaleString('pt-BR')}</p>
                    </div>
                  </button>
                  <div className="flex items-center gap-2">
                    <Badge className={cn('text-[10px]', STATUS_COLORS[v.status])}>{STATUS_LABELS_PT[v.status] ?? v.status}</Badge>
                    {can(ctx.role, 'versions:approve') && v.status === 'review' && (
                      <Button size="sm" variant="outline" className="h-7 gap-1 text-emerald-300 border-emerald-500/40" onClick={async () => { await api.versions.approve(v.id); await onReload(); toast.success('Versão aprovada') }}>
                        <CheckCircle2 className="w-3.5 h-3.5" /> Aprovar
                      </Button>
                    )}
                    {can(ctx.role, 'versions:request_changes') && v.status === 'review' && (
                      <Button size="sm" variant="outline" className="h-7 gap-1 text-amber-300 border-amber-500/40" onClick={async () => {
                        const note = prompt('Que alteração você solicita?')
                        if (note !== null) { await api.versions.requestChanges(v.id, note); await onReload(); toast.success('Alteração solicitada') }
                      }}>
                        <RotateCcw className="w-3.5 h-3.5" /> Pedir ajuste
                      </Button>
                    )}
                  </div>
                </div>
                {v.notes && <p className="text-xs text-muted-foreground mt-2 pl-6">{v.notes}</p>}
                {expanded === v.id && (
                  <div className="mt-3 pt-3 border-t border-border/40 pl-6 space-y-3">
                    <WaveformPlayer
                      comments={(v.comments ?? []).filter((c: any) => c.timestamp != null).map((c: any) => ({ id: c.id, timestamp: c.timestamp, body: c.body, author: c.author?.name }))}
                      onAddComment={async (timestamp, body) => {
                        await api.versions.comment(v.id, body, timestamp)
                        await onReload()
                        toast.success('Comentário com timestamp adicionado')
                      }}
                    />
                    <Comments versionId={v.id} comments={v.comments} ctx={ctx} onReload={onReload} />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : <p className="text-sm text-muted-foreground py-6 text-center">Nenhuma versão ainda.</p>}
    </div>
  )
}

function Comments({ versionId, comments, ctx, onReload }: { versionId: string; comments: any[]; ctx: OperationalContext; onReload: () => void }) {
  const [text, setText] = useState('')
  const send = async () => {
    if (!text.trim()) return
    await api.versions.comment(versionId, text)
    setText('')
    await onReload()
  }
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5" /> Comentários ({comments?.length ?? 0})</p>
      {comments?.map((c: any) => (
        <div key={c.id} className="rounded-lg bg-background/40 p-2">
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-xs font-medium">{c.author?.name}</span>
            <span className="text-[10px] text-muted-foreground">{new Date(c.createdAt).toLocaleString('pt-BR')}</span>
          </div>
          <p className="text-xs">{c.body}</p>
          {c.timestamp != null && <span className="text-[10px] text-[oklch(0.85_0.32_145)] font-mono">@ {c.timestamp.toFixed(1)}s</span>}
        </div>
      ))}
      <div className="flex gap-2">
        <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Comentar…" className="h-8 text-xs" onKeyDown={(e) => e.key === 'Enter' && send()} />
        <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={send}><Send className="w-3.5 h-3.5" /></Button>
      </div>
    </div>
  )
}

function FilesTab({ project, ctx, canUpload, onReload }: { project: any; ctx: OperationalContext; canUpload: boolean; onReload: () => void }) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState('01_SOURCE')

  const add = async () => {
    if (!name.trim()) return
    await api.projects.addFile(project.id, { name, category, mime: 'audio/wav', size: 0 })
    setName('')
    await onReload()
    toast.success('Arquivo registrado')
  }

  const categories = ['00_ADMIN', '01_SOURCE', '02_STEMS', '03_REFERENCES', '04_WORKING', '05_REVISIONS', '06_MASTERS', '07_DELIVERABLES', '99_ARCHIVE']

  return (
    <div className="space-y-3">
      {canUpload && (
        <Card className="bg-card/40 border-border/60">
          <CardContent className="p-3 space-y-2">
            <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
              <Upload className="w-3 h-3" /> Registra o metadado do arquivo. O binário real é gerenciado localmente (o navegador não armazena áudio do DAW).
            </p>
            <div className="flex flex-wrap gap-2">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="nome_do_arquivo.wav" className="h-9 flex-1 min-w-[180px]" />
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-[180px] h-9"><SelectValue /></SelectTrigger>
                <SelectContent>{categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
              <Button size="sm" className="bg-[oklch(0.82_0.29_145)] text-background" onClick={add}><Plus className="w-4 h-4" /></Button>
            </div>
          </CardContent>
        </Card>
      )}
      {project.files?.length ? (
        <div className="grid sm:grid-cols-2 gap-2">
          {project.files.map((f: any) => (
            <div key={f.id} className="flex items-center gap-3 rounded-lg border border-border/40 bg-background/40 p-3">
              <FileAudio className="w-4 h-4 text-[oklch(0.82_0.29_145)] shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm truncate">{f.name}</p>
                <p className="text-[11px] text-muted-foreground">{f.category} · {f.uploadedBy?.name} · {new Date(f.createdAt).toLocaleDateString('pt-BR')}</p>
              </div>
              <Badge variant="outline" className="text-[9px]">{f.status}</Badge>
            </div>
          ))}
        </div>
      ) : <p className="text-sm text-muted-foreground py-6 text-center">Nenhum arquivo registrado.</p>}
    </div>
  )
}

function TasksTab({ project, ctx, canEdit, canCreate, onReload }: { project: any; ctx: OperationalContext; canEdit: boolean; canCreate: boolean; onReload: () => void }) {
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState('medium')

  const create = async () => {
    if (!title.trim()) return
    await api.tasks.create({ title, projectId: project.id, priority })
    setTitle('')
    await onReload()
    toast.success('Tarefa criada')
  }

  const cycle = async (t: any) => {
    const next = t.status === 'todo' ? 'in_progress' : t.status === 'in_progress' ? 'done' : 'todo'
    await api.tasks.update(t.id, { status: next })
    await onReload()
  }

  return (
    <div className="space-y-3">
      {canCreate && (
        <Card className="bg-card/40 border-border/60">
          <CardContent className="p-3">
            <div className="flex gap-2">
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Nova tarefa…" className="h-9" onKeyDown={(e) => e.key === 'Enter' && create()} />
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="w-[130px] h-9"><SelectValue /></SelectTrigger>
                <SelectContent>{['low', 'medium', 'high', 'urgent'].map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
              <Button size="sm" className="bg-[oklch(0.82_0.29_145)] text-background" onClick={create}><Plus className="w-4 h-4" /></Button>
            </div>
          </CardContent>
        </Card>
      )}
      {project.tasks?.length ? (
        <div className="space-y-2">
          {project.tasks.map((t: any) => (
            <div key={t.id} className="flex items-center gap-3 rounded-lg border border-border/40 bg-background/40 p-3">
              <button onClick={() => canEdit && cycle(t)} disabled={!canEdit} className="shrink-0">
                <CheckCircle2 className={cn('w-4 h-4', t.status === 'done' ? 'text-emerald-300' : 'text-muted-foreground hover:text-[oklch(0.82_0.29_145)]')} />
              </button>
              <div className="min-w-0 flex-1">
                <p className={cn('text-sm truncate', t.status === 'done' && 'line-through text-muted-foreground')}>{t.title}</p>
                <p className="text-[11px] text-muted-foreground">
                  {t.assignee?.name ?? 'sem responsável'}
                  {t.dueDate && ` · ${new Date(t.dueDate).toLocaleDateString('pt-BR')}`}
                </p>
              </div>
              <Badge variant="outline" className={cn('text-[9px]', t.priority === 'urgent' && 'border-rose-500/40 text-rose-300', t.priority === 'high' && 'border-amber-500/40 text-amber-300')}>{t.priority}</Badge>
              <Badge className={cn('text-[9px]', STATUS_COLORS[t.status])}>{STATUS_LABELS_PT[t.status] ?? t.status}</Badge>
            </div>
          ))}
        </div>
      ) : <p className="text-sm text-muted-foreground py-6 text-center">Nenhuma tarefa.</p>}
    </div>
  )
}
