// BELENTANI OMEGA ULTRA
// Autoría: Pedro Belentani
// Fecha: 2026-08-14
'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import {
  LayoutDashboard, Users, FolderKanban, Plug, Receipt, ShieldCheck,
  Cpu, Settings, Wrench, Bell, Sparkles, Menu, Sun, Moon, ChevronDown,
  Music2, CircleDot, LogOut, Eye, Zap, Search, Workflow, Calendar as CalendarIcon, BarChart3,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Toaster } from '@/components/ui/sonner'
import { cn } from '@/lib/utils'
import { api } from '@/lib/api-client'
import type { OperationalContext, Role } from '@/lib/types'
import { AssistantWidget } from './assistant-widget'
import { OwnerDashboard } from './views/owner-dashboard'
import { CrmView } from './views/crm'
import { ProjectsView } from './views/projects'
import { ProjectDetail } from './views/project-detail'
import { PluginsView } from './views/plugins'
import { FinanceView } from './views/finance'
import { AuditView } from './views/audit'
import { CapabilitiesView } from './views/capabilities'
import { SettingsView } from './views/settings'
import { ToolsView } from './views/tools'
import { ClientPortal } from './views/client-portal'
import { AutomationsView } from './views/automations'
import { ChainsView } from './views/chains'
import { CalendarView } from './views/calendar'
import { AnalyticsView } from './views/analytics'
import { DawBridgeView } from './views/daw-bridge'
import { CommandPalette } from './command-palette'
import { toast } from 'sonner'

export type ViewId =
  | 'dashboard' | 'crm' | 'projects' | 'project-detail' | 'plugins'
  | 'chains' | 'automations' | 'finance' | 'calendar' | 'analytics' | 'daw-bridge'
  | 'audit' | 'capabilities' | 'settings' | 'tools' | 'portal'

interface NavItem { id: ViewId; label: string; icon: React.ComponentType<{ className?: string }> }

const OWNER_NAV: NavItem[] = [
  { id: 'dashboard', label: 'Command Center', icon: LayoutDashboard },
  { id: 'crm', label: 'CRM · Clientes', icon: Users },
  { id: 'projects', label: 'Projetos', icon: FolderKanban },
  { id: 'calendar', label: 'Calendário', icon: CalendarIcon },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'plugins', label: 'Plugins', icon: Plug },
  { id: 'daw-bridge', label: 'DAW Bridge', icon: Cpu },
  { id: 'chains', label: 'Cadeias & Presets', icon: Workflow },
  { id: 'automations', label: 'Automações', icon: Zap },
  { id: 'finance', label: 'Financeiro', icon: Receipt },
  { id: 'tools', label: 'Ferramentas', icon: Wrench },
  { id: 'capabilities', label: 'Capacidades', icon: Cpu },
  { id: 'audit', label: 'Auditoria', icon: ShieldCheck },
  { id: 'settings', label: 'Configurações', icon: Settings },
]

const CLIENT_NAV: NavItem[] = [
  { id: 'portal', label: 'Meus Projetos', icon: FolderKanban },
  { id: 'tools', label: 'Ferramentas', icon: Wrench },
  { id: 'settings', label: 'Preferências', icon: Settings },
]

const DEMO_IDENTITIES: { id: string; name: string; role: Role; email: string }[] = []

function Logo() {
  return (
    <div className="flex items-center gap-3 px-5 py-4">
      <div className="relative w-10 h-10 shrink-0">
        <div className="absolute inset-0 rounded-full bg-[oklch(0.82_0.29_145/0.15)] animate-duck-pulse" />
        <div className="absolute inset-1 rounded-full border-2 border-[oklch(0.82_0.29_145)] flex items-center justify-center">
          <Music2 className="w-4 h-4 text-[oklch(0.85_0.32_145)]" />
        </div>
      </div>
      <div className="min-w-0">
        <p className="text-sm font-bold tracking-tight leading-none neon-text">DUCK STUDIO</p>
        <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest mt-1">RnF · OS</p>
      </div>
    </div>
  )
}

function NavList({ nav, view, onSelect }: { nav: NavItem[]; view: ViewId; onSelect: (v: ViewId) => void }) {
  return (
    <nav className="flex flex-col gap-1 px-3">
      {nav.map((item) => {
        const Icon = item.icon
        const active = view === item.id
        return (
          <button
            key={item.id}
            onClick={() => onSelect(item.id)}
            className={cn(
              'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
              active
                ? 'bg-[oklch(0.82_0.29_145/0.12)] text-[oklch(0.85_0.32_145)] neon-border'
                : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
            )}
          >
            <Icon className={cn('w-4.5 h-4.5 shrink-0', active && 'neon-text')} />
            <span>{item.label}</span>
            {active && <CircleDot className="w-3 h-3 ml-auto text-[oklch(0.82_0.29_145)]" />}
          </button>
        )
      })}
    </nav>
  )
}

export function StudioShell() {
  const [ctx, setCtx] = useState<OperationalContext | null>(null)
  const [view, setView] = useState<ViewId>('dashboard')
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [identities, setIdentities] = useState(DEMO_IDENTITIES)
  const [notifications, setNotifications] = useState<any[]>([])
  const [assistantOpen, setAssistantOpen] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const themeReadyRef = useRef(false)

  // Cmd+K / Ctrl+K to open command palette
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen((v) => !v)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [c, users, n] = await Promise.all([
          api.session.get(),
          fetch('/api/users').then((r) => r.json()).catch(() => []),
          api.notifications.list().catch(() => []),
        ])
        if (cancelled) return
        setCtx(c)
        setView(c.role === 'CLIENT' ? 'portal' : 'dashboard')
        if (Array.isArray(users) && users.length) setIdentities(users)
        if (Array.isArray(n)) setNotifications(n)
      } catch {
        /* ignore */
      }
    })()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const url = new URL(window.location.href)
    const param = url.searchParams.get('theme')
    if (param === 'dark' || param === 'light') {
      themeReadyRef.current = false
      queueMicrotask(() => {
        setTheme(param)
        themeReadyRef.current = true
      })
      return
    }
    themeReadyRef.current = true
  }, [])

  useEffect(() => {
    if (!themeReadyRef.current || typeof window === 'undefined') return
    const url = new URL(window.location.href)
    url.searchParams.set('theme', theme)
    window.history.replaceState({}, '', `${url.pathname}?${url.searchParams.toString()}${url.hash}`)
    document.documentElement.classList.toggle('dark', theme === 'dark')
    document.documentElement.classList.toggle('light', theme === 'light')
  }, [theme])

  const reloadCtx = useCallback(async () => {
    const c = await api.session.get()
    setCtx(c)
    setView(c.role === 'CLIENT' ? 'portal' : 'dashboard')
  }, [])

  const reloadNotifications = useCallback(async () => {
    try { setNotifications(await api.notifications.list()) } catch { /* ignore */ }
  }, [])

  const switchIdentity = async (email: string) => {
    try {
      const res = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (res.ok) {
        toast.success('Identidade trocada')
        await reloadCtx()
        await reloadNotifications()
      }
    } catch {
      toast.error('Falha ao trocar identidade')
    }
  }

  const openProject = (id: string) => {
    setSelectedProjectId(id)
    setView('project-detail')
    setMobileNavOpen(false)
  }

  const selectView = (v: ViewId) => {
    setView(v)
    setMobileNavOpen(false)
  }

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  if (!ctx) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-2 border-[oklch(0.82_0.29_145)] border-t-transparent animate-spin" />
          <Music2 className="absolute inset-0 m-auto w-7 h-7 text-[oklch(0.82_0.29_145)] animate-duck-pulse" />
        </div>
        <p className="text-sm text-muted-foreground font-mono">Inicializando DUCK STUDIO OS…</p>
      </div>
    )
  }

  const isClient = ctx.role === 'CLIENT'
  const nav = isClient ? CLIENT_NAV : OWNER_NAV
  const unread = notifications.filter((n) => !n.read).length

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="flex h-14 items-center gap-2 px-3 sm:px-4">
          <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="w-5 h-5" />
                <span className="sr-only">Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0 bg-sidebar">
              <SheetTitle className="sr-only">Navegação</SheetTitle>
              <Logo />
              <NavList nav={nav} view={view} onSelect={selectView} />
            </SheetContent>
          </Sheet>

          <div className="hidden lg:block w-60 shrink-0">
            <Logo />
          </div>

          <div className="flex-1 min-w-0 flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
              <Zap className="w-3.5 h-3.5 text-[oklch(0.82_0.29_145)]" />
              <span className="font-mono truncate">{ctx.studioName}</span>
              {ctx.isDemo && (
                <Badge variant="outline" className="border-amber-500/40 text-amber-300 text-[10px] py-0 px-1.5">DEMO</Badge>
              )}
            </div>
            {/* Command palette trigger */}
            <button
              onClick={() => setPaletteOpen(true)}
              className="hidden md:flex items-center gap-2 ml-auto mr-1 h-9 px-3 rounded-lg border border-border/60 bg-muted/30 hover:bg-muted/50 hover:border-[oklch(0.82_0.29_145/0.3)] transition-all text-xs text-muted-foreground group"
            >
              <Search className="w-3.5 h-3.5 group-hover:text-[oklch(0.82_0.29_145)]" />
              <span>Buscar…</span>
              <kbd className="inline-flex items-center gap-0.5 rounded border border-border/60 bg-muted/60 px-1 py-0.5 text-[9px] font-mono">⌘K</kbd>
            </button>
          </div>

          {/* Role / identity switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2 h-9">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[oklch(0.82_0.29_145)] to-[oklch(0.6_0.18_180)] flex items-center justify-center text-[10px] font-bold text-background">
                  {ctx.userName.slice(0, 2).toUpperCase()}
                </div>
                <span className="hidden sm:inline text-sm font-medium max-w-[120px] truncate">{ctx.userName}</span>
                <Badge variant="secondary" className="text-[10px] py-0 px-1.5">{ctx.role}</Badge>
                <ChevronDown className="w-3.5 h-3.5 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel className="text-xs text-muted-foreground">Trocar identidade (demo)</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {identities.map((id) => (
                <DropdownMenuItem key={id.email} onClick={() => switchIdentity(id.email)} className="flex items-center gap-2 cursor-pointer">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[oklch(0.82_0.29_145)] to-[oklch(0.6_0.18_180)] flex items-center justify-center text-[9px] font-bold text-background">
                    {id.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{id.name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{id.email}</p>
                  </div>
                  <Badge variant="outline" className="text-[9px] py-0 px-1">{id.role}</Badge>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs text-muted-foreground">Ver como</DropdownMenuLabel>
              {!isClient && (
                <DropdownMenuItem onClick={async () => { await api.session.set({ viewAs: 'CLIENT' }); await reloadCtx(); }}>
                  <Eye className="w-3.5 h-3.5" /> Ver como Cliente
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={async () => { await api.session.set({ viewAs: 'reset' }); await reloadCtx(); }}>
                <LogOut className="w-3.5 h-3.5" /> Restaurar visão
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative h-9 w-9">
                <Bell className="w-4.5 h-4.5" />
                {unread > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[oklch(0.82_0.29_145)] text-[9px] font-bold text-background flex items-center justify-center">
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 max-h-[420px] overflow-y-auto">
              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-sm font-semibold">Notificações</span>
                {unread > 0 && (
                  <button onClick={async () => { await api.notifications.markAllRead(); await reloadNotifications(); }} className="text-[11px] text-[oklch(0.82_0.29_145)] hover:underline">
                    Marcar todas como lidas
                  </button>
                )}
              </div>
              <DropdownMenuSeparator />
              {notifications.length === 0 ? (
                <div className="px-3 py-8 text-center text-sm text-muted-foreground">Sem notificações</div>
              ) : (
                notifications.slice(0, 12).map((n) => (
                  <DropdownMenuItem
                    key={n.id}
                    className="flex flex-col items-start gap-1 py-2.5 cursor-default"
                    onClick={() => { if (!n.read) api.notifications.markRead(n.id).then(reloadNotifications) }}
                  >
                    <div className="flex items-center gap-2 w-full">
                      {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-[oklch(0.82_0.29_145)] shrink-0" />}
                      <span className="text-sm font-medium flex-1 truncate">{n.title}</span>
                    </div>
                    {n.body && <p className="text-xs text-muted-foreground line-clamp-2">{n.body}</p>}
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Theme toggle */}
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={toggleTheme}>
            {theme === 'dark' ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
          </Button>

          {/* Assistant toggle */}
          <Button
            size="sm"
            onClick={() => setAssistantOpen((v) => !v)}
            className="gap-2 h-9 bg-[oklch(0.82_0.29_145)] text-background hover:bg-[oklch(0.75_0.28_145)] neon-glow"
          >
            <Sparkles className="w-4 h-4" />
            <span className="hidden sm:inline">Duck IA</span>
          </Button>
        </div>
      </header>

      {/* Body: sidebar + content */}
      <div className="flex flex-1 min-h-0">
        <aside className="hidden lg:flex w-60 shrink-0 flex-col border-r border-border/60 bg-sidebar/40">
          <ScrollArea className="flex-1 py-3">
            <NavList nav={nav} view={view} onSelect={selectView} />
          </ScrollArea>
          <div className="p-3 border-t border-border/60">
            <div className="rounded-lg bg-card/60 p-3 neon-border">
              <div className="flex items-center gap-2 mb-1">
                <Cpu className="w-3.5 h-3.5 text-[oklch(0.82_0.29_145)]" />
                <span className="text-[11px] font-semibold">Saúde do sistema</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {ctx.capabilities.filter((c) => c.healthy).length}/{ctx.capabilities.length} capacidades saudáveis
              </p>
            </div>
          </div>
        </aside>

        <main className="flex-1 min-w-0 min-h-0">
          <ScrollArea className="h-[calc(100vh-3.5rem-2.75rem)]">
            <div key={view + (selectedProjectId ?? '')} className="p-4 sm:p-6 max-w-7xl mx-auto animate-duck-fade-in">
              {view === 'dashboard' && <OwnerDashboard ctx={ctx} onOpenProject={openProject} onNavigate={selectView} />}
              {view === 'crm' && <CrmView ctx={ctx} />}
              {view === 'projects' && <ProjectsView ctx={ctx} onOpenProject={openProject} />}
              {view === 'project-detail' && selectedProjectId && (
                <ProjectDetail ctx={ctx} projectId={selectedProjectId} onBack={() => setView('projects')} onOpenProject={openProject} />
              )}
              {view === 'plugins' && <PluginsView ctx={ctx} />}
              {view === 'chains' && <ChainsView ctx={ctx} />}
              {view === 'automations' && <AutomationsView ctx={ctx} />}
              {view === 'calendar' && <CalendarView ctx={ctx} />}
              {view === 'analytics' && <AnalyticsView ctx={ctx} />}
              {view === 'daw-bridge' && <DawBridgeView ctx={ctx} />}
              {view === 'finance' && <FinanceView ctx={ctx} />}
              {view === 'tools' && <ToolsView />}
              {view === 'capabilities' && <CapabilitiesView ctx={ctx} />}
              {view === 'audit' && <AuditView ctx={ctx} />}
              {view === 'settings' && <SettingsView ctx={ctx} onReseed={async () => { await api.seed(); await reloadCtx(); toast.success('DEMO WORKSPACE recriado'); }} />}
              {view === 'portal' && <ClientPortal ctx={ctx} onOpenProject={openProject} />}
            </div>
          </ScrollArea>
        </main>
      </div>

      {/* Sticky footer */}
      <footer className="mt-auto border-t border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="flex items-center justify-between gap-3 px-4 py-2 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-2">
            <Music2 className="w-3 h-3 text-[oklch(0.82_0.29_145)]" />
            <span className="font-mono">DUCK STUDIO OS — RnF</span>
            {ctx.isDemo && <Badge variant="outline" className="border-amber-500/40 text-amber-300 text-[9px] py-0 px-1">DEMO</Badge>}
          </div>
          <div className="hidden sm:flex items-center gap-3 font-mono">
            <span>● {ctx.role}</span>
            <span>● {ctx.capabilities.filter((c) => c.healthy).length}/{ctx.capabilities.length} caps</span>
            <span className="text-[oklch(0.82_0.29_145)]">● {ctx.isDesktopBridge ? 'desktop bridge' : 'web runtime'}</span>
          </div>
        </div>
      </footer>

      <AssistantWidget open={assistantOpen} onOpenChange={setAssistantOpen} ctx={ctx} />
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} ctx={ctx} onNavigate={selectView} onOpenProject={openProject} />
      <Toaster theme={theme} position="bottom-right" />
    </div>
  )
}
