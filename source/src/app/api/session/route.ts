// BELENTANI OMEGA ULTRA
// Autoría: Pedro Belentani
// Fecha: 2026-08-14
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getOperationalContext, SESSION_COOKIE, VIEW_COOKIE, audit } from '@/lib/context'
import type { Role } from '@/lib/types'

// GET /api/session — retorna o contexto operacional REAL
export async function GET() {
  const ctx = await getOperationalContext('/')
  return NextResponse.json(ctx)
}

// POST /api/session — alterna usuário (demo) ou "ver como" (viewAs)
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const { userId, email, viewAs } = body as { userId?: string; email?: string; viewAs?: Role | 'reset' }

  const res = NextResponse.json({ ok: true })

  let resolvedId = userId
  if (!resolvedId && email) {
    const u = await db.user.findUnique({ where: { email } })
    resolvedId = u?.id
  }

  if (resolvedId) {
    res.cookies.set(SESSION_COOKIE, resolvedId, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    })
    const u = await db.user.findUnique({ where: { id: resolvedId } })
    await audit({
      actor: u?.email ?? 'unknown',
      role: u?.role ?? 'UNKNOWN',
      action: 'session.switch_user',
      resource: 'user',
      resourceId: resolvedId,
      detail: 'Trocou de usuário (demo)',
    })
    // Ao trocar de identidade, resetamos o viewAs para evitar confusão
    res.cookies.delete(VIEW_COOKIE)
  }

  if (viewAs === 'reset') {
    res.cookies.delete(VIEW_COOKIE)
  } else if (viewAs) {
    res.cookies.set(VIEW_COOKIE, viewAs, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24,
      path: '/',
    })
    await audit({
      actor: 'demo',
      role: 'OWNER',
      action: 'session.view_as',
      resource: 'role',
      detail: `Visualizando como ${viewAs}`,
    })
  }

  return res
}
