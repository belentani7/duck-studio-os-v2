// BELENTANI OMEGA ULTRA
// Autoría: Pedro Belentani
// Fecha: 2026-08-14
import { NextResponse } from 'next/server'
import { execSync } from 'child_process'

// POST /api/seed — recria o DEMO WORKSPACE (apaga tudo)
export async function POST() {
  try {
    execSync('bun run seed', { cwd: process.cwd(), stdio: 'pipe', timeout: 30000 })
    return NextResponse.json({ ok: true, message: 'DEMO WORKSPACE recriado com sucesso.' })
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : 'erro' }, { status: 500 })
  }
}
