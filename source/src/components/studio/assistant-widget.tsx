// BELENTANI OMEGA ULTRA
// Autoría: Pedro Belentani
// Fecha: 2026-08-14
'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Sparkles, X, Send, Cpu, Bot, RefreshCw, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { api } from '@/lib/api-client'
import type { OperationalContext } from '@/lib/types'
import { cn } from '@/lib/utils'

interface Msg { role: 'user' | 'assistant'; content: string; ts: number }

export function AssistantWidget({ open, onOpenChange, ctx }: { open: boolean; onOpenChange: (v: boolean) => void; ctx: OperationalContext }) {
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [contextInfo, setContextInfo] = useState<any>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const loadContext = useCallback(async () => {
    try {
      const c = await api.assistant.context()
      setContextInfo(c)
      if (c.conversation?.messages?.length) {
        setMessages(c.conversation.messages.map((m: any) => ({ role: m.role, content: m.content, ts: new Date(m.createdAt).getTime() })))
        setConversationId(c.conversation.id)
      }
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => { loadContext() }, [loadContext])

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages, open])

  const send = async () => {
    const text = input.trim()
    if (!text || sending) return
    setInput('')
    setSending(true)
    const userMsg: Msg = { role: 'user', content: text, ts: Date.now() }
    setMessages((m) => [...m, userMsg])
    try {
      const res = await api.assistant.chat(text, conversationId ?? undefined)
      if (res.conversationId) setConversationId(res.conversationId)
      setMessages((m) => [...m, { role: 'assistant', content: res.content, ts: Date.now() }])
    } catch (e) {
      setMessages((m) => [...m, { role: 'assistant', content: '⚠️ Não consegui responder agora. Tente novamente.', ts: Date.now() }])
    } finally {
      setSending(false)
    }
  }

  const isClient = ctx.role === 'CLIENT'
  const greeting = isClient
    ? `Olá ${ctx.clientName ?? ctx.userName}! Sou o Duck. Posso te ajudar com suas revisões, faturas e prazos.`
    : `Bem-vindo, ${ctx.userName}. Tenho visão do studio: ${contextInfo?.capabilitiesHealthy ?? 0}/${contextInfo?.capabilitiesTotal ?? 0} capacidades ativas. O que precisa?`

  const clearChat = () => { setMessages([]); setConversationId(null) }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => onOpenChange(!open)}
        className={cn(
          'fixed bottom-6 right-6 z-50 group transition-all',
          open && 'opacity-0 pointer-events-none scale-90',
        )}
        aria-label="Abrir assistente Duck"
      >
        <div className="relative w-16 h-16">
          {/* Glow ring */}
          <div className="absolute inset-0 rounded-full bg-[oklch(0.82_0.29_145/0.25)] blur-xl animate-duck-pulse" />
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[oklch(0.82_0.29_145)] to-[oklch(0.55_0.2_170)] neon-glow animate-duck-float" />
          {/* Humanized face */}
          <div className="absolute inset-0 flex items-center justify-center">
            <svg viewBox="0 0 64 64" className="w-10 h-10">
              {/* eyes */}
              <g className="animate-duck-blink" style={{ transformOrigin: 'center' }}>
                <circle cx="24" cy="26" r="3.5" fill="#0a0f0a" />
                <circle cx="40" cy="26" r="3.5" fill="#0a0f0a" />
                <circle cx="25" cy="25" r="1.2" fill="#fff" />
                <circle cx="41" cy="25" r="1.2" fill="#fff" />
              </g>
              {/* smile */}
              <path d="M22 36 Q32 44 42 36" stroke="#0a0f0a" strokeWidth="2.5" strokeLinecap="round" fill="none" />
              {/* cheeks */}
              <circle cx="18" cy="34" r="2.5" fill="#0a0f0a" opacity="0.15" />
              <circle cx="46" cy="34" r="2.5" fill="#0a0f0a" opacity="0.15" />
            </svg>
          </div>
          {/* Sparkle indicator */}
          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-background border border-[oklch(0.82_0.29_145/0.5)] flex items-center justify-center">
            <Sparkles className="w-3 h-3 text-[oklch(0.82_0.29_145)]" />
          </div>
        </div>
        <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-mono text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Duck IA</span>
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-[calc(100vw-3rem)] sm:w-[400px] max-h-[600px] flex flex-col rounded-2xl border border-[oklch(0.82_0.29_145/0.3)] bg-card/95 backdrop-blur-xl neon-glow shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-3 p-3 border-b border-border/60 bg-gradient-to-r from-[oklch(0.82_0.29_145/0.1)] to-transparent">
            <div className="relative w-10 h-10 shrink-0">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[oklch(0.82_0.29_145)] to-[oklch(0.55_0.2_170)]" />
              <div className="absolute inset-0 flex items-center justify-center">
                <svg viewBox="0 0 64 64" className="w-7 h-7">
                  <g>
                    <circle cx="24" cy="26" r="3" fill="#0a0f0a" />
                    <circle cx="40" cy="26" r="3" fill="#0a0f0a" />
                  </g>
                  <path d="M22 36 Q32 43 42 36" stroke="#0a0f0a" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                </svg>
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-sm">Duck</p>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-duck-pulse" />
              </div>
              <p className="text-[10px] text-muted-foreground font-mono">
                {ctx.role} · {contextInfo?.capabilitiesHealthy ?? 0}/{contextInfo?.capabilitiesTotal ?? 0} caps
                {!ctx.isDesktopBridge && ' · web'}
              </p>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={clearChat} title="Nova conversa">
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onOpenChange(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Context strip */}
          <div className="px-3 py-1.5 bg-[oklch(0.82_0.29_145/0.05)] border-b border-border/40 flex items-center gap-2 text-[10px] text-muted-foreground">
            <Cpu className="w-3 h-3 text-[oklch(0.82_0.29_145)]" />
            <span className="font-mono truncate">contexto: {ctx.userName} · {ctx.studioName}{ctx.isDemo ? ' · DEMO' : ''}</span>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 min-h-0">
            <div ref={scrollRef} className="p-3 space-y-3 max-h-[360px] overflow-y-auto">
              {messages.length === 0 && (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Bot className="w-6 h-6 text-[oklch(0.82_0.29_145)] shrink-0 mt-0.5" />
                    <div className="rounded-2xl rounded-tl-sm bg-background/60 p-3 text-sm">
                      {greeting}
                    </div>
                  </div>
                  {/* Quick suggestions */}
                  <div className="flex flex-wrap gap-1.5 pl-8">
                    {isClient ? [
                      'Quais versões estão prontas para revisão?',
                      'Quanto devo em faturas?',
                      'Quando fica pronto meu projeto?',
                    ] : [
                      'O que tenho pendente hoje?',
                      'Quantos projetos ativos tenho?',
                      'Quais plugins estão instalados?',
                    ].map((s) => (
                      <button key={s} onClick={() => { setInput(s); }} className="text-[11px] px-2.5 py-1 rounded-full border border-border/60 bg-background/40 hover:neon-border transition-all text-left">
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} className={cn('flex gap-2', m.role === 'user' && 'flex-row-reverse')}>
                  {m.role === 'assistant' && <Bot className="w-6 h-6 text-[oklch(0.82_0.29_145)] shrink-0 mt-0.5" />}
                  <div className={cn(
                    'max-w-[80%] rounded-2xl p-2.5 text-sm whitespace-pre-wrap',
                    m.role === 'user'
                      ? 'bg-[oklch(0.82_0.29_145)] text-background rounded-tr-sm'
                      : 'bg-background/60 rounded-tl-sm',
                  )}>
                    {m.content}
                  </div>
                </div>
              ))}
              {sending && (
                <div className="flex gap-2">
                  <Bot className="w-6 h-6 text-[oklch(0.82_0.29_145)] shrink-0 mt-0.5" />
                  <div className="rounded-2xl rounded-tl-sm bg-background/60 p-3 flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[oklch(0.82_0.29_145)] animate-duck-pulse" />
                    <span className="w-1.5 h-1.5 rounded-full bg-[oklch(0.82_0.29_145)] animate-duck-pulse" style={{ animationDelay: '0.2s' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-[oklch(0.82_0.29_145)] animate-duck-pulse" style={{ animationDelay: '0.4s' }} />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-3 border-t border-border/60 flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              placeholder="Pergunte ao Duck…"
              className="h-9 text-sm"
              disabled={sending}
            />
            <Button size="icon" className="h-9 w-9 bg-[oklch(0.82_0.29_145)] text-background shrink-0" onClick={send} disabled={sending || !input.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  )
}
