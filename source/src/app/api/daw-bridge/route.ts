// BELENTANI OMEGA ULTRA
// Autoría: Pedro Belentani
// Fecha: 2026-08-14
import { NextResponse } from 'next/server'
import { getDAWAdapters, connectDAW, DAW_ADAPTERS } from '@/lib/daw-bridge'

// GET /api/daw-bridge — lista todos os adapters DAW com estado real
export async function GET() {
  const adapters = await getDAWAdapters()
  // Matriz de capacidades: qual DAW suporta qual operação
  const allCapabilities = Array.from(new Set(DAW_ADAPTERS.flatMap((a) => a.capabilities)))
  return NextResponse.json({ adapters, allCapabilities })
}

// POST /api/daw-bridge — tenta conectar a um DAW (apenas via companion)
export async function POST(req: Request) {
  const body = await req.json()
  const { dawId } = body
  if (!dawId) return NextResponse.json({ error: 'dawId obrigatório' }, { status: 400 })
  const result = await connectDAW(dawId)
  return NextResponse.json(result, { status: result.ok ? 200 : 400 })
}
