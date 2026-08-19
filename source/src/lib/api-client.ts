// BELENTANI OMEGA ULTRA
// Autoría: Pedro Belentani
// Fecha: 2026-08-14
// Cliente de API — helpers tipados para o frontend
async function request<T>(url: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(opts?.headers ?? {}) },
    cache: 'no-store',
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || `HTTP ${res.status}`)
  }
  return res.json() as Promise<T>
}

export const api = {
  session: {
    get: () => request<import('@/lib/types').OperationalContext>('/api/session'),
    set: (body: { userId?: string; viewAs?: import('@/lib/types').Role | 'reset' }) =>
      request<{ ok: true }>('/api/session', { method: 'POST', body: JSON.stringify(body) }),
  },
  stats: () => request<any>('/api/stats'),
  clients: {
    list: () => request<any[]>('/api/clients'),
    get: (id: string) => request<any>(`/api/clients/${id}`),
    create: (data: any) => request<any>('/api/clients', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => request<any>(`/api/clients/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => request<any>(`/api/clients/${id}`, { method: 'DELETE' }),
  },
  projects: {
    list: (params?: { clientId?: string; status?: string }) => {
      const q = new URLSearchParams()
      if (params?.clientId) q.set('clientId', params.clientId)
      if (params?.status) q.set('status', params.status)
      const qs = q.toString()
      return request<any[]>(`/api/projects${qs ? '?' + qs : ''}`)
    },
    get: (id: string) => request<any>(`/api/projects/${id}`),
    create: (data: any) => request<any>('/api/projects', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => request<any>(`/api/projects/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    files: (id: string) => request<any[]>(`/api/projects/${id}/files`),
    addFile: (id: string, data: any) => request<any>(`/api/projects/${id}/files`, { method: 'POST', body: JSON.stringify(data) }),
    versions: (id: string) => request<any[]>(`/api/projects/${id}/versions`),
    addVersion: (id: string, data: any) => request<any>(`/api/projects/${id}/versions`, { method: 'POST', body: JSON.stringify(data) }),
  },
  versions: {
    comment: (id: string, body: string, timestamp?: number) =>
      request<any>(`/api/versions/${id}/comments`, { method: 'POST', body: JSON.stringify({ body, timestamp }) }),
    approve: (id: string) => request<any>(`/api/versions/${id}/approve`, { method: 'POST' }),
    requestChanges: (id: string, note?: string) =>
      request<any>(`/api/versions/${id}/request-changes`, { method: 'POST', body: JSON.stringify({ note }) }),
  },
  tasks: {
    list: (params?: { projectId?: string; status?: string }) => {
      const q = new URLSearchParams()
      if (params?.projectId) q.set('projectId', params.projectId)
      if (params?.status) q.set('status', params.status)
      const qs = q.toString()
      return request<any[]>(`/api/tasks${qs ? '?' + qs : ''}`)
    },
    create: (data: any) => request<any>('/api/tasks', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => request<any>(`/api/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => request<any>(`/api/tasks/${id}`, { method: 'DELETE' }),
  },
  plugins: {
    list: () => request<{ plugins: any[]; desktopBridge: boolean; scannerAvailable: any }>('/api/plugins'),
    create: (data: any) => request<any>('/api/plugins', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => request<any>(`/api/plugins/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  },
  invoices: {
    list: () => request<any[]>('/api/invoices'),
    get: (id: string) => request<any>(`/api/invoices/${id}`),
    create: (data: any) => request<any>('/api/invoices', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => request<any>(`/api/invoices/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  },
  notifications: {
    list: () => request<any[]>('/api/notifications'),
    markRead: (id: string) => request<any>('/api/notifications', { method: 'PATCH', body: JSON.stringify({ id, read: true }) }),
    markAllRead: () => request<any>('/api/notifications', { method: 'PATCH', body: JSON.stringify({ markAllRead: true }) }),
  },
  activity: (projectId?: string) => {
    const q = projectId ? `?projectId=${projectId}` : ''
    return request<any[]>(`/api/activity${q}`)
  },
  capabilities: () => request<any>('/api/capabilities'),
  audit: () => request<any[]>('/api/audit'),
  assistant: {
    context: () => request<any>('/api/assistant/context'),
    chat: (message: string, conversationId?: string) =>
      request<any>('/api/assistant/chat', { method: 'POST', body: JSON.stringify({ message, conversationId }) }),
  },
  seed: () => request<any>('/api/seed', { method: 'POST' }),
  search: (q: string) => request<any>(`/api/search?q=${encodeURIComponent(q)}`),
  qc: {
    get: (projectId: string) => request<{ items: any[]; template: any[] }>(`/api/projects/${projectId}/qc`),
    toggle: (projectId: string, itemId: string, checked: boolean, notes?: string) =>
      request<any>(`/api/projects/${projectId}/qc`, { method: 'PATCH', body: JSON.stringify({ itemId, checked, notes }) }),
    add: (projectId: string, label: string, category?: string) =>
      request<any>(`/api/projects/${projectId}/qc`, { method: 'POST', body: JSON.stringify({ label, category }) }),
  },
  automations: {
    list: () => request<any[]>('/api/automations'),
    create: (data: any) => request<any>('/api/automations', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => request<any>(`/api/automations/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => request<any>(`/api/automations/${id}`, { method: 'DELETE' }),
    test: (id: string, payload?: any) => request<any>(`/api/automations/${id}/test`, { method: 'POST', body: JSON.stringify(payload ?? {}) }),
  },
  chains: {
    list: () => request<any[]>('/api/chains'),
    create: (data: any) => request<any>('/api/chains', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => request<any>(`/api/chains/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => request<any>(`/api/chains/${id}`, { method: 'DELETE' }),
    apply: (id: string) => request<any>(`/api/chains/${id}`, { method: 'POST' }),
  },
  calendar: (month: string) => request<any>(`/api/calendar?month=${month}`),
  analytics: () => request<any>('/api/analytics'),
  dawBridge: {
    list: () => request<{ adapters: any[]; allCapabilities: string[] }>('/api/daw-bridge'),
    connect: (dawId: string) => request<{ ok: boolean; message: string }>('/api/daw-bridge', { method: 'POST', body: JSON.stringify({ dawId }) }),
  },
  cronChecks: () => request<any>('/api/cron/checks?token=duck-rnf-cron-2026', { method: 'POST' }),
}
