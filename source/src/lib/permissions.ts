// BELENTANI OMEGA ULTRA
// Autoría: Pedro Belentani
// Fecha: 2026-08-14
import type { Role } from './types'

// RBAC — permissões por papel. NUNCA improvisar com if(user.name===...).
export const PERMISSIONS: Record<Role, string[]> = {
  OWNER: [
    'studio:view', 'studio:settings',
    'crm:view', 'crm:create', 'crm:edit', 'crm:delete',
    'projects:view_all', 'projects:create', 'projects:edit', 'projects:delete',
    'projects:advance_status',
    'files:view', 'files:upload', 'files:delete',
    'versions:view', 'versions:create', 'versions:approve', 'versions:request_changes',
    'tasks:view', 'tasks:create', 'tasks:edit',
    'plugins:view', 'plugins:edit', 'plugins:install',
    'finance:view', 'finance:create', 'finance:edit',
    'audit:view', 'capabilities:view', 'automation:view',
    'assistant:use', 'assistant:tools', 'assistant:memory_edit',
    'clients:portal_view', // owner pode alternar para visão de cliente (demo)
  ],
  ENGINEER: [
    'studio:view',
    'crm:view',
    'projects:view_all', 'projects:edit', 'projects:advance_status',
    'files:view', 'files:upload', 'files:delete',
    'versions:view', 'versions:create', 'versions:approve', 'versions:request_changes',
    'tasks:view', 'tasks:create', 'tasks:edit',
    'plugins:view',
    'assistant:use', 'assistant:tools',
  ],
  COLLABORATOR: [
    'studio:view',
    'projects:view_assigned', 'projects:edit',
    'files:view', 'files:upload',
    'versions:view', 'versions:create',
    'tasks:view', 'tasks:edit',
    'plugins:view',
    'assistant:use',
  ],
  CLIENT: [
    'portal:view',
    'projects:view_own',
    'files:view', 'files:upload',
    'versions:view_own', 'versions:approve', 'versions:request_changes',
    'comments:create',
    'invoices:view_own',
    'assistant:use',
  ],
}

export function can(role: Role, permission: string): boolean {
  return PERMISSIONS[role]?.includes(permission) ?? false
}

export function hasAny(role: Role, permissions: string[]): boolean {
  return permissions.some((p) => can(role, p))
}
