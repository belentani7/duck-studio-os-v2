// BELENTANI OMEGA ULTRA
// Autoría: Pedro Belentani
// Fecha: 2026-08-14
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getOperationalContext } from '@/lib/context'

// GET /api/calendar?month=YYYY-MM — events for the month (deadlines + invoice due dates)
export async function GET(req: Request) {
  const ctx = await getOperationalContext('/')
  const url = new URL(req.url)
  const monthParam = url.searchParams.get('month') // YYYY-MM
  const now = new Date()
  const year = monthParam ? parseInt(monthParam.split('-')[0]) : now.getFullYear()
  const month = monthParam ? parseInt(monthParam.split('-')[1]) - 1 : now.getMonth()

  const start = new Date(year, month, 1)
  const end = new Date(year, month + 1, 0, 23, 59, 59)

  const isClient = ctx.role === 'CLIENT'

  const [projects, invoices, tasks] = await Promise.all([
    db.project.findMany({
      where: {
        AND: [
          isClient ? { clientId: ctx.clientId ?? '' } : {},
          { deadline: { gte: start, lte: end } },
        ],
      },
      include: { client: true },
      orderBy: { deadline: 'asc' },
    }),
    db.invoice.findMany({
      where: {
        AND: [
          isClient ? { clientId: ctx.clientId ?? '' } : {},
          { dueDate: { gte: start, lte: end } },
        ],
      },
      include: { client: true },
    }),
    db.task.findMany({
      where: {
        AND: [
          isClient ? { project: { clientId: ctx.clientId ?? '' } } : {},
          { dueDate: { gte: start, lte: end } },
        ],
      },
      include: { project: true },
    }),
  ])

  return NextResponse.json({ projects, invoices, tasks, year, month })
}
