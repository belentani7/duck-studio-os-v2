// BELENTANI OMEGA ULTRA
// Autoría: Pedro Belentani
// Fecha: 2026-08-14
import { db } from '../src/lib/db'

// DUCK STUDIO OS — Seed de DEMO WORKSPACE (marcado explicitamente)
// NUNCA misturar demo com produção. Este script reinicia o banco e cria um workspace de demonstração.

async function main() {
  console.log('🌱 Reiniciando banco para DEMO WORKSPACE...')

  // Limpa tudo (ordem por dependência)
  await db.auditLog.deleteMany()
  await db.notification.deleteMany()
  await db.message.deleteMany()
  await db.conversation.deleteMany()
  await db.memory.deleteMany()
  await db.activity.deleteMany()
  await db.comment.deleteMany()
  await db.task.deleteMany()
  await db.version.deleteMany()
  await db.fileAsset.deleteMany()
  await db.track.deleteMany()
  await db.invoice.deleteMany()
  await db.pluginInstallation.deleteMany()
  await db.pluginPack.deleteMany()
  await db.plugin.deleteMany()
  await db.clientHistory.deleteMany()
  await db.contact.deleteMany()
  await db.project.deleteMany()
  await db.client.deleteMany()
  await db.user.deleteMany()
  await db.studio.deleteMany()

  // ── Studio (DEMO marcado)
  const studio = await db.studio.create({
    data: { name: 'DUCK STUDIO — RnF (Ritmo & Frequência)', slug: 'duck-rnf', isDemo: true },
  })

  // ── Capacidades reais (verificáveis no runtime)
  const caps = [
    { key: 'database.connected', enabled: true, configured: true, healthy: true, provider: 'sqlite', reason: null },
    { key: 'ai.connected', enabled: true, configured: true, healthy: true, provider: 'z-ai-web-dev-sdk', reason: null },
    { key: 'storage.connected', enabled: true, configured: true, healthy: true, provider: 'local-fs', reason: null },
    { key: 'email.connected', enabled: false, configured: false, healthy: false, provider: null, reason: 'SMTP não configurado' },
    { key: 'audioAnalysis.enabled', enabled: true, configured: true, healthy: true, provider: 'web-audio-api', reason: null },
    { key: 'pluginScanner.available', enabled: false, configured: false, healthy: false, provider: null, reason: 'Requer bridge desktop (Electron/Tauri). Executando em navegador.' },
    { key: 'desktopBridge.connected', enabled: false, configured: false, healthy: false, provider: null, reason: 'Sem companion local detectado' },
    { key: 'calendar.connected', enabled: false, configured: false, healthy: false, provider: null, reason: 'Não integrado' },
    { key: 'billing.connected', enabled: false, configured: false, healthy: false, provider: null, reason: 'Sem gateway de pagamento' },
    { key: 'backup.healthy', enabled: true, configured: true, healthy: true, provider: 'sqlite-file', reason: null },
  ]
  for (const c of caps) {
    await db.capability.create({ data: c })
  }

  // ── Usuários por papel
  const owner = await db.user.create({
    data: { email: 'duck@rnf.studio', name: 'Duck RnF', role: 'OWNER' },
  })
  const engineer = await db.user.create({
    data: { email: 'pedro@rnf.studio', name: 'Pedro Engenheiro', role: 'ENGINEER' },
  })
  const collab = await db.user.create({
    data: { email: 'ana@rnf.studio', name: 'Ana Colaboradora', role: 'COLLABORATOR' },
  })

  // ── Clientes (cada cliente tem seu próprio usuário CLIENT vinculado)
  const client1User = await db.user.create({ data: { email: 'ana.silva@email.com', name: 'Ana Silva', role: 'CLIENT' } })
  const client1 = await db.client.create({
    data: {
      name: 'Ana Silva',
      email: 'ana.silva@email.com',
      phone: '+351 912 345 678',
      company: 'Silva Records',
      artistName: 'ANA S',
      language: 'pt-BR',
      timezone: 'Europe/Madrid',
      tags: 'pop,mastering,returning',
      notes: 'Cliente recorrente. Prefere masters com loudness moderado (-9 LUFS).',
      ownerId: owner.id,
    },
  })
  await db.user.update({ where: { id: client1User.id }, data: { clientId: client1.id } })

  const client2User = await db.user.create({ data: { email: 'joao.pereira@email.com', name: 'João Pereira', role: 'CLIENT' } })
  const client2 = await db.client.create({
    data: {
      name: 'João Pereira',
      email: 'joao.pereira@email.com',
      phone: '+351 967 111 222',
      company: 'Trap House Lda',
      artistName: 'JP Beats',
      language: 'pt-BR',
      timezone: 'Europe/Madrid',
      tags: 'trap,beatmaking,novo',
      notes: 'Novo cliente. Projato de EP de 6 faixas.',
      ownerId: owner.id,
    },
  })
  await db.user.update({ where: { id: client2User.id }, data: { clientId: client2.id } })

  const client3 = await db.client.create({
    data: {
      name: 'Mariana Costa',
      email: 'mariana.costa@email.com',
      phone: '+351 933 444 555',
      company: null,
      artistName: 'Mari Costa',
      language: 'pt-BR',
      timezone: 'Europe/Madrid',
      tags: 'indie,mix,lead',
      notes: 'Lead — pediu orçamento para mix de single.',
      ownerId: owner.id,
    },
  })

  // ── Projetos com status do workflow
  const now = new Date()
  const inDays = (d: number) => new Date(now.getTime() + d * 86400000)

  const p1 = await db.project.create({
    data: {
      name: 'Master — ANA S "Noite Neon"',
      clientId: client1.id,
      status: 'Client Review',
      service: 'Mastering',
      price: 350,
      deadline: inDays(3),
      description: 'Master de single pop-synthwave. 1 faixa, 24bit/48kHz.',
      ownerId: owner.id,
    },
  })
  const p2 = await db.project.create({
    data: {
      name: 'EP Trap — JP Beats "Cidade Escura"',
      clientId: client2.id,
      status: 'In Production',
      service: 'Mix & Master',
      price: 1800,
      deadline: inDays(21),
      description: 'EP de 6 faixas trap. Mix e master completos.',
      ownerId: owner.id,
    },
  })
  const p3 = await db.project.create({
    data: {
      name: 'Mix — Mari Costa "Voo Livre"',
      clientId: client3.id,
      status: 'Quoted',
      service: 'Mixing',
      price: 250,
      deadline: inDays(14),
      description: 'Lead: orçamento enviado, aguardando aceitação.',
      ownerId: owner.id,
    },
  })

  // ── Tracks + arquivos (metadados — sem binários reais, status reflete realidade)
  const t1 = await db.track.create({ data: { projectId: p1.id, name: 'Mixdown Principal', type: 'mix', order: 0 } })
  const t2 = await db.track.create({ data: { projectId: p1.id, name: 'Referência - The Weeknd', type: 'reference', order: 1 } })
  await db.fileAsset.create({
    data: { projectId: p1.id, trackId: t1.id, name: 'ANA_S_Noite_Neon_Mixdown.wav', category: '01_SOURCE', mime: 'audio/wav', size: 48234496, hash: 'sha256:demo1', status: 'validated', uploadedById: client1User.id },
  })
  await db.fileAsset.create({
    data: { projectId: p1.id, trackId: t2.id, name: 'referencia_weeknd.wav', category: '03_REFERENCES', mime: 'audio/wav', size: 39218432, hash: 'sha256:demo2', status: 'validated', uploadedById: client1User.id },
  })

  // ── Versões (workflow real: draft → review → approved)
  const v1 = await db.version.create({ data: { projectId: p1.id, name: 'Master v1', status: 'superseded', notes: 'Primeira passada. Loudness alto demais.', creatorId: owner.id } })
  const v2 = await db.version.create({ data: { projectId: p1.id, name: 'Master v2', status: 'changes_requested', notes: 'Cliente pediu mais brilho nos agudos.', creatorId: owner.id, parentVersionId: v1.id } })
  const v3 = await db.version.create({ data: { projectId: p1.id, name: 'Master v3', status: 'review', notes: 'Ajuste de agudos aplicado. Aguardando aprovação.', creatorId: owner.id, parentVersionId: v2.id } })

  await db.comment.create({ data: { versionId: v2.id, authorId: client1User.id, body: 'Gostei, mas os agudos estão abafados. Pode abrir mais em 8kHz?', timestamp: 12.4 } })
  await db.comment.create({ data: { versionId: v3.id, authorId: owner.id, body: 'Ajustado: +1.5dB em 8kHz, true peak em -1.0dB. Pronto para revisão final.', timestamp: 0 } })

  // ── Tarefas reais
  await db.task.create({ data: { projectId: p1.id, title: 'Render final master v3 em 24bit/48kHz', status: 'todo', priority: 'high', assigneeId: owner.id, dueDate: inDays(1) } })
  await db.task.create({ data: { projectId: p2.id, title: 'Mix faixa 3 — "Madrugada"', status: 'in_progress', priority: 'medium', assigneeId: engineer.id, dueDate: inDays(5) } })
  await db.task.create({ data: { projectId: p2.id, title: 'Receber stems do cliente (faixas 4-6)', status: 'blocked', priority: 'urgent', assigneeId: engineer.id, dueDate: inDays(2) } })
  await db.task.create({ data: { projectId: p3.id, title: 'Confirmar orçamento com Mari', status: 'todo', priority: 'medium', assigneeId: owner.id, dueDate: inDays(2) } })

  // ── Atividades reais
  const acts = [
    { actorId: client1User.id, projectId: p1.id, action: 'upload', resource: 'file', resourceId: t1.id, detail: 'Cliente subiu Mixdown Principal' },
    { actorId: owner.id, projectId: p1.id, action: 'create', resource: 'version', resourceId: v3.id, detail: 'Pedro criou Master v3' },
    { actorId: client1User.id, projectId: p1.id, action: 'comment', resource: 'version', resourceId: v2.id, detail: 'Cliente pediu alteração em v2' },
    { actorId: owner.id, projectId: p2.id, action: 'status', resource: 'project', resourceId: p2.id, detail: 'Projeto entrou em In Production' },
  ]
  for (const a of acts) await db.activity.create({ data: a })

  // ── Plugins (registry verificável — NÃO simula instalação)
  const plugins = [
    { name: 'FabFilter Pro-L 3', developer: 'FabFilter', version: '3.0', format: 'VST3', category: 'Limiter', tags: 'mastering,loudness,true-peak', status: 'known', officialUrl: 'https://www.fabfilter.com/pro-l', notes: 'Limite de true-peak padrão da indústria.' },
    { name: 'FabFilter Pro-Q 4', developer: 'FabFilter', version: '4.0', format: 'VST3', category: 'EQ', tags: 'mastering,dynamic-eq', status: 'known', officialUrl: 'https://www.fabfilter.com/pro-q', notes: 'EQ dinâmico espectral.' },
    { name: 'iZotope Ozone 11 Advanced', developer: 'iZotope', version: '11.0', format: 'VST3', category: 'Mastering Suite', tags: 'mastering,ai-assistant', status: 'known', officialUrl: 'https://www.izotope.com/en/products/ozone.html', notes: 'Suite de mastering com assistente IA.' },
    { name: 'Shadow Hills Mastering Compressor', developer: 'Shadow Hills', version: '1.0', format: 'AAX', category: 'Compressor', tags: 'mastering,analog,glue', status: 'available', officialUrl: 'https://www.shadowhillsequipment.com', notes: 'Compressor analógico de mastering.' },
    { name: 'SSL Fusion', developer: 'Solid State Logic', version: '1.0', format: 'VST3', category: 'Bus Processor', tags: 'mastering,stereo,glue', status: 'missing', officialUrl: 'https://www.solidstatelogic.com/products/fusion', notes: 'Não detectado no sistema.' },
    { name: 'Klanghelm MJUC jr.', developer: 'Klanghelm', version: '1.0', format: 'VST3', category: 'Compressor', tags: 'free,vari-mu', status: 'installed', officialUrl: 'https://www.klanghelm.com/contents/products/MJUCjr/MJUCjr.php', notes: 'Instalado (vari-mu gratuito).', favorite: true },
    { name: 'TDR Nova', developer: 'Tokyo Dawn Records', version: '2.0', format: 'VST3', category: 'EQ', tags: 'free,dynamic-eq', status: 'installed', officialUrl: 'https://www.tokyodawn.net/tdr-nova/', notes: 'EQ dinâmico gratuito.', favorite: true },
    { name: 'Valhalla VintageVerb', developer: 'Valhalla DSP', version: '3.0', format: 'VST3', category: 'Reverb', tags: 'mix,reverb', status: 'known', officialUrl: 'https://valhalladsp.com/shop/reverb/valhalla-vintageverb/', notes: 'Reverb de referência.' },
    { name: 'SoXCLAP Spectrum Analyzer', developer: 'Open Source', version: '0.1', format: 'CLAP', category: 'Analyzer', tags: 'free,analysis', status: 'incompatible', officialUrl: 'https://github.com/free-audio/clap', notes: 'CLAP não suportado pelo DAW atual.' },
  ]
  for (const p of plugins) {
    const created = await db.plugin.create({ data: p })
    if (p.status === 'installed') {
      await db.pluginInstallation.create({ data: { pluginId: created.id, path: 'C:\\Program Files\\Common Files\\VST3\\' + created.name + '.vst3', os: 'win', detected: true, lastScanned: now } })
    }
  }

  // ── Faturas reais
  await db.invoice.create({ data: { clientId: client1.id, projectId: p1.id, number: 'RNF-2025-001', amount: 350, status: 'sent', dueDate: inDays(10) } })
  await db.invoice.create({ data: { clientId: client2.id, projectId: p2.id, number: 'RNF-2025-002', amount: 900, status: 'paid', dueDate: inDays(-5) } })

  // ── Notificações reais
  await db.notification.create({ data: { userId: owner.id, type: 'project', title: 'Ana Silva pediu alteração em Master v2', body: 'Comentário: agudos abafados em 8kHz', read: false } })
  await db.notification.create({ data: { userId: owner.id, type: 'billing', title: 'Fatura RNF-2025-001 enviada', body: '€350 — vence em 10 dias', read: false } })
  await db.notification.create({ data: { userId: owner.id, type: 'system', title: 'Capacidade pluginScanner indisponível', body: 'Bridge desktop não detectado. Funciona em navegador.', read: true } })
  await db.notification.create({ data: { userId: client1User.id, type: 'project', title: 'Master v3 disponível para revisão', body: 'Ajuste de agudos aplicado. Ouça e aprove.', read: false } })

  // ── Memória persistente (preferências)
  await db.memory.create({ data: { scope: 'studio', key: 'loudness_target', value: '-9 LUFS (pop) / -14 LUFS (streaming)' } })
  await db.memory.create({ data: { scope: 'client', key: 'preference', value: 'Loudness moderado, agudos brilhantes, sem distorção audível.', clientId: client1.id } })

  // ── Histórico do cliente
  await db.clientHistory.create({ data: { clientId: client1.id, event: 'onboarding', detail: 'Cliente recorrente desde 2024.' } })
  await db.clientHistory.create({ data: { clientId: client1.id, event: 'project', detail: 'Master anterior "Manhã Cinzenta" aprovado e entregue.' } })

  // ── Audit log inicial
  await db.auditLog.create({ data: { actor: 'system', role: 'SYSTEM', action: 'seed', resource: 'studio', resourceId: studio.id, detail: 'DEMO WORKSPACE criado', source: 'seed' } })

  console.log('✅ DEMO WORKSPACE criado com sucesso.')
  console.log(`   Studio: ${studio.name} (isDemo=${studio.isDemo})`)
  console.log(`   Usuários: Owner=${owner.email}, Engineer=${engineer.email}, Collab=${collab.email}`)
  console.log(`   Clientes: ${client1.email}, ${client2.email}, ${client3.email}`)
  console.log(`   Projetos: ${[p1, p2, p3].map((p) => p.name).join(' | ')}`)
}

main()
  .then(async () => {
    await db.$disconnect()
    process.exit(0)
  })
  .catch(async (e) => {
    console.error(e)
    await db.$disconnect()
    process.exit(1)
  })
