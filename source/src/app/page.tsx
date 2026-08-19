// BELENTANI OMEGA ULTRA
// Autoría: Pedro Belentani
// Fecha: 2026-08-14
'use client'

import { useState } from 'react'
import { LoadingScreen } from '@/components/studio/loading-screen'
import { StudioShell } from '@/components/studio/studio-shell'

export default function Home() {
  // Respeita prefers-reduced-motion: pula a animação longa (lazy initializer, sem effect)
  const [loaded, setLoaded] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  })

  if (!loaded) {
    return <LoadingScreen onComplete={() => setLoaded(true)} durationMs={4600} />
  }

  return <StudioShell />
}
