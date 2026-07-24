import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import { hashStr, mulberry32, type DandelionSpec } from '@/lib/dandelion'

export interface LetterDandelionHandle {
  gust: () => void
}

interface Seed {
  angle: number
  lenK: number
  char: string
  size: number
  rot: number
  alpha: number
  phase: number
  attached: boolean
  x: number
  y: number
  vx: number
  vy: number
  spin: number
  spinV: number
  opacity: number
  fadeAt: number
}

interface Props {
  spec: DandelionSpec
  /** 分布在种子顶端的字符（标签拆成的字母） */
  chars: string[]
  onAllBlown?: () => void
  className?: string
}

/** 字做的蒲公英：每根茎的顶端有一个字母（参考「文字蒲公英」） */
const LetterDandelion = forwardRef<LetterDandelionHandle, Props>(function LetterDandelion(
  { spec, chars, onAllBlown, className = '' },
  ref,
) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const seedsRef = useRef<Seed[]>([])
  const decoRef = useRef<Seed[]>([])
  const geomRef = useRef({ hx: 0, hy: 0, R: 100 })
  const blownRef = useRef(false)
  const onAllBlownRef = useRef(onAllBlown)
  onAllBlownRef.current = onAllBlown

  useImperativeHandle(ref, () => ({
    gust: () => {
      let waves = 0
      const iv = window.setInterval(() => {
        releaseSeeds(Math.max(6, Math.round(spec.seedCount / 11)), {
          x: 2.4 + Math.random() * 1.2,
          y: -1.3 - Math.random() * 0.8,
        })
        waves += 1
        const left = seedsRef.current.filter((s) => s.attached).length
        if (waves >= 12 || left === 0) window.clearInterval(iv)
      }, 105)
    },
  }))

  function releaseSeeds(count: number, vel: { x: number; y: number }) {
    const seeds = seedsRef.current
    const attached = seeds.filter((s) => s.attached)
    const { hx, hy, R } = geomRef.current
    const n = Math.min(count, attached.length)
    for (let i = 0; i < n; i++) {
      const idx = Math.floor(Math.random() * attached.length)
      const s = attached.splice(idx, 1)[0]
      s.attached = false
      s.x = hx + Math.cos(s.angle) * s.lenK * R
      s.y = hy + Math.sin(s.angle) * s.lenK * R
      s.vx = vel.x * (0.5 + Math.random() * 0.7) + (Math.random() - 0.5) * 0.7
      s.vy = vel.y * (0.5 + Math.random() * 0.7) - Math.random() * 0.8
      s.spin = (Math.random() - 0.5) * 0.6
      s.spinV = (Math.random() - 0.5) * 0.05
      s.fadeAt = performance.now() + 1600 + Math.random() * 1300
    }
    const rest = seeds.filter((s) => s.attached)
    if (rest.length > 0 && rest.length <= 8) {
      releaseSeeds(rest.length, { x: vel.x * 0.6 + 0.8, y: vel.y * 0.6 - 0.5 })
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf = 0
    let w = 0
    let h = 0
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    const resize = () => {
      const r = canvas.getBoundingClientRect()
      w = r.width
      h = r.height
      canvas.width = Math.max(1, w * dpr)
      canvas.height = Math.max(1, h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    const rng = mulberry32(hashStr(`puff-${spec.id}-${spec.seedCount}`))
    const pool = chars.length > 0 ? chars : ['P', 'U', 'F', 'F']
    // 打乱字符池，循环分配到每颗种子
    const bag: string[] = []
    while (bag.length < spec.seedCount) {
      const copy = [...pool]
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1))
        ;[copy[i], copy[j]] = [copy[j], copy[i]]
      }
      bag.push(...copy)
    }

    const seeds: Seed[] = []
    for (let i = 0; i < spec.seedCount; i++) {
      // 分布偏向边缘：大多数顶到外圈成圆，少数短的填满内部
      const lenK = 0.52 + 0.48 * Math.pow(rng(), 0.55) * (1 - spec.asymK / 3 + rng() * (spec.asymK / 1.5))
      seeds.push({
        angle: i * 2.39996 + (rng() - 0.5) * 0.24,
        lenK,
        char: bag[i],
        size: (11 + rng() * 3.5) * (0.88 + lenK * 0.18),
        rot: (rng() - 0.5) * 0.24,
        alpha: 0.78 + rng() * 0.22,
        phase: rng() * Math.PI * 2,
        attached: true,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        spin: 0,
        spinV: 0,
        opacity: 1,
        fadeAt: 0,
      })
    }
    seedsRef.current = seeds
    decoRef.current = []
    blownRef.current = false

    const drawChar = (s: Seed, alpha: number) => {
      ctx.save()
      ctx.translate(s.x, s.y)
      ctx.rotate(s.attached ? s.rot : s.spin)
      ctx.font = `500 ${s.size}px 'Helvetica Neue', Helvetica, Arial, sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = `rgba(18,18,18,${alpha})`
      ctx.fillText(s.char, 0, 0)
      ctx.restore()
    }

    const updateFlying = (s: Seed, t: number, now: number): boolean => {
      s.vx = s.vx * 0.986 + 0.012
      s.vy = s.vy * 0.986 - 0.01
      s.x += s.vx + Math.sin(t * 2.2 + s.phase) * 0.45
      s.y += s.vy + Math.cos(t * 1.7 + s.phase) * 0.2
      s.spin += s.spinV
      if (now > s.fadeAt) s.opacity -= 0.02
      if (s.opacity <= 0 || s.x > w + 60 || s.x < -60 || s.y < -60 || s.y > h + 60) return false
      drawChar(s, Math.max(0, Math.min(1, s.opacity)) * s.alpha)
      return true
    }

    const t0 = performance.now()
    let lastEscape = t0

    const frame = (now: number) => {
      const t = (now - t0) / 1000
      ctx.clearRect(0, 0, w, h)

      const cx = w / 2
      const cy = h * 0.42
      const R = Math.min(w, h) * 0.31 * spec.radiusK

      const sway = Math.sin(t * 0.7)
      const tilt = (spec.tiltDeg * Math.PI) / 180
      const hx = cx + sway * R * 0.14 + Math.sin(tilt) * R * 0.18
      const hy = cy + Math.cos(t * 0.9) * 2
      geomRef.current = { hx, hy, R }

      // 花茎
      ctx.strokeStyle = 'rgba(150,158,140,0.9)'
      ctx.lineWidth = 2
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(cx, h + 12)
      ctx.quadraticCurveTo(cx + sway * 10 + Math.sin(tilt) * 18, (cy + h) / 2, hx, hy + 5)
      ctx.stroke()

      const all = seedsRef.current

      // 花心小点
      ctx.fillStyle = 'rgba(120,110,88,0.9)'
      ctx.beginPath()
      ctx.arc(hx, hy, Math.max(3, R * 0.028), 0, Math.PI * 2)
      ctx.fill()

      // 附着的种子：细茎 + 顶端字母
      for (const s of all) {
        if (!s.attached) continue
        const flutter = Math.sin(t * 1.6 + s.phase) * 0.013
        const a = s.angle + flutter + tilt * 0.3
        const len = s.lenK * R
        const bx = hx + Math.cos(a) * R * 0.04
        const by = hy + Math.sin(a) * R * 0.04
        s.x = hx + Math.cos(a) * len
        s.y = hy + Math.sin(a) * len

        // 细茎（微弯）
        ctx.strokeStyle = `rgba(60,60,60,${0.22 + 0.1 * s.alpha})`
        ctx.lineWidth = 0.9
        ctx.beginPath()
        ctx.moveTo(bx, by)
        const bowx = Math.cos(a + Math.PI / 2) * Math.sin(s.phase) * len * 0.05
        const bowy = Math.sin(a + Math.PI / 2) * Math.sin(s.phase) * len * 0.05
        ctx.quadraticCurveTo((bx + s.x) / 2 + bowx, (by + s.y) / 2 + bowy, s.x, s.y)
        ctx.stroke()

        drawChar(s, s.alpha)
      }

      // 飞走的字母
      for (let i = all.length - 1; i >= 0; i--) {
        const s = all[i]
        if (s.attached) continue
        if (!updateFlying(s, t, now)) all.splice(i, 1)
      }

      // 偶尔先逃走一个字母
      if (now - lastEscape > 4600 && all.some((s) => s.attached)) {
        lastEscape = now
        const a = Math.random() * Math.PI * 2
        decoRef.current.push({
          angle: a,
          lenK: 0.9,
          char: pool[Math.floor(Math.random() * pool.length)],
          size: 12,
          rot: 0,
          alpha: 0.85,
          phase: Math.random() * Math.PI * 2,
          attached: false,
          x: hx + Math.cos(a) * R,
          y: hy + Math.sin(a) * R,
          vx: 0.4 + Math.random() * 0.6,
          vy: -0.7 - Math.random() * 0.5,
          spin: (Math.random() - 0.5) * 0.4,
          spinV: (Math.random() - 0.5) * 0.04,
          opacity: 0.9,
          fadeAt: now + 1900,
        })
      }
      const deco = decoRef.current
      for (let i = deco.length - 1; i >= 0; i--) {
        if (!updateFlying(deco[i], t, now)) deco.splice(i, 1)
      }

      if (!blownRef.current && all.length === 0) {
        blownRef.current = true
        onAllBlownRef.current?.()
      }

      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)

    let last = { x: 0, y: 0, t: 0, down: false }
    const onDown = (e: PointerEvent) => {
      last = { x: e.clientX, y: e.clientY, t: performance.now(), down: true }
      canvas.setPointerCapture?.(e.pointerId)
    }
    const onMove = (e: PointerEvent) => {
      if (!last.down) return
      const now = performance.now()
      const dx = e.clientX - last.x
      const dy = e.clientY - last.y
      const dt = Math.max(now - last.t, 1)
      const speed = Math.hypot(dx, dy) / dt
      if (speed > 0.3) {
        releaseSeeds(Math.min(16, Math.ceil(speed * 10)), { x: (dx / dt) * 13, y: (dy / dt) * 13 })
      }
      last = { x: e.clientX, y: e.clientY, t: now, down: true }
    }
    const onUp = () => {
      last.down = false
    }
    canvas.addEventListener('pointerdown', onDown)
    canvas.addEventListener('pointermove', onMove)
    canvas.addEventListener('pointerup', onUp)
    canvas.addEventListener('pointercancel', onUp)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      canvas.removeEventListener('pointerdown', onDown)
      canvas.removeEventListener('pointermove', onMove)
      canvas.removeEventListener('pointerup', onUp)
      canvas.removeEventListener('pointercancel', onUp)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spec, chars])

  return (
    <canvas
      ref={canvasRef}
      className={`h-full w-full cursor-grab active:cursor-grabbing ${className}`}
      style={{ touchAction: 'none' }}
    />
  )
})

export default LetterDandelion
