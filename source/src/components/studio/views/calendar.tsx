// BELENTANI OMEGA ULTRA
// Autoría: Pedro Belentani
// Fecha: 2026-08-14
'use client'

import { useEffect, useState, useCallback } from 'react'
import { Calendar, ChevronLeft, ChevronRight, FolderKanban, Receipt, ListTodo, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { OperationalContext } from '@/lib/types'
import { STATUS_COLORS, STATUS_LABELS_PT } from '@/lib/types'
import { cn } from '@/lib/utils'

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

interface CalendarEvent {
  date: Date
  type: 'deadline' | 'invoice' | 'task'
  label: string
  sublabel?: string
  status?: string
  id: string
}

export function CalendarView({ ctx }: { ctx: OperationalContext }) {
  const [events, setEvents] = useState<{ projects: any[]; invoices: any[]; tasks: any[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [cursor, setCursor] = useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })
  const [selectedDay, setSelectedDay] = useState<number | null>(new Date().getDate())

  const monthStr = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/calendar?month=${monthStr}`).then((r) => r.json())
      setEvents(res)
    } finally {
      setLoading(false)
    }
  }, [monthStr])

  useEffect(() => {
    let cancelled = false
    fetch(`/api/calendar?month=${monthStr}`).then((r) => r.json()).then((d) => { if (!cancelled) setEvents(d) }).finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [monthStr])

  const prevMonth = () => setCursor((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))
  const nextMonth = () => setCursor((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))
  const goToday = () => { const t = new Date(); setCursor(new Date(t.getFullYear(), t.getMonth(), 1)); setSelectedDay(t.getDate()) }

  // Build calendar grid
  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const today = new Date()
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month

  // Map events to day numbers
  const eventsByDay: Record<number, CalendarEvent[]> = {}
  const addEvent = (day: number, ev: CalendarEvent) => {
    if (!eventsByDay[day]) eventsByDay[day] = []
    eventsByDay[day].push(ev)
  }
  events?.projects.forEach((p) => {
    if (p.deadline) {
      const d = new Date(p.deadline)
      if (d.getMonth() === month && d.getFullYear() === year) {
        addEvent(d.getDate(), { date: d, type: 'deadline', label: p.name, sublabel: p.client?.name, status: p.status, id: p.id })
      }
    }
  })
  events?.invoices.forEach((i) => {
    if (i.dueDate) {
      const d = new Date(i.dueDate)
      if (d.getMonth() === month && d.getFullYear() === year) {
        addEvent(d.getDate(), { date: d, type: 'invoice', label: `${i.number} · €${i.amount}`, sublabel: i.client?.name, status: i.status, id: i.id })
      }
    }
  })
  events?.tasks.forEach((t) => {
    if (t.dueDate) {
      const d = new Date(t.dueDate)
      if (d.getMonth() === month && d.getFullYear() === year) {
        addEvent(d.getDate(), { date: d, type: 'task', label: t.title, sublabel: t.project?.name, status: t.status, id: t.id })
      }
    }
  })

  const totalEvents = Object.values(eventsByDay).reduce((s, arr) => s + arr.length, 0)

  const eventColors: Record<string, string> = {
    deadline: 'bg-[oklch(0.82_0.29_145/0.2)] text-[oklch(0.85_0.32_145)] border-[oklch(0.82_0.29_145/0.3)]',
    invoice: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    task: 'bg-violet-500/15 text-violet-300 border-violet-500/30',
  }
  const eventIcons: Record<string, any> = { deadline: FolderKanban, invoice: Receipt, task: ListTodo }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Calendar className="w-6 h-6 text-[oklch(0.82_0.29_145)]" /> Calendário
          </h1>
          <p className="text-sm text-muted-foreground">{totalEvents} eventos em {MONTHS[month]} {year}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={prevMonth} className="h-9 w-9 p-0"><ChevronLeft className="w-4 h-4" /></Button>
          <Button variant="outline" size="sm" onClick={goToday} className="h-9 text-xs">Hoje</Button>
          <Button variant="outline" size="sm" onClick={nextMonth} className="h-9 w-9 p-0"><ChevronRight className="w-4 h-4" /></Button>
        </div>
      </div>

      {/* Month title */}
      <div className="flex items-center justify-center gap-3">
        <h2 className="text-xl font-bold tracking-tight neon-text">{MONTHS[month]} <span className="text-muted-foreground font-mono">{year}</span></h2>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Calendar grid */}
        <Card className="lg:col-span-2 bg-card/60 border-border/60">
          <CardContent className="p-4">
            {/* Weekday header */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {WEEKDAYS.map((d) => (
                <div key={d} className="text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground py-1">{d}</div>
              ))}
            </div>
            {/* Days */}
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square" />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1
                const isToday = isCurrentMonth && today.getDate() === day
                const isSelected = selectedDay === day
                const dayEvents = eventsByDay[day] ?? []
                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(day)}
                    className={cn(
                      'aspect-square rounded-lg border p-1 flex flex-col items-center gap-0.5 transition-all relative',
                      isSelected ? 'border-[oklch(0.82_0.29_145/0.5)] bg-[oklch(0.82_0.29_145/0.06)]' : 'border-border/40 hover:border-border/70 hover:bg-accent/30',
                      isToday && 'ring-1 ring-[oklch(0.82_0.29_145/0.4)]',
                    )}
                  >
                    <span className={cn('text-[11px] font-mono', isToday ? 'text-[oklch(0.85_0.32_145)] font-bold' : 'text-muted-foreground')}>{day}</span>
                    {dayEvents.length > 0 && (
                      <div className="flex flex-col gap-0.5 w-full overflow-hidden">
                        {dayEvents.slice(0, 2).map((ev, idx) => {
                          const Icon = eventIcons[ev.type]
                          return (
                            <div key={idx} className={cn('flex items-center gap-0.5 rounded px-0.5 text-[8px] truncate border', eventColors[ev.type])}>
                              <Icon className="w-2 h-2 shrink-0" />
                              <span className="truncate">{ev.label}</span>
                            </div>
                          )
                        })}
                        {dayEvents.length > 2 && <span className="text-[8px] text-muted-foreground text-center">+{dayEvents.length - 2}</span>}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Selected day events */}
        <Card className="bg-card/60 border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-[oklch(0.82_0.29_145)]" />
              {selectedDay ? `${selectedDay} de ${MONTHS[month]}` : 'Selecione um dia'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] pr-2">
              {loading ? (
                <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
              ) : selectedDay && eventsByDay[selectedDay] ? (
                <div className="space-y-2">
                  {eventsByDay[selectedDay].map((ev) => {
                    const Icon = eventIcons[ev.type]
                    return (
                      <div key={ev.id + ev.type} className="rounded-lg border border-border/40 bg-background/40 p-2.5">
                        <div className="flex items-center gap-2 mb-1">
                          <Icon className={cn('w-3.5 h-3.5', ev.type === 'deadline' && 'text-[oklch(0.82_0.29_145)]', ev.type === 'invoice' && 'text-amber-300', ev.type === 'task' && 'text-violet-300')} />
                          <p className="text-xs font-medium truncate flex-1">{ev.label}</p>
                          {ev.status && <Badge className={cn('text-[8px] py-0 px-1', STATUS_COLORS[ev.status])}>{STATUS_LABELS_PT[ev.status] ?? ev.status}</Badge>}
                        </div>
                        {ev.sublabel && <p className="text-[10px] text-muted-foreground truncate">{ev.sublabel}</p>}
                        <p className="text-[10px] text-muted-foreground mt-0.5">{ev.type === 'deadline' ? 'Prazo' : ev.type === 'invoice' ? 'Vencimento' : 'Tarefa'}</p>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  {selectedDay ? 'Sem eventos neste dia.' : 'Clique num dia para ver os eventos.'}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Legend */}
      <Card className="bg-card/40 border-border/60">
        <CardContent className="p-3 flex items-center gap-4 flex-wrap text-xs">
          <span className="text-muted-foreground">Legenda:</span>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded border border-[oklch(0.82_0.29_145/0.3)] bg-[oklch(0.82_0.29_145/0.2)]" /><span>Prazo de projeto</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded border border-amber-500/30 bg-amber-500/15" /><span>Vencimento de fatura</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded border border-violet-500/30 bg-violet-500/15" /><span>Tarefa</span></div>
        </CardContent>
      </Card>
    </div>
  )
}
