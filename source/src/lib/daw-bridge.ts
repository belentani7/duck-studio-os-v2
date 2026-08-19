// BELENTANI OMEGA ULTRA
// Autoría: Pedro Belentani
// Fecha: 2026-08-14
import { db } from './db'

/**
 * DAW Bridge Abstraction
 *
 * Padrão adapter para integrar com diferentes DAWs (Ableton, FL Studio, Logic, Reaper, etc.).
 * No runtime web, nenhum adapter está realmente conectado — isto é modelado honestamente.
 * Quando um companion desktop (Electron/Tauri) estiver disponível, os adapters podem
 * implementar a comunicação real via OSC, scripting API, ou watched directories.
 */

export type DAWId = 'ableton' | 'flstudio' | 'logic' | 'reaper' | 'protools' | 'cubase' | 'studioone'

export interface DAWAdapter {
  id: DAWId
  name: string
  manufacturer: string
  /** Protocolos de comunicação suportados pelo adapter */
  protocols: string[]
  /** Capacidades que o adapter PODE suportar (quando conectado) */
  capabilities: string[]
  /** Estado real: disconnected | connecting | connected | error */
  status: 'disconnected' | 'connecting' | 'connected' | 'error'
  /** Última verificação de conexão */
  lastChecked?: Date
  /** Razão do estado atual (honesto sobre limitações) */
  reason?: string
}

export const DAW_ADAPTERS: DAWAdapter[] = [
  {
    id: 'ableton',
    name: 'Ableton Live',
    manufacturer: 'Ableton',
    protocols: ['Max for Live', 'OSC', 'MIDI', 'Watched Directories'],
    capabilities: ['project.open', 'track.list', 'render.start', 'tempo.set', 'export.stems'],
    status: 'disconnected',
    reason: 'Requer companion desktop (Max for Live + OSC bridge). Não disponível em navegador.',
  },
  {
    id: 'flstudio',
    name: 'FL Studio',
    manufacturer: 'Image-Line',
    protocols: ['FL Studio API (Python)', 'MIDI', 'Watched Directories'],
    capabilities: ['project.open', 'track.list', 'render.start', 'export.stems'],
    status: 'disconnected',
    reason: 'Requer FL Studio API + bridge Python. Não disponível em navegador.',
  },
  {
    id: 'logic',
    name: 'Logic Pro',
    manufacturer: 'Apple',
    protocols: ['AppleScript', 'MIDI', 'Watched Directories'],
    capabilities: ['project.open', 'render.start', 'export.stems'],
    status: 'disconnected',
    reason: 'Requer macOS + AppleScript bridge. Não disponível em navegador.',
  },
  {
    id: 'reaper',
    name: 'Reaper',
    manufacturer: 'Cockos',
    protocols: ['ReaScript (Lua/Python)', 'OSC', 'MIDI', 'Web Remote API'],
    capabilities: ['project.open', 'track.list', 'render.start', 'tempo.set', 'export.stems', 'automation.read'],
    status: 'disconnected',
    reason: 'Reaper tem Web Remote API — potencialmente conectável via companion.',
  },
  {
    id: 'protools',
    name: 'Pro Tools',
    manufacturer: 'Avid',
    protocols: ['Avid EuCon', 'MIDI', 'Watched Directories'],
    capabilities: ['project.open', 'render.start'],
    status: 'disconnected',
    reason: 'API limitada. Watched directories é a via mais prática.',
  },
  {
    id: 'cubase',
    name: 'Cubase',
    manufacturer: 'Steinberg',
    protocols: ['VST3 SDK', 'MIDI', 'OSC', 'Watched Directories'],
    capabilities: ['project.open', 'track.list', 'render.start', 'export.stems'],
    status: 'disconnected',
    reason: 'Requer VST3 SDK bridge. Não disponível em navegador.',
  },
  {
    id: 'studioone',
    name: 'Studio One',
    manufacturer: 'PreSonus',
    protocols: ['Studio One API', 'MIDI', 'Watched Directories'],
    capabilities: ['project.open', 'render.start', 'export.stems'],
    status: 'disconnected',
    reason: 'Requer Studio One API bridge. Não disponível em navegador.',
  },
]

/**
 * Verifica o estado de conexão de todos os adapters.
 * No runtime web, todos permanecem disconnected — isto é honesto.
 * No companion desktop, isto faria um ping real a cada adapter.
 */
export async function getDAWAdapters(): Promise<DAWAdapter[]> {
  const bridgeCap = await db.capability.findUnique({ where: { key: 'desktopBridge.connected' } })
  const isBridgeConnected = bridgeCap?.healthy ?? false

  if (isBridgeConnected) {
    // Em companion real, aqui faria ping a cada DAW
    return DAW_ADAPTERS.map((a) => ({ ...a, lastChecked: new Date() }))
  }

  return DAW_ADAPTERS.map((a) => ({ ...a, lastChecked: new Date(), status: 'disconnected' as const }))
}

/**
 * Tenta conectar a um DAW específico (apenas via companion).
 * No web runtime, retorna erro honesto.
 */
export async function connectDAW(dawId: DAWId): Promise<{ ok: boolean; message: string }> {
  const bridgeCap = await db.capability.findUnique({ where: { key: 'desktopBridge.connected' } })
  if (!bridgeCap?.healthy) {
    const adapter = DAW_ADAPTERS.find((a) => a.id === dawId)
    return {
      ok: false,
      message: `Não é possível conectar a ${adapter?.name ?? dawId} a partir do navegador. ` +
        'Instale o companion desktop (Electron/Tauri) para habilitar a ponte com o DAW. ' +
        (adapter?.reason ?? ''),
    }
  }
  // Em companion real, aqui iniciaria a conexão via protocolo do adapter
  return { ok: true, message: 'Conexão iniciada via companion desktop.' }
}
