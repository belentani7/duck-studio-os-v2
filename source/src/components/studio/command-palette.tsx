// BELENTANI OMEGA ULTRA
// Autoría: Pedro Belentani
// Fecha: 2026-08-14
'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import {
  Search, LayoutDashboard, Users, FolderKanban, Plug, Receipt, ShieldCheck,
  Cpu, Settings, Wrench, CornerDownLeft, Hash, Music2, ListTodo, Puzzle, X, Zap, Workflow, Calendar as CalendarIcon, BarChart3,
} from 'lucide-react'
import {
  Dialog, DialogContent, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { api } from '@/lib/api-client'
import type { OperationalContext } from '@/lib/types'
import type { ViewId } from './studio-shell'

interface CommandItem {
  id: string
  label: string
  hint?: string
  icon: React.ComponentType<{ className?: string }>
  group: 'navigation' | 'clients' | 'projects' | 'tasks' | 'plugins'
  action: () => void
}

const NAV_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  dashboard: LayoutDashboard,
  crm: Users,
  projects: FolderKanban,
  calendar: CalendarIcon,
  analytics: BarChart3,
  plugins: Plug,
  'daw-bridge': Cpu,
  chains: Workflow,
  automations: Zap,
  finance: Receipt,
  audit: ShieldCheck,
  capabilities: Cpu,
  settings: Settings,
  tools: Wrench,
  portal: FolderKanban,
}

const NAV_LABELS: Record<string, string> = {
  dashboard: 'Command Center',
  crm: 'CRM · Clientes',
  projects: 'Projetos',
  calendar: 'Calendário',
  analytics: 'Analytics',
  plugins: 'Plugins',
  'daw-bridge': 'DAW Bridge',
  chains: 'Cadeias & Presets',
  automations: 'Automações',
  finance: 'Financeiro',
  audit: 'Auditoria',
  capabilities: 'Capacidades',
  settings: 'Configurações',
  tools: 'Ferramentas',
  portal: 'Meus Projetos',
}

export function CommandPalette({
  open,
  onOpenChange,
  ctx,
  onNavigate,
  onOpenProject,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  ctx: OperationalContext
  onNavigate: (v: ViewId) => void
  onOpenProject: (id: string) => void
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any | null>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Build navigation items based on role
  const navItems: ViewId[] = ctx.role === 'CLIENT'
    ? ['portal', 'tools', 'settings']
    : ['dashboard', 'crm', 'projects', 'calendar', 'analytics', 'plugins', 'daw-bridge', 'chains', 'automations', 'finance', 'tools', 'capabilities', 'audit', 'settings']

  // Debounced search
  useEffect(() => {
    if (!query.trim() || query.length < 1) {
      setResults(null)
      return
    }
    const t = setTimeout(async () => {
      try {
        setResults(await api.search(query))
      } catch {
        setResults(null)
      }
    }, 200)
    return () => clearTimeout(t)
  }, [query])

  // Build full command list
  const commands: CommandItem[] = [
    ...navItems.map((v) => ({
      id: `nav-${v}`,
      label: NAV_LABELS[v] ?? v,
      hint: 'Navegação',
      icon: NAV_ICONS[v] ?? LayoutDashboard,
      group: 'navigation' as const,
      action: () => { onNavigate(v); onOpenChange(false) },
    })),
    ...(results?.clients ?? []).map((c: any) => ({
      id: `client-${c.id}`,
      label: c.name,
      hint: c.email,
      icon: Users,
      group: 'clients' as const,
      action: () => { onNavigate('crm'); onOpenChange(false) },
    })),
    ...(results?.projects ?? []).map((p: any) => ({
      id: `proj-${p.id}`,
      label: p.name,
      hint: `${p.service} · ${p.client?.name ?? ''}`,
      icon: FolderKanban,
      group: 'projects' as const,
      action: () => { onOpenProject(p.id); onOpenChange(false) },
    })),
    ...(results?.tasks ?? []).map((t: any) => ({
      id: `task-${t.id}`,
      label: t.title,
      hint: t.project?.name,
      icon: ListTodo,
      group: 'tasks' as const,
      action: () => { if (t.projectId) onOpenProject(t.projectId); onOpenChange(false) },
    })),
    ...(results?.plugins ?? []).map((p: any) => ({
      id: `plug-${p.id}`,
      label: p.name,
      hint: `${p.developer} · ${p.format}`,
      icon: Puzzle,
      group: 'plugins' as const,
      action: () => { onNavigate('plugins'); onOpenChange(false) },
    })),
  ]

  const filtered = query.trim()
    ? commands.filter((c) => c.id.startsWith('nav-') ? c.label.toLowerCase().includes(query.toLowerCase()) : true)
    : commands.filter((c) => c.id.startsWith('nav-'))

  const grouped: Record<string, CommandItem[]> = {}
  for (const c of filtered) {
    if (!grouped[c.group]) grouped[c.group] = []
    grouped[c.group].push(c)
  }
  const flat = filtered

  // Reset on open
  useEffect(() => {
    if (open) {
      setQuery('')
      setResults(null)
      setActiveIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, flat.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      flat[activeIndex]?.action()
    } else if (e.key === 'Escape') {
      onOpenChange(false)
    }
  }, [flat, activeIndex, onOpenChange])

  // Scroll active into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${activeIndex}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex])

  const groupLabels: Record<string, string> = {
    navigation: 'Navegação',
    clients: 'Clientes',
    projects: 'Projetos',
    tasks: 'Tarefas',
    plugins: 'Plugins',
  }

  let runningIndex = -1

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 gap-0 overflow-hidden max-w-2xl top-[20%] translate-y-0">
        <DialogTitle className="sr-only">Paleta de comandos</DialogTitle>
        <DialogDescription className="sr-only">Busque e navegue rapidamente</DialogDescription>
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border/60">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setActiveIndex(0) }}
            onKeyDown={handleKeyDown}
            placeholder="Buscar ou digitar comando… (clientes, projetos, tarefas, plugins)"
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
          />
          <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-border/60 bg-muted/40 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">ESC</kbd>
        </div>
        {/* Results */}
        <div ref={listRef} className="max-h-[420px] overflow-y-auto p-2">
          {flat.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              {query.trim() ? `Nenhum resultado para "${query}"` : 'Digite para buscar…'}
            </div>
          ) : (
            Object.entries(grouped).map(([group, items]) => (
              <div key={group} className="mb-1">
                <p className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{groupLabels[group]}</p>
                {items.map((item) => {
                  runningIndex++
                  const idx = runningIndex
                  const Icon = item.icon
                  const active = idx === activeIndex
                  return (
                    <button
                      key={item.id}
                      data-idx={idx}
                      onMouseEnter={() => setActiveIndex(idx)}
                      onClick={item.action}
                      className={cn(
                        'w-full flex items-center gap-3 rounded-lg px-2.5 py-2 text-left text-sm transition-colors',
                        active ? 'bg-[oklch(0.82_0.29_145/0.12)] text-[oklch(0.85_0.32_145)]' : 'hover:bg-accent/50',
                      )}
                    >
                      <Icon className={cn('w-4 h-4 shrink-0', active && 'neon-text')} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{item.label}</p>
                        {item.hint && <p className="text-[11px] text-muted-foreground truncate">{item.hint}</p>}
                      </div>
                      {active && <CornerDownLeft className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
                    </button>
                  )
                })}
              </div>
            ))
          )}
        </div>
        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-4 py-2 border-t border-border/60 bg-muted/20 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1"><kbd className="rounded border border-border/60 bg-muted/40 px-1 font-mono">↑↓</kbd> navegar</span>
            <span className="flex items-center gap-1"><kbd className="rounded border border-border/60 bg-muted/40 px-1 font-mono">↵</kbd> selecionar</span>
          </div>
          <span className="flex items-center gap-1 font-mono"><Music2 className="w-3 h-3 text-[oklch(0.82_0.29_145)]" /> Duck OS · {flat.length} resultados</span>
        </div>
      </DialogContent>
    </Dialog>
  )
}
