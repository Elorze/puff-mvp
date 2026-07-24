import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { PlayIcon } from '@/components/Icons'
import { useLanguage } from '@/i18n'

interface Props {
  duration: number
  src?: string
  compact?: boolean
  light?: boolean
  accent?: 'blue' | 'orange'
}

const BARS = [0.34, 0.62, 0.44, 0.82, 0.52, 0.72, 0.38, 0.9, 0.58, 0.42, 0.76, 0.5, 0.86, 0.36, 0.68, 0.48, 0.8, 0.56, 0.7, 0.4, 0.88, 0.52]

export default function VoiceNote({ duration, src, compact = false, light = false, accent = 'blue' }: Props) {
  const { language } = useLanguage()
  const [playing, setPlaying] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const elapsedRef = useRef(0)
  const startedAt = useRef(0)
  const startElapsed = useRef(0)
  const raf = useRef(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [mediaDuration, setMediaDuration] = useState(duration)

  useEffect(() => {
    if (!playing || src) return
    startedAt.current = performance.now()
    startElapsed.current = elapsedRef.current

    const tick = (now: number) => {
      const next = startElapsed.current + (now - startedAt.current) / 1000
      if (next >= duration) {
        elapsedRef.current = 0
        setElapsed(0)
        setPlaying(false)
        return
      }
      elapsedRef.current = next
      setElapsed(next)
      raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [duration, playing, src])

  useEffect(() => {
    setPlaying(false)
    setElapsed(0)
    elapsedRef.current = 0
    setMediaDuration(duration)
    const audio = audioRef.current
    if (audio) {
      audio.pause()
      audio.currentTime = 0
    }
  }, [duration, src])

  const progress = mediaDuration > 0 ? elapsed / mediaDuration : 0
  const remaining = Math.max(0, Math.ceil(mediaDuration - elapsed))

  const togglePlayback = () => {
    const audio = audioRef.current
    if (!src || !audio) {
      setPlaying((value) => !value)
      return
    }
    if (audio.paused) {
      void audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false))
    } else {
      audio.pause()
      setPlaying(false)
    }
  }

  return (
    <button
      type="button"
      onClick={togglePlayback}
      className={`flex w-full items-center gap-3 rounded-full border transition active:scale-[0.99] ${
        compact ? 'px-3 py-2.5' : 'px-4 py-3.5'
      } ${
        light
          ? 'border-white/45 bg-white/15 text-white'
          : 'border-border/25 bg-white/45 text-foreground'
      }`}
      aria-label={playing ? (language === 'zh' ? '暂停语音' : 'Pause voice note') : (language === 'zh' ? '播放语音' : 'Play voice note')}
    >
      {src && (
        <audio
          ref={audioRef}
          src={src}
          preload="metadata"
          onLoadedMetadata={(event) => {
            if (Number.isFinite(event.currentTarget.duration)) setMediaDuration(event.currentTarget.duration)
          }}
          onTimeUpdate={(event) => {
            const next = event.currentTarget.currentTime
            elapsedRef.current = next
            setElapsed(next)
          }}
          onPause={() => setPlaying(false)}
          onPlay={() => setPlaying(true)}
          onEnded={() => {
            const audio = audioRef.current
            if (audio) audio.currentTime = 0
            elapsedRef.current = 0
            setElapsed(0)
            setPlaying(false)
          }}
        />
      )}
      <span className={`flex shrink-0 items-center justify-center rounded-full ${compact ? 'h-8 w-8' : 'h-10 w-10'} ${
        light ? (accent === 'orange' ? 'bg-white/82 text-[#9c5145] shadow-[inset_0_1px_0_rgba(255,255,255,.72),0_8px_22px_rgba(77,29,35,.16)]' : 'bg-white text-sky-600') : 'bg-foreground text-background'
      }`}>
        {playing ? (
          <span className="flex gap-1">
            <span className="h-3 w-0.5 rounded-full bg-current" />
            <span className="h-3 w-0.5 rounded-full bg-current" />
          </span>
        ) : (
          <PlayIcon className={`${compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} ml-0.5`} />
        )}
      </span>

      <span className={`flex min-w-0 flex-1 items-center ${compact ? 'gap-[2px]' : 'gap-[3px]'}`} aria-hidden>
        {BARS.map((height, index) => {
          const active = index / BARS.length <= progress
          return (
            <motion.span
              key={index}
              animate={playing && active ? { scaleY: [0.7, 1.15, 0.82] } : { scaleY: 1 }}
              transition={{ duration: 0.7, repeat: playing && active ? Infinity : 0, delay: index * 0.025 }}
              className={`w-0.5 rounded-full ${light ? (active ? 'bg-white' : 'bg-white/35') : (active ? 'bg-sky-500' : 'bg-foreground/25')}`}
              style={{ height: `${Math.round((compact ? 17 : 23) * height)}px` }}
            />
          )
        })}
      </span>

      <span className={`font-mono2 shrink-0 tabular-nums ${compact ? 'text-[9px]' : 'text-[10px]'} ${light ? 'text-white/70' : 'text-foreground/50'}`}>
        {remaining}s
      </span>
    </button>
  )
}
