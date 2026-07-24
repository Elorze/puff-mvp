import { useCallback, useEffect, useRef, useState } from 'react'

export type MicrophoneStatus = 'idle' | 'requesting' | 'active' | 'denied' | 'unsupported'

interface Options {
  onLevel?: (level: number) => void
}

/**
 * Reads a normalized 0–1 microphone level.
 * Auto gain/noise suppression are disabled because breath intensity is the signal.
 */
export function useMicrophoneLevel({ onLevel }: Options = {}) {
  const [status, setStatus] = useState<MicrophoneStatus>('idle')
  const [level, setLevel] = useState(0)
  const streamRef = useRef<MediaStream | null>(null)
  const contextRef = useRef<AudioContext | null>(null)
  const frameRef = useRef(0)
  const smoothedRef = useRef(0)
  const onLevelRef = useRef(onLevel)
  onLevelRef.current = onLevel

  const stop = useCallback(() => {
    cancelAnimationFrame(frameRef.current)
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    void contextRef.current?.close()
    contextRef.current = null
    smoothedRef.current = 0
    setLevel(0)
    setStatus('idle')
  }, [])

  const start = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia || typeof AudioContext === 'undefined') {
      setStatus('unsupported')
      return false
    }

    setStatus('requesting')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          autoGainControl: false,
          echoCancellation: false,
          noiseSuppression: false,
        },
      })
      const context = new AudioContext()
      await context.resume()
      const source = context.createMediaStreamSource(stream)
      const analyser = context.createAnalyser()
      analyser.fftSize = 1024
      analyser.smoothingTimeConstant = 0.62
      source.connect(analyser)

      streamRef.current = stream
      contextRef.current = context
      setStatus('active')

      const samples = new Uint8Array(analyser.fftSize)
      const read = () => {
        analyser.getByteTimeDomainData(samples)
        let energy = 0
        for (let index = 0; index < samples.length; index += 1) {
          const value = (samples[index] - 128) / 128
          energy += value * value
        }
        const rms = Math.sqrt(energy / samples.length)
        // Ambient room noise stays near 0; normal breath maps into the usable range.
        const normalized = Math.max(0, Math.min(1, (rms - 0.018) / 0.16))
        const smoothed = smoothedRef.current * 0.72 + normalized * 0.28
        smoothedRef.current = smoothed
        setLevel(smoothed)
        onLevelRef.current?.(smoothed)
        frameRef.current = requestAnimationFrame(read)
      }
      read()
      return true
    } catch {
      streamRef.current?.getTracks().forEach((track) => track.stop())
      streamRef.current = null
      void contextRef.current?.close()
      contextRef.current = null
      setLevel(0)
      setStatus('denied')
      return false
    }
  }, [])

  useEffect(() => {
    return () => {
      cancelAnimationFrame(frameRef.current)
      streamRef.current?.getTracks().forEach((track) => track.stop())
      void contextRef.current?.close()
    }
  }, [])

  return { level, start, status, stop }
}
