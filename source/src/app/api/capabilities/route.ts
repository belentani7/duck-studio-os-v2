// BELENTANI OMEGA ULTRA
// Autoría: Pedro Belentani
// Fecha: 2026-08-14
import { NextResponse } from 'next/server'
import { getCapabilities, getOperationalContext } from '@/lib/context'

// GET /api/capabilities — System Capability Registry (real)
export async function GET() {
  const ctx = await getOperationalContext('/system/capabilities')
  const capabilities = await getCapabilities()
  return NextResponse.json({
    capabilities,
    isDesktopBridge: ctx.isDesktopBridge,
    isDemo: ctx.isDemo,
  })
}
