// BELENTANI OMEGA ULTRA
// Autoría: Pedro Belentani
// Fecha: 2026-08-14
'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Play, Pause, Upload, MessageSquarePlus, Volume2, Clock, AudioWaveform, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'

interface Comment { id: string; timestamp: number; body: string; author?: string }

export function WaveformPlayer({
  comments = [],
  onAddComment,
}: {
  comments?: Comment[]
  onAddComment?: (timestamp: number, body: string) => void
}) {
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [commentDraft, setCommentDraft] = useState('')
  const [showDraft, setShowDraft] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const sourceRef = useRef<AudioBufferSourceNode | null>(null)
  const gainRef = useRef<GainNode | null>(null)
  const startTimeRef = useRef(0)
  const pauseOffsetRef = useRef(0)
  const rafRef = useRef<number | null>(null)
  const peaksRef = useRef<Float32Array | null>(null)

  // Draw waveform on canvas
  const drawWaveform = useCallback((progress: number) => {
    const canvas = canvasRef.current
    const peaks = peaksRef.current
    if (!canvas || !peaks) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const dpr = window.devicePixelRatio || 1
    const w = canvas.clientWidth
    const h = canvas.clientHeight
    canvas.width = w * dpr
    canvas.height = h * dpr
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, w, h)

    const mid = h / 2
    const barW = w / peaks.length
    const playedX = progress * w

    // Grid line center
    ctx.strokeStyle = 'oklch(0.82 0.29 145 / 0.1)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(0, mid)
    ctx.lineTo(w, mid)
    ctx.stroke()

    for (let i = 0; i < peaks.length; i++) {
      const x = i * barW
      const amp = peaks[i] * (mid * 0.92)
      const isPlayed = x < playedX
      if (isPlayed) {
        ctx.fillStyle = 'oklch(0.85 0.32 145)'
        ctx.shadowColor = 'oklch(0.82 0.29 145 / 0.6)'
        ctx.shadowBlur = 4
      } else {
        ctx.fillStyle = 'oklch(0.5 0.1 160 / 0.45)'
        ctx.shadowBlur = 0
      }
      ctx.fillRect(x, mid - amp, Math.max(1, barW - 0.5), amp * 2)
    }
    ctx.shadowBlur = 0

    // Playhead
    ctx.strokeStyle = 'oklch(0.85 0.32 145)'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(playedX, 0)
    ctx.lineTo(playedX, h)
    ctx.stroke()
    // Playhead dot
    ctx.fillStyle = 'oklch(0.85 0.32 145)'
    ctx.beginPath()
    ctx.arc(playedX, 4, 3, 0, Math.PI * 2)
    ctx.fill()

    // Comment markers
    for (const c of comments) {
      const cx = (c.timestamp / duration) * w
      if (cx >= 0 && cx <= w) {
        ctx.fillStyle = 'oklch(0.7 0.2 40)'
        ctx.beginPath()
        ctx.moveTo(cx, h - 2)
        ctx.lineTo(cx - 4, h - 8)
        ctx.lineTo(cx + 4, h - 8)
        ctx.closePath()
        ctx.fill()
      }
    }
  }, [comments, duration])

  // Precompute waveform peaks from decoded audio
  const computePeaks = useCallback((buffer: AudioBuffer) => {
    const channel = buffer.getChannelData(0)
    const samples = 800 // visual resolution
    const block = Math.floor(channel.length / samples)
    const peaks = new Float32Array(samples)
    for (let i = 0; i < samples; i++) {
      let max = 0
      const start = i * block
      for (let j = 0; j < block; j++) {
        const v = Math.abs(channel[start + j] || 0)
        if (v > max) max = v
      }
      peaks[i] = max
    }
    peaksRef.current = peaks
    drawWaveform(0)
  }, [drawWaveform])

  // Decode audio file via Web Audio API
  const handleFile = useCallback(async (file: File) => {
    setError(null)
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      }
      const arrayBuf = await file.arrayBuffer()
      const decoded = await audioCtxRef.current.decodeAudioData(arrayBuf.slice(0))
      setAudioBuffer(decoded)
      setDuration(decoded.duration)
      setFileName(file.name)
      pauseOffsetRef.current = 0
      setCurrentTime(0)
      setPlaying(false)
      computePeaks(decoded)
    } catch {
      setError('Não foi possível decodificar o áudio. Verifique o formato (WAV/MP3/FLAC).')
    }
  }, [computePeaks])

  // Redraw on resize / comments change
  useEffect(() => {
    drawWaveform(currentTime / (duration || 1))
    const onResize = () => drawWaveform(currentTime / (duration || 1))
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [drawWaveform, currentTime, duration])

  // Playback loop — ref-based to avoid self-reference (updated via effect)
  const tickRef = useRef<() => void>(() => {})
  useEffect(() => {
    tickRef.current = () => {
      if (!audioCtxRef.current || !duration) return
      const t = pauseOffsetRef.current + (audioCtxRef.current.currentTime - startTimeRef.current)
      if (t >= duration) {
        setPlaying(false)
        pauseOffsetRef.current = 0
        setCurrentTime(0)
        drawWaveform(0)
        return
      }
      setCurrentTime(t)
      drawWaveform(t / duration)
      rafRef.current = requestAnimationFrame(() => tickRef.current())
    }
  }, [duration, drawWaveform])

  const play = useCallback(() => {
    if (!audioBuffer || !audioCtxRef.current) return
    if (audioCtxRef.current.state === 'suspended') audioCtxRef.current.resume()
    const src = audioCtxRef.current.createBufferSource()
    src.buffer = audioBuffer
    if (!gainRef.current) {
      gainRef.current = audioCtxRef.current.createGain()
      gainRef.current.connect(audioCtxRef.current.destination)
    }
    src.connect(gainRef.current)
    src.onended = () => {
      if (playing) {
        setPlaying(false)
      }
    }
    startTimeRef.current = audioCtxRef.current.currentTime
    src.start(0, pauseOffsetRef.current)
    sourceRef.current = src
    setPlaying(true)
    rafRef.current = requestAnimationFrame(() => tickRef.current())
  }, [audioBuffer, playing, drawWaveform, duration])

  const pause = useCallback(() => {
    if (sourceRef.current) {
      try { sourceRef.current.stop() } catch { /* noop */ }
      sourceRef.current.disconnect()
      sourceRef.current = null
    }
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    pauseOffsetRef.current = currentTime
    setPlaying(false)
  }, [currentTime])

  const seek = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas || !duration) return
    const rect = canvas.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const t = Math.max(0, Math.min(1, x)) * duration
    if (playing) {
      pause()
      pauseOffsetRef.current = t
      setCurrentTime(t)
      drawWaveform(t / duration)
      play()
    } else {
      pauseOffsetRef.current = t
      setCurrentTime(t)
      drawWaveform(t / duration)
    }
  }, [duration, playing, pause, play, drawWaveform])

  // Cleanup
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      if (sourceRef.current) { try { sourceRef.current.stop() } catch { /* noop */ } }
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close().catch(() => {})
      }
    }
  }, [])

  const fmtTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    const ms = Math.floor((s % 1) * 10)
    return `${m}:${sec.toString().padStart(2, '0')}.${ms}`
  }

  const addComment = () => {
    if (!commentDraft.trim() || !onAddComment) return
    onAddComment(currentTime, commentDraft)
    setCommentDraft('')
    setShowDraft(false)
  }

  return (
    <div className="rounded-xl border border-border/60 bg-card/40 p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <AudioWaveform className="w-4 h-4 text-[oklch(0.82_0.29_145)] shrink-0" />
          <p className="text-sm font-medium truncate">{fileName ?? 'Player de revisão'}</p>
        </div>
        {duration > 0 && (
          <Badge variant="outline" className="text-[10px] font-mono shrink-0">
            <Clock className="w-3 h-3 mr-1" />{fmtTime(duration)}
          </Badge>
        )}
      </div>

      {!audioBuffer ? (
        <label className="flex flex-col items-center justify-center gap-2 py-8 border-2 border-dashed border-border/60 rounded-lg cursor-pointer hover:border-[oklch(0.82_0.29_145/0.5)] hover:bg-[oklch(0.82_0.29_145/0.04)] transition-all">
          <Upload className="w-6 h-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Selecione um arquivo de áudio (WAV/MP3/FLAC)</p>
          <p className="text-[11px] text-muted-foreground">Decodificado localmente via Web Audio API — nenhum upload para servidor</p>
          <input
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
          />
        </label>
      ) : (
        <>
          {/* Waveform canvas */}
          <div className="relative">
            <canvas
              ref={canvasRef}
              onClick={seek}
              className="w-full h-28 rounded-lg bg-background/60 cursor-pointer border border-border/40"
            />
            {/* Comment tooltips overlay */}
            <div className="absolute inset-x-0 bottom-1 flex pointer-events-none">
              {comments.map((c) => (
                <div
                  key={c.id}
                  className="absolute -translate-x-1/2"
                  style={{ left: `${(c.timestamp / duration) * 100}%` }}
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_oklch(0.75_0.18_75)]" />
                </div>
              ))}
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3">
            <Button
              size="icon"
              className="h-9 w-9 rounded-full bg-[oklch(0.82_0.29_145)] text-background hover:bg-[oklch(0.75_0.28_145)] neon-glow shrink-0"
              onClick={playing ? pause : play}
            >
              {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
            </Button>
            <div className="font-mono text-sm tabular-nums">
              <span className="text-[oklch(0.85_0.32_145)]">{fmtTime(currentTime)}</span>
              <span className="text-muted-foreground"> / {fmtTime(duration)}</span>
            </div>
            <div className="flex-1" />
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 h-8 text-xs"
              onClick={() => setShowDraft((v) => !v)}
            >
              <MessageSquarePlus className="w-3.5 h-3.5" /> Comentar @ {fmtTime(currentTime)}
            </Button>
          </div>

          {/* Comment draft */}
          {showDraft && (
            <div className="flex gap-2 animate-in fade-in slide-in-from-bottom-1 duration-200">
              <input
                value={commentDraft}
                onChange={(e) => setCommentDraft(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addComment()}
                placeholder={`Comentário em ${fmtTime(currentTime)}…`}
                className="flex-1 h-8 rounded-md border border-border/60 bg-background/60 px-3 text-sm outline-none focus:border-[oklch(0.82_0.29_145/0.5)]"
                autoFocus
              />
              <Button size="sm" className="h-8 bg-[oklch(0.82_0.29_145)] text-background" onClick={addComment}>Enviar</Button>
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setShowDraft(false)}><X className="w-3.5 h-3.5" /></Button>
            </div>
          )}

          {/* Comment list */}
          {comments.length > 0 && (
            <div className="space-y-1.5 pt-2 border-t border-border/40">
              <p className="text-xs font-semibold flex items-center gap-1.5">
                <MessageSquarePlus className="w-3.5 h-3.5 text-[oklch(0.82_0.29_145)]" />
                Comentários com timestamp ({comments.length})
              </p>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {comments
                  .slice()
                  .sort((a, b) => a.timestamp - b.timestamp)
                  .map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        pauseOffsetRef.current = c.timestamp
                        setCurrentTime(c.timestamp)
                        drawWaveform(c.timestamp / duration)
                      }}
                      className="w-full flex items-start gap-2 rounded bg-background/40 p-2 hover:bg-background/70 transition-colors text-left"
                    >
                      <Badge variant="outline" className="text-[9px] font-mono py-0 px-1 shrink-0 text-[oklch(0.85_0.32_145)]">
                        {fmtTime(c.timestamp)}
                      </Badge>
                      <span className="text-xs flex-1">{c.body}</span>
                    </button>
                  ))}
              </div>
            </div>
          )}
        </>
      )}

      {error && (
        <Alert className="border-rose-500/30 bg-rose-500/5">
          <AlertDescription className="text-rose-200 text-xs">{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
