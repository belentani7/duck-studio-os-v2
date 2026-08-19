// BELENTANI OMEGA ULTRA
// Autoría: Pedro Belentani
// Fecha: 2026-08-14
import { cookies } from 'next/headers'
import { db } from './db'
import { PERMISSIONS } from './permissions'
import type { OperationalContext, CapabilitySnapshot, Role } from './types'

export const SESSION_COOKIE = 'duck_session_uid'
// Permite ao Owner alternar para a "visão de cliente" sem mudar a identidade real
export const VIEW_COOKIE = 'duck_view_as'

/**
 * Resolve o contexto operacional REAL a partir da sessão.
 * Esta é a fonte da verdade de identidade/role/contexto — NUNCA improvisar no cliente.
 */
export async function getOperationalContext(route = '/'): Promise<OperationalContext> {
  const cookieStore = await cookies()
  const uid = cookieStore.get(SESSION_COOKIE)?.value
  const viewAs = cookieStore.get(VIEW_COOKIE)?.value as Role | undefined

  // Default: OWNER (Duck) — em produção real isto viria de auth/JWT.
  let user = await db.user.findFirst({ where: { role: 'OWNER' } })
  if (uid) {
    const found = await db.user.findUnique({ where: { id: uid }, include: { client: true } })
    if (found) user = found
  }

  // Studio (assume único workspace)
  const studio = (await db.studio.findFirst()) ?? null

  // viewAs: Owner/Engineer podem "ver como cliente" para demo do portal.
  const effectiveRole: Role = viewAs ?? ((user?.role as Role) ?? 'OWNER')
  const targetClient =
    effectiveRole === 'CLIENT' && user?.role === 'CLIENT'
      ? user.client
      : effectiveRole === 'CLIENT'
        ? await db.client.findFirst({ orderBy: { createdAt: 'asc' } })
        : null

  const capabilities = await getCapabilities()

  return {
    userId: user?.id ?? 'anonymous',
    role: effectiveRole,
    userName: user?.name ?? 'Visitante',
    studioId: studio?.id ?? 'no-studio',
    studioName: studio?.name ?? 'DUCK STUDIO OS',
    isDemo: studio?.isDemo ?? true,
    clientId: targetClient?.id,
    clientName: targetClient?.name,
    route,
    permissions: PERMISSIONS[effectiveRole] ?? [],
    capabilities,
    isDesktopBridge: false,
  }
}

export async function getCapabilities(): Promise<CapabilitySnapshot[]> {
  const caps = await db.capability.findMany()
  return caps.map((c) => ({
    key: c.key,
    enabled: c.enabled,
    configured: c.configured,
    healthy: c.healthy,
    provider: c.provider,
    reason: c.reason,
    lastChecked: c.lastChecked.toISOString(),
  }))
}

/** Helper para registrar auditoria de forma consistente. */
export async function audit(opts: {
  actor: string
  role: string
  action: string
  resource: string
  resourceId?: string
  detail?: string
  source?: string
}) {
  try {
    await db.auditLog.create({ data: { ...opts, source: opts.source ?? 'web' } })
  } catch {
    // auditoria nunca deve quebrar a operação principal
  }
}
