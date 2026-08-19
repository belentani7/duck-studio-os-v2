// BELENTANI OMEGA ULTRA
// Autoría: Pedro Belentani
// Fecha: 2026-08-14
import { db } from '../src/lib/db'

// Adiciona automações + cadeias de processamento ao DEMO WORKSPACE existente.
// Idempotente: só cria se não existir.

async function main() {
  // ── Automações padrão
  const existingAuto = await db.automation.count()
  if (existingAuto === 0) {
    const automations = [
      {
        name: 'Cliente sobe arquivo → notificar engenheiro',
        trigger: 'file_uploaded',
        condition: null,
        action: JSON.stringify({ type: 'notify_owner', payload: { title: 'Novo arquivo recebido', body: 'Verificar e iniciar processamento.' } }),
        enabled: true,
      },
      {
        name: 'Projeto → Client Review → notificar cliente',
        trigger: 'project_status_change',
        condition: JSON.stringify({ field: 'to', equals: 'Client Review' }),
        action: JSON.stringify({ type: 'notify_client', payload: { title: 'Nova versão disponível para revisão', body: 'Sua master está pronta. Ouça e aprove pelo portal.' } }),
        enabled: true,
      },
      {
        name: 'Versão aprovada → criar tarefa de entrega',
        trigger: 'version_approved',
        condition: null,
        action: JSON.stringify({ type: 'create_task', payload: { title: 'Render final + entrega', priority: 'high' } }),
        enabled: true,
      },
      {
        name: 'Versão aprovada → mudar status para Approved',
        trigger: 'version_approved',
        condition: null,
        action: JSON.stringify({ type: 'set_status', payload: { status: 'Approved' } }),
        enabled: true,
      },
      {
        name: 'Projeto arquivado → criar fatura final',
        trigger: 'project_status_change',
        condition: JSON.stringify({ field: 'to', equals: 'Delivered' }),
        action: JSON.stringify({ type: 'create_invoice', payload: { amount: 0 } }),
        enabled: false,
      },
    ]
    for (const a of automations) {
      await db.automation.create({ data: a })
    }
    console.log(`✅ ${automations.length} automações criadas`)
  } else {
    console.log(`ℹ️  ${existingAuto} automações já existem, pulando`)
  }

  // ── Cadeias de processamento (presets de mastering/mixing)
  const existingChains = await db.processingChain.count()
  if (existingChains === 0) {
    const chains = [
      {
        name: 'Master Pop Moderno',
        category: 'mastering',
        genre: 'pop',
        description: 'Cadeia para pop moderno com loudness target -9 LUFS, brilho controlado e graves firmes.',
        steps: JSON.stringify([
          { plugin: 'FabFilter Pro-Q 4', order: 1, settings: 'High-pass 30Hz, de-ess 6-8kHz', notes: 'Limpeza espectral' },
          { plugin: 'Shadow Hills Mastering Compressor', order: 2, settings: 'Opto 2:1, ataque lento, glue', notes: 'Glue harmônico' },
          { plugin: 'Valhalla VintageVerb', order: 3, settings: 'Plate 1.2s mix 8%', notes: 'Ambiente sutil' },
          { plugin: 'iZotope Ozone 11 (EQ)', order: 4, settings: '+1dB @ 10kHz, -1dB @ 250Hz', notes: 'Shape tonal' },
          { plugin: 'FabFilter Pro-L 3', order: 5, settings: 'True peak -1.0dB, LUFS -9, modern', notes: 'Limit final' },
        ]),
        favorite: true,
      },
      {
        name: 'Master Streaming (-14 LUFS)',
        category: 'mastering',
        genre: 'indie',
        description: 'Cadeia para streaming com loudness moderado (-14 LUFS), dinâmica preservada.',
        steps: JSON.stringify([
          { plugin: 'TDR Nova', order: 1, settings: 'Dynamic EQ 80Hz, 4kHz', notes: 'Controle dinâmico' },
          { plugin: 'Klanghelm MJUC jr.', order: 2, settings: 'Vari-mu 1.5:1, glue', notes: 'Cola analógica' },
          { plugin: 'FabFilter Pro-L 3', order: 3, settings: 'True peak -1.0dB, LUFS -14, transparent', notes: 'Limit transparente' },
        ]),
        favorite: true,
      },
      {
        name: 'Mix Vocal Pop',
        category: 'vocal',
        genre: 'pop',
        description: 'Cadeia vocal para lead pop com presença e controle de dinâmica.',
        steps: JSON.stringify([
          { plugin: 'FabFilter Pro-Q 4', order: 1, settings: 'HPF 80Hz, notch 400Hz', notes: 'Limpeza' },
          { plugin: 'SSL Fusion (comp)', order: 2, settings: '3:1, ataque médio, -6dB GR', notes: 'Controle de dinâmica' },
          { plugin: 'Valhalla VintageVerb', order: 3, settings: 'Plate 1.8s sidechain', notes: 'Reverb sidechain' },
          { plugin: 'FabFilter Pro-L 3', order: 4, settings: 'Vocal limiter -3dB', notes: 'Taming peaks' },
        ]),
      },
      {
        name: 'Bus Master Trap/Drill',
        category: 'bus',
        genre: 'trap',
        description: 'Bus master para trap/drill com graves profundos e punch.',
        steps: JSON.stringify([
          { plugin: 'FabFilter Pro-Q 4', order: 1, settings: 'Notch 200Hz, boost 60Hz', notes: 'Shape de graves' },
          { plugin: 'Shadow Hills Mastering Compressor', order: 2, settings: 'Discrete 4:1, punch', notes: 'Punch' },
          { plugin: 'FabFilter Pro-L 3', order: 3, settings: 'True peak -1.0dB, LUFS -8, aggressive', notes: 'Loudness trap' },
        ]),
      },
      {
        name: 'Stereo Widener Suave',
        category: 'stereo',
        genre: null,
        description: 'Alargamento estéreo sutil sem comprometer mono compatibility.',
        steps: JSON.stringify([
          { plugin: 'iZotope Ozone 11 (Imager)', order: 1, settings: 'Widen 120Hz+, mantém mono <120Hz', notes: 'M/S processing' },
        ]),
      },
    ]
    for (const c of chains) {
      await db.processingChain.create({ data: c })
    }
    console.log(`✅ ${chains.length} cadeias de processamento criadas`)
  } else {
    console.log(`ℹ️  ${existingChains} cadeias já existem, pulando`)
  }

  // Registra capability de automação
  const autoCap = await db.capability.findUnique({ where: { key: 'automation.engine' } })
  if (!autoCap) {
    await db.capability.create({ data: { key: 'automation.engine', enabled: true, configured: true, healthy: true, provider: 'duck-os', reason: null } })
    console.log('✅ Capability automation.engine criada')
  }
}

main().then(async () => { await db.$disconnect(); process.exit(0) }).catch(async (e) => { console.error(e); await db.$disconnect(); process.exit(1) })
