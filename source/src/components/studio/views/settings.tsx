// BELENTANI OMEGA ULTRA
// Autoría: Pedro Belentani
// Fecha: 2026-08-14
'use client'

import { Settings, Sparkles, Database, RefreshCw, Bot, Brain, ShieldCheck } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import type { OperationalContext } from '@/lib/types'
import { can } from '@/lib/permissions'

export function SettingsView({ ctx, onReseed }: { ctx: OperationalContext; onReseed: () => Promise<void> }) {
  const isOwner = ctx.role === 'OWNER'

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-[oklch(0.82_0.29_145)]" /> Configurações
        </h1>
        <p className="text-sm text-muted-foreground">Studio · IA · Dados · Segurança</p>
      </div>

      {/* Studio settings */}
      <Card className="bg-card/60 border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2"><Database className="w-4 h-4 text-[oklch(0.82_0.29_145)]" /> Studio</CardTitle>
          <CardDescription className="text-xs">Identidade do workspace atual</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <Row label="Nome" value={ctx.studioName} />
          <Row label="Modo" value={ctx.isDemo ? 'DEMO WORKSPACE' : 'Produção'} />
          <Row label="ID" value={ctx.studioId} mono />
          <Row label="Runtime" value={ctx.isDesktopBridge ? 'Desktop Bridge' : 'Web (navegador)'} />
        </CardContent>
      </Card>

      {/* AI settings */}
      <Card className="bg-card/60 border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2"><Bot className="w-4 h-4 text-[oklch(0.82_0.29_145)]" /> Assistente IA</CardTitle>
          <CardDescription className="text-xs">O assistente usa contexto operacional real — nunca alucina operações</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[oklch(0.82_0.29_145)]" />
              <div>
                <p className="text-sm font-medium">Provider</p>
                <p className="text-[11px] text-muted-foreground">z-ai-web-dev-sdk (sem API key necessária no servidor)</p>
              </div>
            </div>
            <Badge className="border-emerald-500/40 text-emerald-300 bg-emerald-500/10">conectado</Badge>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-[oklch(0.82_0.29_145)]" />
              <div>
                <p className="text-sm font-medium">Memória persistente</p>
                <p className="text-[11px] text-muted-foreground">Conversas e memória por escopo (user/client/project/studio)</p>
              </div>
            </div>
            <Badge variant="outline" className="text-[10px]">ativo</Badge>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Fallback gracioso</p>
              <p className="text-[11px] text-muted-foreground">Se a IA falhar, o CRM/Studio OS continua 100% operacional</p>
            </div>
            <Badge variant="outline" className="text-[10px] border-emerald-500/40 text-emerald-300">garantido</Badge>
          </div>
          <div className="text-[11px] text-muted-foreground bg-background/40 rounded-lg p-3">
            O assistente recebe: identidade, papel, studio, capacidades reais, snapshot de dados e permissões.
            Distingue ação realizada vs proposta vs impossível. Em runtime web, declara honestamente que não pode
            instalar plugins ou acessar o DAW sem bridge desktop.
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card className="bg-card/60 border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-[oklch(0.82_0.29_145)]" /> Segurança</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <Row label="RBAC" value={`${ctx.role} · ${ctx.permissions.length} permissões`} />
          <Row label="Session cookie" value="httpOnly · sameSite=lax" mono />
          <Row label="API keys no cliente" value="nunca expostas" />
          <Row label="Auditoria" value={can(ctx.role, 'audit:view') ? 'acessível' : 'restrita'} />
        </CardContent>
      </Card>

      {/* Danger zone */}
      {isOwner && (
        <Card className="border-rose-500/30 bg-rose-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-rose-200">Zona de administração</CardTitle>
            <CardDescription className="text-xs text-rose-200/70">Demo apenas — recria o workspace de demonstração</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="gap-2 border-rose-500/40 text-rose-200 hover:bg-rose-500/10" onClick={onReseed}>
              <RefreshCw className="w-3.5 h-3.5" /> Recriar DEMO WORKSPACE
            </Button>
            <p className="text-[11px] text-muted-foreground mt-2">Apaga todos os dados atuais e restaura o seed de demonstração.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className={mono ? 'font-mono text-xs truncate max-w-[60%]' : 'text-xs truncate max-w-[60%]'}>{value}</span>
    </div>
  )
}
