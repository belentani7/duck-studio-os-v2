// BELENTANI OMEGA ULTRA
// Autoría: Pedro Belentani
// Fecha: 2026-08-14
// DUCK STUDIO OS — Tipos compartilhados do domínio

export type Role = 'OWNER' | 'ENGINEER' | 'COLLABORATOR' | 'CLIENT'

export type ProjectStatus =
  | 'Lead' | 'Inquiry' | 'Quoted' | 'Accepted' | 'Waiting Files'
  | 'Ready' | 'In Production' | 'Mix Review' | 'Master Review'
  | 'Client Review' | 'Changes Requested' | 'Approved' | 'Delivered' | 'Archived'

export type VersionStatus = 'draft' | 'review' | 'changes_requested' | 'approved' | 'final' | 'superseded'

export type PluginStatus =
  | 'known' | 'available' | 'installed' | 'detected' | 'licensed'
  | 'update_available' | 'missing' | 'incompatible' | 'unknown'

export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'blocked'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
export type FileStatus = 'uploaded' | 'validated' | 'processing' | 'ready' | 'rejected'

export interface OperationalContext {
  userId: string
  role: Role
  userName: string
  studioId: string
  studioName: string
  isDemo: boolean
  clientId?: string
  clientName?: string
  route: string
  permissions: string[]
  capabilities: CapabilitySnapshot[]
  isDesktopBridge: boolean
}

export interface CapabilitySnapshot {
  key: string
  enabled: boolean
  configured: boolean
  healthy: boolean
  provider?: string | null
  reason?: string | null
  lastChecked: string
}

export const PROJECT_STATUSES: ProjectStatus[] = [
  'Lead', 'Inquiry', 'Quoted', 'Accepted', 'Waiting Files', 'Ready',
  'In Production', 'Mix Review', 'Master Review', 'Client Review',
  'Changes Requested', 'Approved', 'Delivered', 'Archived',
]

export const PLUGIN_STATUSES: PluginStatus[] = [
  'known', 'available', 'installed', 'detected', 'licensed',
  'update_available', 'missing', 'incompatible', 'unknown',
]

// Mapeamento de rótulos PT-BR para status
export const STATUS_LABELS_PT: Record<string, string> = {
  Lead: 'Lead',
  Inquiry: 'Consulta',
  Quoted: 'Orçado',
  Accepted: 'Aceito',
  'Waiting Files': 'Aguardando Arquivos',
  Ready: 'Pronto',
  'In Production': 'Em Produção',
  'Mix Review': 'Revisão de Mix',
  'Master Review': 'Revisão de Master',
  'Client Review': 'Revisão do Cliente',
  'Changes Requested': 'Alterações Solicitadas',
  Approved: 'Aprovado',
  Delivered: 'Entregue',
  Archived: 'Arquivado',
  draft: 'Rascunho',
  review: 'Em Revisão',
  changes_requested: 'Alterações Solicitadas',
  approved: 'Aprovado',
  final: 'Final',
  superseded: 'Substituído',
  known: 'Conhecido',
  available: 'Disponível',
  installed: 'Instalado',
  detected: 'Detectado',
  licensed: 'Licenciado',
  update_available: 'Atualização Disponível',
  missing: 'Não Encontrado',
  incompatible: 'Incompatível',
  unknown: 'Desconhecido',
  todo: 'A Fazer',
  in_progress: 'Em Andamento',
  done: 'Concluído',
  blocked: 'Bloqueado',
  draft_invoice: 'Rascunho',
  sent: 'Enviada',
  paid: 'Paga',
  overdue: 'Vencida',
  cancelled: 'Cancelada',
}

// Cores (neon verde predominante + semânticas) para badges
export const STATUS_COLORS: Record<string, string> = {
  Lead: 'bg-zinc-500/15 text-zinc-300 border-zinc-500/30',
  Quoted: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  Accepted: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
  'Waiting Files': 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  Ready: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
  'In Production': 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  'Client Review': 'bg-violet-500/15 text-violet-300 border-violet-500/30',
  'Changes Requested': 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  Approved: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  Delivered: 'bg-emerald-600/20 text-emerald-300 border-emerald-600/40',
  Archived: 'bg-zinc-600/15 text-zinc-400 border-zinc-600/30',
  draft: 'bg-zinc-500/15 text-zinc-300 border-zinc-500/30',
  review: 'bg-violet-500/15 text-violet-300 border-violet-500/30',
  changes_requested: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  approved: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  final: 'bg-emerald-600/20 text-emerald-300 border-emerald-600/40',
  superseded: 'bg-zinc-600/15 text-zinc-400 border-zinc-600/30',
  installed: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  missing: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
  incompatible: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
  available: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
  known: 'bg-zinc-500/15 text-zinc-300 border-zinc-500/30',
  todo: 'bg-zinc-500/15 text-zinc-300 border-zinc-500/30',
  in_progress: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
  done: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  blocked: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
  sent: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
  paid: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  overdue: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
}
