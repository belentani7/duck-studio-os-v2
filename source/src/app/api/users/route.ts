// BELENTANI OMEGA ULTRA
// Autoría: Pedro Belentani
// Fecha: 2026-08-14
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/users — lista identidades demo para o switcher (sem expor secrets)
export async function GET() {
  const users = await db.user.findMany({
    select: { id: true, name: true, email: true, role: true },
    orderBy: [{ role: 'asc' }, { name: 'asc' }],
  })
  return NextResponse.json(users)
}
