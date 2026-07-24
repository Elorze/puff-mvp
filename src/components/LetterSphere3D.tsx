import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import * as THREE from 'three'
import { hashStr, mulberry32, type DandelionSpec } from '@/lib/dandelion'

export interface LetterSphereHandle {
  gust: () => void
  blow: (strength: number) => void
}

interface SeedP {
  dir: THREE.Vector3
  joint: THREE.Vector3 // 分叉点（headGroup 空间）
  branchTips: { dir: THREE.Vector3; tip: THREE.Vector3 }[]
  sprites: THREE.Sprite[]
  segStart: number // 共享茎网格里的段起点（顶点索引）
  segCount: number
  baseScale: number
  alpha: number
  attached: boolean
}

interface FlyP {
  group: THREE.Group
  vel: THREE.Vector3
  tumble: THREE.Vector3
  tumbleV: number
  opacity: number
  fadeAt: number
}

interface Props {
  spec: DandelionSpec
  chars: string[]
  onAllBlown?: () => void
  onProgress?: (progress: number) => void
  onReady?: () => void
  className?: string
}

// Every instance uses the same animation clock. This keeps the bloom preview and
// the interactive dandelion in the same pose while one canvas crossfades to the other.
const MOTION_EPOCH = typeof performance === 'undefined' ? 0 : performance.now()

/** 字符纹理缓存（白字 + 微光晕） */
const texCache = new Map<string, THREE.CanvasTexture>()
function charTexture(ch: string): THREE.CanvasTexture {
  let t = texCache.get(ch)
  if (t) return t
  const c = document.createElement('canvas')
  c.width = 96
  c.height = 96
  const g = c.getContext('2d')!
  g.font = `500 52px 'Helvetica Neue', Helvetica, Arial, sans-serif`
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.shadowColor = 'rgba(255,255,255,0.55)'
  g.shadowBlur = 7
  g.fillStyle = '#ffffff'
  g.fillText(ch, 48, 52)
  t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  texCache.set(ch, t)
  return t
}

/** 字母三维球：字母填满整个球体，近亮远淡 */
const LetterSphere3D = forwardRef<LetterSphereHandle, Props>(function LetterSphere3D(
  { spec, chars, onAllBlown, onProgress, onReady, className = '' },
  ref,
) {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const seedsRef = useRef<SeedP[]>([])
  const flyRef = useRef<FlyP[]>([])
  const blownRef = useRef(false)
  const apiRef = useRef<{ release: (n: number, gx: number, gy: number) => void } | null>(null)
  const onAllBlownRef = useRef(onAllBlown)
  onAllBlownRef.current = onAllBlown
  const onReadyRef = useRef(onReady)
  onReadyRef.current = onReady
  const onProgressRef = useRef(onProgress)
  onProgressRef.current = onProgress

  useImperativeHandle(ref, () => ({
    blow: (strength: number) => {
      const power = Math.max(0, Math.min(1, strength))
      const count = Math.max(1, Math.round(1 + power * 11))
      apiRef.current?.release(count, 1.25 + power * 4.2, 0.35 + power * 1.55)
    },
    gust: () => {
      // Demo fallback: a complete gust when microphone access is unavailable.
      const iv = window.setInterval(() => {
        const left = seedsRef.current.filter((s) => s.attached).length
        if (left <= 0) {
          window.clearInterval(iv)
          return
        }
        const n = Math.max(8, Math.round(spec.seedCount / 10))
        apiRef.current?.release(n, 2.6 + Math.random(), 1.1 + Math.random() * 0.6)
      }, 115)
    },
  }))

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    let disposed = false

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.setClearColor(0x000000, 0)
    host.appendChild(renderer.domElement)
    renderer.domElement.style.touchAction = 'none'
    renderer.domElement.style.cursor = 'grab'

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(33, 1, 0.1, 50)
    camera.position.set(0, 0.15, 7.5)

    const R = 0.85 * spec.radiusK
    const HEAD_Y = 0.72

    const headGroup = new THREE.Group()
    headGroup.position.y = HEAD_Y
    headGroup.rotation.z = (spec.tiltDeg * Math.PI) / 360
    scene.add(headGroup)

    // 花茎
    const stemCurve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(0.03, -2.7, 0),
      new THREE.Vector3(-0.04, -0.9, 0.02),
      new THREE.Vector3(0, HEAD_Y + 0.02, 0),
    )
    const stem = new THREE.Mesh(
      new THREE.TubeGeometry(stemCurve, 24, 0.011, 6, false),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 }),
    )
    scene.add(stem)

    // 中心亮点
    const core = new THREE.Mesh(
      new THREE.SphereGeometry(R * 0.03, 16, 12),
      new THREE.MeshBasicMaterial({ color: 0xffffff }),
    )
    headGroup.add(core)

    // —— 生成种子：体积分布（外密内匀，轮廓保持正圆） ——
    const rng = mulberry32(hashStr(`puff-${spec.id}-${spec.seedCount}`))
    const pool = chars.length > 0 ? chars : ['P', 'U', 'F', 'F']
    const seeds: SeedP[] = []
    const N = spec.seedCount
    const ga = Math.PI * (3 - Math.sqrt(5))

    // 共享茎网格：一个 draw call 画所有的须
    const MAX_SEGS = N * 5
    const segPos = new Float32Array(MAX_SEGS * 6)
    const segCol = new Float32Array(MAX_SEGS * 6)
    const stalkGeo = new THREE.BufferGeometry()
    stalkGeo.setAttribute('position', new THREE.BufferAttribute(segPos, 3))
    stalkGeo.setAttribute('color', new THREE.BufferAttribute(segCol, 3))
    const stalks = new THREE.LineSegments(
      stalkGeo,
      new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.9 }),
    )
    headGroup.add(stalks)

    let segCursor = 0
    const putSeg = (a: THREE.Vector3, b: THREE.Vector3) => {
      const i = segCursor * 6
      segPos[i] = a.x; segPos[i + 1] = a.y; segPos[i + 2] = a.z
      segPos[i + 3] = b.x; segPos[i + 4] = b.y; segPos[i + 5] = b.z
      segCol[i] = 0.6; segCol[i + 1] = 0.6; segCol[i + 2] = 0.6
      segCol[i + 3] = 0.9; segCol[i + 4] = 0.9; segCol[i + 5] = 0.9
      segCursor++
    }

    for (let i = 0; i < N; i++) {
      const y = 1 - (2 * (i + 0.5)) / N
      const r = Math.sqrt(Math.max(0, 1 - y * y))
      const th = ga * i
      const dir = new THREE.Vector3(Math.cos(th) * r, y, Math.sin(th) * r)
      dir.x += (rng() - 0.5) * 0.1
      dir.y += (rng() - 0.5) * 0.1
      dir.z += (rng() - 0.5) * 0.1
      dir.normalize()

      // 外壳层种子几乎同长（钉在球面上），内层短种子只填密不碰轮廓
      const isShell = rng() < 0.7
      const len = isShell ? R * (0.97 + rng() * 0.05) : R * (0.38 + rng() * 0.42)
      const base = dir.clone().multiplyScalar(R * 0.05)
      const joint = dir.clone().multiplyScalar(len * 0.74)

      const seed: SeedP = {
        dir,
        joint,
        branchTips: [],
        sprites: [],
        segStart: segCursor,
        segCount: 0,
        baseScale: 0.125 + rng() * 0.03,
        alpha: 0.75 + rng() * 0.25,
        attached: true,
      }

      // 主须
      putSeg(base, joint)
      seed.segCount++

      // 垂直参考轴
      const ref = Math.abs(dir.y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0)
      const perp1 = new THREE.Vector3().crossVectors(dir, ref).normalize()
      const perp2 = new THREE.Vector3().crossVectors(dir, perp1).normalize()

      // 3–4 根分叉小须
      const nBranch = rng() > 0.45 ? 4 : 3
      for (let k = 0; k < nBranch; k++) {
        const az = (k / nBranch) * Math.PI * 2 + rng() * 0.7
        const tilt = k === 0 ? 0.05 + rng() * 0.1 : 0.22 + rng() * 0.3
        const bdir = dir
          .clone()
          .multiplyScalar(Math.cos(tilt))
          .addScaledVector(perp1, Math.sin(tilt) * Math.cos(az))
          .addScaledVector(perp2, Math.sin(tilt) * Math.sin(az))
          .normalize()
        const bLen = len * 0.26 * (0.85 + rng() * 0.3)
        const tip = joint.clone().addScaledVector(bdir, bLen)
        putSeg(joint, tip)
        seed.segCount++
        seed.branchTips.push({ dir: bdir, tip })

        const ch = pool[Math.floor(rng() * pool.length)]
        const sp = new THREE.Sprite(
          new THREE.SpriteMaterial({ map: charTexture(ch), transparent: true, opacity: seed.alpha, depthWrite: false }),
        )
        const s = seed.baseScale * (0.7 + rng() * 0.2)
        sp.scale.set(s, s, 1)
        sp.position.copy(tip).addScaledVector(bdir, s * 0.3)
        headGroup.add(sp)
        seed.sprites.push(sp)
      }
      seeds.push(seed)
    }
    stalkGeo.setDrawRange(0, segCursor * 2)
    seedsRef.current = seeds
    flyRef.current = []
    blownRef.current = false

    const release = (count: number, gx: number, gy: number) => {
      const attached = seeds.filter((s) => s.attached)
      const cap = Math.max(3, Math.ceil(attached.length * 0.2))
      const n = Math.min(count, cap, attached.length)
      for (let i = 0; i < n; i++) {
        const s = attached.splice(Math.floor(Math.random() * attached.length), 1)[0]
        s.attached = false

        // 从共享茎网格中抹掉这颗的须
        for (let seg = s.segStart; seg < s.segStart + s.segCount; seg++) {
          const j = seg * 6
          segPos[j] = segPos[j + 3] = 0
          segPos[j + 1] = segPos[j + 4] = 0
          segPos[j + 2] = segPos[j + 5] = 0
          segCol[j] = segCol[j + 3] = 0
          segCol[j + 1] = segCol[j + 4] = 0
          segCol[j + 2] = segCol[j + 5] = 0
        }
        stalkGeo.attributes.position.needsUpdate = true
        stalkGeo.attributes.color.needsUpdate = true

        // 飞行小组：带着自己的须 + 字母
        const g = new THREE.Group()
        g.quaternion.copy(headGroup.getWorldQuaternion(new THREE.Quaternion()))
        g.position.copy(headGroup.getWorldPosition(new THREE.Vector3()))
        const mkLine = (a: THREE.Vector3, b: THREE.Vector3) => {
          const geo = new THREE.BufferGeometry().setFromPoints([a, b])
          return new THREE.Line(
            geo,
            new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.45 }),
          )
        }
        g.add(mkLine(s.dir.clone().multiplyScalar(R * 0.05), s.joint))
        for (const b of s.branchTips) g.add(mkLine(s.joint, b.tip))
        for (const sp of s.sprites) g.attach(sp)
        scene.add(g)

        flyRef.current.push({
          group: g,
          vel: new THREE.Vector3(
            gx * (0.5 + Math.random() * 0.6) + (Math.random() - 0.5) * 0.4,
            gy * (0.5 + Math.random() * 0.6) + Math.random() * 0.5,
            (Math.random() - 0.5) * 0.5 + 0.15,
          ).multiplyScalar(0.5),
          tumble: new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize(),
          tumbleV: (Math.random() - 0.5) * 1.6,
          opacity: s.alpha,
          fadeAt: performance.now() + 1700 + Math.random() * 1300,
        })
      }
      const rest = seeds.filter((s) => s.attached)
      onProgressRef.current?.(1 - rest.length / N)
      if (rest.length > 0 && rest.length <= 8) release(rest.length, gx * 0.6 + 0.8, gy * 0.6 + 0.4)
    }
    apiRef.current = { release }

    // 指针：视差 + 拂动吹风
    let parX = 0
    let parY = 0
    let last = { x: 0, y: 0, t: 0, down: false }
    const el = renderer.domElement
    const onDown = (e: PointerEvent) => {
      last = { x: e.clientX, y: e.clientY, t: performance.now(), down: true }
      el.setPointerCapture?.(e.pointerId)
      el.style.cursor = 'grabbing'
    }
    const onMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect()
      parX = ((e.clientX - rect.left) / rect.width - 0.5) * 2
      parY = ((e.clientY - rect.top) / rect.height - 0.5) * 2
      if (!last.down) return
      const now = performance.now()
      const dx = e.clientX - last.x
      const dy = e.clientY - last.y
      const dt = Math.max(now - last.t, 1)
      const speed = Math.hypot(dx, dy) / dt
      if (speed > 0.3) {
        release(Math.min(16, Math.ceil(speed * 10)), (dx / dt) * 12, (-dy / dt) * 12)
      }
      last = { x: e.clientX, y: e.clientY, t: now, down: true }
    }
    const onUp = () => {
      last.down = false
      el.style.cursor = 'grab'
    }
    el.addEventListener('pointerdown', onDown)
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerup', onUp)
    el.addEventListener('pointercancel', onUp)

    const resize = () => {
      // 用布局尺寸（不受父级 transform 缩放影响）
      const w = host.clientWidth || 1
      const h = host.clientHeight || 1
      renderer.setSize(w, h)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(host)

    const t0 = performance.now()
    let lastEscape = t0
    let raf = 0
    let readyRaf = 0
    let readyEmitted = false
    const tmpV = new THREE.Vector3()

    const animate = () => {
      raf = requestAnimationFrame(animate)
      if (disposed) return
      const now = performance.now()
      const t = (now - MOTION_EPOCH) / 1000

      // 缓慢自转 + 摇摆 + 视差
      headGroup.rotation.y = t * 0.12 + parX * 0.25
      headGroup.rotation.z = (spec.tiltDeg * Math.PI) / 360 + Math.sin(t * 0.7) * 0.03
      headGroup.rotation.x = Math.cos(t * 0.55) * 0.02 + parY * 0.08
      stem.rotation.z = Math.sin(t * 0.7) * 0.01

      headGroup.updateMatrixWorld(true)
      // 深度明暗：背面的种子变淡（字母 + 须的顶点色）
      let colDirty = false
      for (const s of seedsRef.current) {
        if (!s.attached) continue
        tmpV.copy(s.joint).applyMatrix4(headGroup.matrixWorld)
        const k = Math.max(-1, Math.min(1, tmpV.z / R))
        const front = (k + 1) / 2
        for (const sp of s.sprites) sp.material.opacity = s.alpha * (0.2 + 0.8 * front)
        const c = 0.18 + 0.82 * front
        for (let seg = s.segStart; seg < s.segStart + s.segCount; seg++) {
          const j = seg * 6
          segCol[j] = segCol[j + 3] = c * 0.75
          segCol[j + 1] = segCol[j + 4] = c * 0.75
          segCol[j + 2] = segCol[j + 5] = c * 0.75
        }
        colDirty = true
      }
      if (colDirty) stalkGeo.attributes.color.needsUpdate = true

      // 飞走的种子（须+字母一起）
      const fly = flyRef.current
      for (let i = fly.length - 1; i >= 0; i--) {
        const p = fly[i]
        p.vel.multiplyScalar(0.986)
        p.vel.y += 0.0012
        p.group.position.add(p.vel.clone().multiplyScalar(0.016 * 3))
        p.group.position.x += Math.sin(t * 2.1 + i) * 0.003
        p.group.rotateOnAxis(p.tumble, p.tumbleV * 0.01)
        if (now > p.fadeAt) p.opacity -= 0.02
        p.group.traverse((o) => {
          if (o instanceof THREE.Sprite) o.material.opacity = Math.max(0, p.opacity)
          if (o instanceof THREE.Line) (o.material as THREE.LineBasicMaterial).opacity = Math.max(0, p.opacity) * 0.5
        })
        if (p.opacity <= 0 || p.group.position.length() > 9) {
          scene.remove(p.group)
          fly.splice(i, 1)
        }
      }

      // 偶尔逃走一颗（装饰）
      const attached = seedsRef.current.filter((s) => s.attached)
      if (now - lastEscape > 4600 && attached.length > 0) {
        lastEscape = now
        const src = attached[Math.floor(Math.random() * attached.length)]
        const g = new THREE.Group()
        g.quaternion.copy(headGroup.getWorldQuaternion(new THREE.Quaternion()))
        g.position.copy(headGroup.getWorldPosition(new THREE.Vector3()))
        const b = src.branchTips[0]
        if (b) {
          const geo = new THREE.BufferGeometry().setFromPoints([src.joint, b.tip])
          g.add(new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 })))
          const ch = pool[Math.floor(Math.random() * pool.length)]
          const sp = new THREE.Sprite(
            new THREE.SpriteMaterial({ map: charTexture(ch), transparent: true, opacity: 0.9, depthWrite: false }),
          )
          sp.scale.set(src.baseScale * 0.8, src.baseScale * 0.8, 1)
          sp.position.copy(b.tip).addScaledVector(b.dir, src.baseScale * 0.24)
          g.add(sp)
        }
        scene.add(g)
        flyRef.current.push({
          group: g,
          vel: new THREE.Vector3(0.15 + Math.random() * 0.2, 0.25 + Math.random() * 0.2, (Math.random() - 0.5) * 0.15),
          tumble: new THREE.Vector3(0, 0, 1),
          tumbleV: (Math.random() - 0.5) * 0.8,
          opacity: 0.9,
          fadeAt: now + 2100,
        })
      }

      if (!blownRef.current && seedsRef.current.every((s) => !s.attached) && flyRef.current.length === 0) {
        blownRef.current = true
        onAllBlownRef.current?.()
      }

      renderer.render(scene, camera)
      if (!readyEmitted) {
        readyEmitted = true
        // Wait until the browser has had a chance to composite the first WebGL
        // frame before allowing the covering transition to fade away.
        readyRaf = requestAnimationFrame(() => onReadyRef.current?.())
      }
    }
    animate()

    return () => {
      disposed = true
      cancelAnimationFrame(raf)
      cancelAnimationFrame(readyRaf)
      ro.disconnect()
      el.removeEventListener('pointerdown', onDown)
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerup', onUp)
      el.removeEventListener('pointercancel', onUp)
      stalkGeo.dispose()
      ;(stalks.material as THREE.Material).dispose()
      seeds.forEach((s) => s.sprites.forEach((sp) => sp.material.dispose()))
      flyRef.current.forEach((p) => {
        p.group.traverse((o) => {
          if (o instanceof THREE.Line) {
            o.geometry.dispose()
            ;(o.material as THREE.Material).dispose()
          }
          if (o instanceof THREE.Sprite) o.material.dispose()
        })
      })
      ;(core.material as THREE.Material).dispose()
      core.geometry.dispose()
      ;(stem.material as THREE.Material).dispose()
      stem.geometry.dispose()
      renderer.dispose()
      host.removeChild(renderer.domElement)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spec, chars])

  return <div ref={hostRef} className={`h-full w-full ${className}`} />
})

export default LetterSphere3D
