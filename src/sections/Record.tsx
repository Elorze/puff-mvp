import { useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { RotateCcw } from 'lucide-react'
import { useLanguage } from '@/i18n'
import type { RecordedVoice } from '@/types'

interface Props {
  onDone: (voice: RecordedVoice | null) => void
  renewal?: boolean
}

type RecordingState = 'idle' | 'requesting' | 'recording' | 'done' | 'error'

const DURATION = 15
const RING_RADIUS = 108
const RING_LENGTH = 2 * Math.PI * RING_RADIUS

function preferredMimeType() {
  if (typeof MediaRecorder === 'undefined') return ''
  return ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'].find((type) => MediaRecorder.isTypeSupported(type)) ?? ''
}

export default function Record({ onDone, renewal = false }: Props) {
  const { language } = useLanguage()
  const zh = language === 'zh'
  const [state, setState] = useState<RecordingState>('idle')
  const [elapsed, setElapsed] = useState(0)
  const [level, setLevel] = useState(0)
  const [audioUrl, setAudioUrl] = useState('')
  const [recordedVoice, setRecordedVoice] = useState<RecordedVoice | null>(null)
  const [pressing, setPressing] = useState(false)
  const [error, setError] = useState('')
  const startRef = useRef(0)
  const timerFrameRef = useRef(0)
  const meterFrameRef = useRef(0)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const pressingRef = useRef(false)
  const elapsedRef = useRef(0)

  const cleanupCapture = useCallback(() => {
    cancelAnimationFrame(meterFrameRef.current)
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    void audioContextRef.current?.close()
    audioContextRef.current = null
    setLevel(0)
  }, [])

  const stopRecording = useCallback(() => {
    cancelAnimationFrame(timerFrameRef.current)
    pressingRef.current = false
    setPressing(false)
    const recorder = recorderRef.current
    if (recorder && recorder.state !== 'inactive') recorder.stop()
    cleanupCapture()
  }, [cleanupCapture])

  const beginMeter = useCallback((stream: MediaStream) => {
    const context = new AudioContext()
    const source = context.createMediaStreamSource(stream)
    const analyser = context.createAnalyser()
    analyser.fftSize = 512
    analyser.smoothingTimeConstant = 0.7
    source.connect(analyser)
    audioContextRef.current = context
    const samples = new Uint8Array(analyser.fftSize)

    const read = () => {
      analyser.getByteTimeDomainData(samples)
      let energy = 0
      for (let index = 0; index < samples.length; index += 1) {
        const value = (samples[index] - 128) / 128
        energy += value * value
      }
      const rms = Math.sqrt(energy / samples.length)
      setLevel(Math.max(0.025, Math.min(1, (rms - 0.012) / 0.16)))
      meterFrameRef.current = requestAnimationFrame(read)
    }
    read()
  }, [])

  const start = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      pressingRef.current = false
      setPressing(false)
      setError(zh ? '当前浏览器不支持麦克风录音。' : 'Microphone recording is not supported in this browser.')
      setState('error')
      return
    }

    setState('requesting')
    setError('')
    if (audioUrl) URL.revokeObjectURL(audioUrl)
    setAudioUrl('')
    setRecordedVoice(null)
    setElapsed(0)
    elapsedRef.current = 0

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          autoGainControl: true,
          echoCancellation: true,
          noiseSuppression: true,
        },
      })
      const mimeType = preferredMimeType()
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream)
      streamRef.current = stream
      recorderRef.current = recorder
      chunksRef.current = []

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data)
      }
      recorder.onstop = () => {
        const finalMimeType = recorder.mimeType || mimeType || 'audio/webm'
        const blob = new Blob(chunksRef.current, { type: finalMimeType })
        if (blob.size > 0) {
          setAudioUrl(URL.createObjectURL(blob))
          setRecordedVoice({
            blob,
            duration: Math.max(1, Math.round(elapsedRef.current || (performance.now() - startRef.current) / 1000)),
            mimeType: finalMimeType,
          })
        }
        setState('done')
        recorderRef.current = null
      }

      recorder.start(180)
      beginMeter(stream)
      setState('recording')
      startRef.current = performance.now()

      if (!pressingRef.current) {
        recorder.stop()
        cleanupCapture()
        return
      }

      const tick = (now: number) => {
        const nextElapsed = Math.min(DURATION, (now - startRef.current) / 1000)
        elapsedRef.current = nextElapsed
        setElapsed(nextElapsed)
        if (nextElapsed >= DURATION) {
          stopRecording()
          return
        }
        timerFrameRef.current = requestAnimationFrame(tick)
      }
      timerFrameRef.current = requestAnimationFrame(tick)
    } catch {
      cleanupCapture()
      pressingRef.current = false
      setPressing(false)
      setError(zh ? '无法使用麦克风。请允许权限后重试。' : 'Microphone access was blocked. Allow it and try again.')
      setState('error')
    }
  }, [audioUrl, beginMeter, cleanupCapture, stopRecording, zh])

  const reset = useCallback(() => {
    if (audioUrl) URL.revokeObjectURL(audioUrl)
    setAudioUrl('')
    setRecordedVoice(null)
    setElapsed(0)
    elapsedRef.current = 0
    setError('')
    setState('idle')
  }, [audioUrl])

  useEffect(() => {
    return () => {
      cancelAnimationFrame(timerFrameRef.current)
      cancelAnimationFrame(meterFrameRef.current)
      streamRef.current?.getTracks().forEach((track) => track.stop())
      void audioContextRef.current?.close()
    }
  }, [])

  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl)
    }
  }, [audioUrl])

  const progress = state === 'done' ? 1 : elapsed / DURATION
  const seconds = Math.floor(elapsed)
  const orbActive = state === 'requesting' || state === 'recording'
  const durationText = `0:${String(seconds).padStart(2, '0')}`
  const statusText = state === 'recording'
    ? (zh ? '松开结束录音' : 'Release to finish')
    : state === 'requesting'
      ? (zh ? '正在连接麦克风' : 'Connecting microphone')
      : state === 'done'
        ? (zh ? '录音已完成' : 'Recording complete')
        : state === 'error'
          ? (zh ? '麦克风未连接' : 'Microphone unavailable')
          : (zh ? '按住圆体录音' : 'Press and hold to record')

  const endPress = () => {
    pressingRef.current = false
    setPressing(false)
    if (state === 'recording') stopRecording()
  }

  return (
    <motion.div
      className="relative flex h-full flex-col overflow-hidden bg-[#07121e] px-6 pb-8 pt-[66px] text-white"
      initial={renewal ? { opacity: 0 } : false}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.42 }}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <motion.div
          className="absolute -left-28 -top-24 h-[360px] w-[390px] rounded-[44%_56%_62%_38%/55%_42%_58%_45%] bg-[radial-gradient(circle_at_60%_58%,rgba(55,222,212,.42),rgba(28,87,170,.3)_48%,transparent_76%)] blur-[34px]"
          animate={{ x: [0, 86, 20, 0], y: [0, 48, 112, 0], rotate: [0, 120, 242, 360] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -bottom-24 -right-28 h-[360px] w-[390px] rounded-[62%_38%_44%_56%/42%_61%_39%_58%] bg-[radial-gradient(circle_at_38%_44%,rgba(132,96,255,.36),rgba(35,90,165,.24)_52%,transparent_78%)] blur-[38px]"
          animate={{ x: [0, -92, -22, 0], y: [0, -82, -144, 0], rotate: [0, -126, -258, -360] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,transparent_0%,rgba(4,10,20,.2)_58%,rgba(3,8,15,.82)_100%)]" />
      </div>

      <motion.header
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 text-center"
      >
        <h2 className="text-[25px] font-semibold leading-[1.25]">
          {renewal
            ? (zh ? <>再留下一段声音。<br />让它重新认识你。</> : <>Give this dandelion<br />a voice for today.</>)
            : (zh ? <>留下一段声音。<br />让它替你去往远方。</> : <>Leave a voice.<br />Let it travel farther than you can.</>)}
        </h2>
      </motion.header>

      <div className="relative z-10 flex min-h-0 flex-1 flex-col items-center justify-center">
        <motion.div
          className="relative h-[220px] w-[220px]"
          initial={renewal ? { scale: 0.12, opacity: 0.35, filter: 'blur(12px)' } : false}
          animate={{
            scale: pressing ? 1.045 + level * 0.03 : 1,
            opacity: 1,
            filter: `drop-shadow(0 22px ${34 + level * 22}px rgba(38,214,197,${0.2 + level * 0.18}))`,
          }}
          transition={renewal
            ? { duration: 0.72, ease: [0.16, 1, 0.3, 1] }
            : { type: 'spring', stiffness: 310, damping: 23, mass: 0.55 }}
        >
          <svg className="pointer-events-none absolute -inset-[7px] h-[234px] w-[234px] -rotate-90" viewBox="0 0 234 234">
            <circle cx="117" cy="117" r={RING_RADIUS} fill="none" stroke="rgba(255,255,255,.1)" strokeWidth="1.2" />
            <circle
              cx="117"
              cy="117"
              r={RING_RADIUS}
              fill="none"
              stroke="rgba(180,255,242,.88)"
              strokeWidth={state === 'recording' ? 2.2 + level * 2.4 : 1.4}
              strokeLinecap="round"
              strokeDasharray={`${Math.max(0.012, progress) * RING_LENGTH} ${RING_LENGTH}`}
              style={{
                filter: `drop-shadow(0 0 ${7 + level * 13}px rgba(109,255,225,.72))`,
                transition: 'stroke-dasharray .12s linear',
              }}
            />
          </svg>

          <button
            type="button"
            onPointerDown={(event) => {
              if (state !== 'idle' && state !== 'error') return
              event.currentTarget.setPointerCapture(event.pointerId)
              pressingRef.current = true
              setPressing(true)
              void start()
            }}
            onPointerUp={endPress}
            onPointerCancel={endPress}
            onLostPointerCapture={() => {
              if (pressingRef.current) endPress()
            }}
            onContextMenu={(event) => event.preventDefault()}
            disabled={state === 'done'}
            className="liquid-orb relative h-full w-full touch-none select-none overflow-hidden rounded-full text-white disabled:cursor-default"
            aria-label={statusText}
          >
            <motion.div
              className="absolute -left-[25%] -top-[20%] h-[86%] w-[92%] rounded-[43%_57%_62%_38%/54%_41%_59%_46%] bg-[radial-gradient(circle_at_55%_52%,#6ff1d0_0%,#168ac4_43%,transparent_74%)] blur-[12px]"
              animate={{ x: [0, 76, 28, 0], y: [0, 48, 108, 0], rotate: [0, 124, 246, 360], scale: [1, 1.18, .9, 1] }}
              transition={{ duration: orbActive ? 5.4 : 8.4, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute -right-[30%] top-[4%] h-[88%] w-[94%] rounded-[62%_38%_44%_56%/42%_62%_38%_58%] bg-[radial-gradient(circle_at_38%_50%,#9b78ff_0%,#315ac8_44%,transparent_76%)] opacity-95 blur-[13px]"
              animate={{ x: [0, -86, -22, 0], y: [0, 70, 138, 0], rotate: [0, -138, -264, -360], scale: [.94, 1.2, .88, .94] }}
              transition={{ duration: orbActive ? 6.1 : 9.2, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute -bottom-[34%] left-[5%] h-[88%] w-[96%] rounded-[40%_60%_56%_44%/62%_42%_58%_38%] bg-[radial-gradient(circle_at_52%_34%,#ffbc73_0%,#e764a2_40%,transparent_73%)] opacity-80 blur-[14px]"
              animate={{ x: [0, 56, -18, 0], y: [0, -74, -132, 0], rotate: [0, 112, 232, 360], scale: [1.08, .9, 1.18, 1.08] }}
              transition={{ duration: orbActive ? 5.8 : 8.8, repeat: Infinity, ease: 'easeInOut' }}
            />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_32%_20%,rgba(255,255,255,.38),transparent_28%),radial-gradient(circle_at_50%_58%,transparent_34%,rgba(3,12,24,.28)_100%)]" />

            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[18px] font-medium tabular-nums text-white/88 drop-shadow-[0_2px_10px_rgba(0,0,0,.22)]">
                {durationText}
              </span>
            </div>
          </button>
        </motion.div>

        <div className="glass-pill beam-control mt-7 flex min-h-11 items-center justify-center rounded-full px-6 text-[12px] text-white/84">
          {orbActive && <span className="mr-2 h-2 w-2 animate-pulse rounded-full bg-[#8affdc] shadow-[0_0_12px_rgba(138,255,220,.8)]" />}
          {statusText}
        </div>
      </div>

      <div className="relative z-10 min-h-[86px]">
        {state === 'error' && (
          <div className="liquid-panel px-4 py-3 text-center text-[11px] leading-relaxed text-white/72">
            <p>{error}</p>
            <button
              type="button"
              onClick={() => {
                setElapsed(8)
                elapsedRef.current = 8
                setRecordedVoice(null)
                setState('done')
                setError('')
              }}
              className="mt-2 text-white underline decoration-white/35 underline-offset-4"
            >
              {zh ? '使用演示录音继续' : 'Continue with a demo recording'}
            </button>
          </div>
        )}

        {state === 'done' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="mb-3 flex justify-center">
              <button type="button" onClick={reset} className="flex items-center gap-1.5 text-[11px] text-white/58">
                <RotateCcw className="h-3.5 w-3.5" />
                {zh ? '重新录制' : 'Record again'}
              </button>
            </div>
            <button
              type="button"
              onClick={() => onDone(recordedVoice)}
              className="beam-control glass-pill w-full rounded-[22px] py-4 text-[13px] font-semibold text-white active:scale-[0.985]"
            >
              {zh ? '让声音长成蒲公英' : 'Grow the voice into a dandelion'}
            </button>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}
