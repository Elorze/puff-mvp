import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { useLanguage } from '@/i18n'

interface Props {
  progress: number
  seedKey: string
  className?: string
  transparent?: boolean
}

const pointVertexShader = `
  attribute float aSize;
  attribute float aAlpha;
  attribute float aBirth;
  attribute vec3 aStart;
  varying float vAlpha;
  uniform float uPixelRatio;
  uniform float uBreath;
  uniform float uProgress;

  void main() {
    float gather = smoothstep(aBirth - 0.18, aBirth + 0.035, uProgress);
    float reveal = smoothstep(aBirth - 0.16, aBirth + 0.025, uProgress);
    vec3 gatheredPosition = mix(aStart, position, gather);
    vec4 mvPosition = modelViewMatrix * vec4(gatheredPosition, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = aSize * uPixelRatio * uBreath * (9.0 / max(1.0, -mvPosition.z));
    vAlpha = aAlpha * reveal;
  }
`

const pointFragmentShader = `
  varying float vAlpha;

  void main() {
    float distanceToCenter = distance(gl_PointCoord, vec2(0.5));
    if (distanceToCenter > 0.5) discard;

    float glow = smoothstep(0.5, 0.0, distanceToCenter);
    float core = smoothstep(0.17, 0.0, distanceToCenter);
    vec3 mint = vec3(0.36, 1.0, 0.83);
    vec3 color = mix(mint, vec3(1.0), core);
    float alpha = (glow * 0.46 + core * 0.94) * vAlpha;
    gl_FragColor = vec4(color, alpha);
  }
`

const lineVertexShader = `
  attribute float aBirth;
  varying float vAlpha;
  uniform float uProgress;

  void main() {
    vAlpha = smoothstep(aBirth - 0.02, aBirth + 0.1, uProgress);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const lineFragmentShader = `
  varying float vAlpha;

  void main() {
    gl_FragColor = vec4(vec3(0.79, 1.0, 0.94), vAlpha * 0.22);
  }
`

function seededRandom(seedKey: string) {
  let seed = seedKey.split('').reduce((sum, char) => (sum * 31 + char.charCodeAt(0)) >>> 0, 2166136261)
  return () => {
    seed += 0x6d2b79f5
    let value = seed
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}

function makeLeaf(points: THREE.Vector3[], color: number, opacity: number) {
  const curve = new THREE.CatmullRomCurve3(points)
  const geometry = new THREE.BufferGeometry().setFromPoints(curve.getPoints(36))
  const material = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity,
    blending: THREE.AdditiveBlending,
  })
  return new THREE.Line(geometry, material)
}

export default function GrowingDandelion({ progress, seedKey, className = '', transparent = false }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const targetProgressRef = useRef(Math.max(0, Math.min(1, progress)))
  const { language } = useLanguage()

  useEffect(() => {
    targetProgressRef.current = Math.max(0, Math.min(1, progress))
  }, [progress])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const clamped = Math.max(0, Math.min(1, progress))
    const random = seededRandom(seedKey)
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 30)
    camera.position.set(0, 0.12, 6.15)

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.domElement.style.width = '100%'
    renderer.domElement.style.height = '100%'
    renderer.domElement.style.touchAction = 'none'
    container.appendChild(renderer.domElement)

    const root = new THREE.Group()
    root.position.y = -0.02
    scene.add(root)

    const head = new THREE.Group()
    const growthScale = 0.68 + clamped * 0.32
    head.position.y = 0.48
    head.scale.setScalar(growthScale)
    root.add(head)

    const rayCount = 208
    const linePositions: number[] = []
    const lineBirths: number[] = []
    const particlePositions: number[] = []
    const particleStartPositions: number[] = []
    const particleSizes: number[] = []
    const particleAlphas: number[] = []
    const particleBirths: number[] = []
    const goldenAngle = Math.PI * (3 - Math.sqrt(5))

    for (let index = 0; index < rayCount; index += 1) {
      const normalized = (index + 0.5) / rayCount
      const y = 1 - normalized * 2
      const radial = Math.sqrt(Math.max(0, 1 - y * y))
      const theta = index * goldenAngle + random() * 0.08
      const direction = new THREE.Vector3(
        Math.cos(theta) * radial,
        y * 0.94,
        Math.sin(theta) * radial,
      ).normalize()
      const birth = Math.min(0.9, Math.max(0.015, normalized * 0.78 + random() * 0.1))

      const stalkStart = direction.clone().multiplyScalar(0.1 + random() * 0.08)
      const pappusCenter = direction.clone().multiplyScalar(0.78 + random() * 0.29)
      linePositions.push(
        stalkStart.x, stalkStart.y, stalkStart.z,
        pappusCenter.x, pappusCenter.y, pappusCenter.z,
      )
      lineBirths.push(birth, birth)

      particlePositions.push(pappusCenter.x, pappusCenter.y, pappusCenter.z)
      const dispersedCenter = direction.clone().multiplyScalar(1.45 + random() * 1.25)
      dispersedCenter.x += (random() - 0.5) * 0.65
      dispersedCenter.y += (random() - 0.5) * 0.9
      dispersedCenter.z += (random() - 0.5) * 0.7
      particleStartPositions.push(dispersedCenter.x, dispersedCenter.y, dispersedCenter.z)
      particleSizes.push(1.6 + random() * 1.8)
      particleAlphas.push(0.46 + random() * 0.34)
      particleBirths.push(birth)

      const reference = Math.abs(direction.y) < 0.86
        ? new THREE.Vector3(0, 1, 0)
        : new THREE.Vector3(1, 0, 0)
      const tangent = new THREE.Vector3().crossVectors(direction, reference).normalize()
      const bitangent = new THREE.Vector3().crossVectors(direction, tangent).normalize()
      const pappusCount = 7 + Math.floor(random() * 6)

      for (let filament = 0; filament < pappusCount; filament += 1) {
        const angle = (filament / pappusCount) * Math.PI * 2 + random() * 0.22
        const spread = 0.11 + random() * 0.16
        const tip = pappusCenter.clone()
          .addScaledVector(tangent, Math.cos(angle) * spread)
          .addScaledVector(bitangent, Math.sin(angle) * spread)
          .addScaledVector(direction, 0.018 + random() * 0.075)

        linePositions.push(
          pappusCenter.x, pappusCenter.y, pappusCenter.z,
          tip.x, tip.y, tip.z,
        )
        lineBirths.push(birth + 0.025, birth + 0.025)
        particlePositions.push(tip.x, tip.y, tip.z)
        const dispersedTip = dispersedCenter.clone()
          .addScaledVector(tangent, (random() - 0.5) * 0.42)
          .addScaledVector(bitangent, (random() - 0.5) * 0.42)
        particleStartPositions.push(dispersedTip.x, dispersedTip.y, dispersedTip.z)
        particleSizes.push(0.55 + random() * 1.1)
        particleAlphas.push(0.16 + random() * 0.42)
        particleBirths.push(Math.min(0.98, birth + 0.025 + random() * 0.04))
      }
    }

    const lineGeometry = new THREE.BufferGeometry()
    lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3))
    lineGeometry.setAttribute('aBirth', new THREE.Float32BufferAttribute(lineBirths, 1))
    const lineMaterial = new THREE.ShaderMaterial({
      vertexShader: lineVertexShader,
      fragmentShader: lineFragmentShader,
      uniforms: {
        uProgress: { value: clamped },
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    const filaments = new THREE.LineSegments(lineGeometry, lineMaterial)
    head.add(filaments)

    const particleGeometry = new THREE.BufferGeometry()
    particleGeometry.setAttribute('position', new THREE.Float32BufferAttribute(particlePositions, 3))
    particleGeometry.setAttribute('aStart', new THREE.Float32BufferAttribute(particleStartPositions, 3))
    particleGeometry.setAttribute('aSize', new THREE.Float32BufferAttribute(particleSizes, 1))
    particleGeometry.setAttribute('aAlpha', new THREE.Float32BufferAttribute(particleAlphas, 1))
    particleGeometry.setAttribute('aBirth', new THREE.Float32BufferAttribute(particleBirths, 1))
    const particleMaterial = new THREE.ShaderMaterial({
      vertexShader: pointVertexShader,
      fragmentShader: pointFragmentShader,
      uniforms: {
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
        uBreath: { value: 1 },
        uProgress: { value: clamped },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
    const particles = new THREE.Points(particleGeometry, particleMaterial)
    head.add(particles)

    const coreGeometry = new THREE.SphereGeometry(0.075, 18, 18)
    const coreMaterial = new THREE.MeshBasicMaterial({
      color: 0xf4ffcf,
      transparent: true,
      opacity: 0.48 + clamped * 0.2,
      blending: THREE.AdditiveBlending,
    })
    const core = new THREE.Mesh(coreGeometry, coreMaterial)
    head.add(core)

    const innerGlowGeometry = new THREE.SphereGeometry(0.26, 18, 18)
    const innerGlowMaterial = new THREE.MeshBasicMaterial({
      color: 0x8dffd9,
      transparent: true,
      opacity: 0.07,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    head.add(new THREE.Mesh(innerGlowGeometry, innerGlowMaterial))

    const stemHeight = 2.55
    const stemGeometry = new THREE.CylinderGeometry(0.018, 0.032, stemHeight, 8)
    const stemMaterial = new THREE.MeshBasicMaterial({
      color: 0x7fffd3,
      transparent: true,
      opacity: 0.42 + clamped * 0.24,
      blending: THREE.AdditiveBlending,
    })
    const stem = new THREE.Mesh(stemGeometry, stemMaterial)
    stem.position.y = -0.86
    root.add(stem)

    const leftLeaf = makeLeaf(
      [new THREE.Vector3(0, -1.25, 0), new THREE.Vector3(-0.2, -1.02, 0), new THREE.Vector3(-0.62, -0.86, 0.02)],
      0x8dffdc,
      0,
    )
    const rightLeaf = makeLeaf(
      [new THREE.Vector3(0, -0.76, 0), new THREE.Vector3(0.26, -0.55, 0), new THREE.Vector3(0.56, -0.36, 0.02)],
      0xa0ffe4,
      0,
    )
    root.add(leftLeaf, rightLeaf)

    const ambientCount = 72
    const ambientPositions: number[] = []
    const ambientSizes: number[] = []
    const ambientAlphas: number[] = []
    for (let index = 0; index < ambientCount; index += 1) {
      const angle = random() * Math.PI * 2
      const radius = 1.15 + random() * 1.15
      ambientPositions.push(
        Math.cos(angle) * radius,
        -0.2 + random() * 2.45,
        -0.6 + random() * 1.2,
      )
      ambientSizes.push(1 + random() * 2.4)
      ambientAlphas.push(0.08 + random() * 0.28)
    }
    const ambientGeometry = new THREE.BufferGeometry()
    ambientGeometry.setAttribute('position', new THREE.Float32BufferAttribute(ambientPositions, 3))
    ambientGeometry.setAttribute('aStart', new THREE.Float32BufferAttribute(ambientPositions, 3))
    ambientGeometry.setAttribute('aSize', new THREE.Float32BufferAttribute(ambientSizes, 1))
    ambientGeometry.setAttribute('aAlpha', new THREE.Float32BufferAttribute(ambientAlphas, 1))
    ambientGeometry.setAttribute('aBirth', new THREE.Float32BufferAttribute(new Array(ambientCount).fill(0), 1))
    const ambientMaterial = particleMaterial.clone()
    ambientMaterial.uniforms = THREE.UniformsUtils.clone(particleMaterial.uniforms)
    ambientMaterial.uniforms.uProgress.value = 1
    const ambient = new THREE.Points(ambientGeometry, ambientMaterial)
    scene.add(ambient)

    let dragging = false
    let lastX = 0
    let lastY = 0
    let dragX = 0
    let dragY = 0
    let targetX = 0
    let targetY = 0
    let pulse = 0

    const onPointerDown = (event: PointerEvent) => {
      dragging = true
      lastX = event.clientX
      lastY = event.clientY
      pulse = 1
      renderer.domElement.setPointerCapture(event.pointerId)
    }
    const onPointerMove = (event: PointerEvent) => {
      const bounds = renderer.domElement.getBoundingClientRect()
      const nx = ((event.clientX - bounds.left) / bounds.width) * 2 - 1
      const ny = ((event.clientY - bounds.top) / bounds.height) * 2 - 1
      if (dragging) {
        dragY += (event.clientX - lastX) * 0.008
        dragX += (event.clientY - lastY) * 0.006
        lastX = event.clientX
        lastY = event.clientY
      } else {
        targetY = nx * 0.28
        targetX = ny * 0.12
      }
    }
    const onPointerUp = (event: PointerEvent) => {
      dragging = false
      if (renderer.domElement.hasPointerCapture(event.pointerId)) {
        renderer.domElement.releasePointerCapture(event.pointerId)
      }
    }
    const onPointerLeave = () => {
      if (!dragging) {
        targetX = 0
        targetY = 0
      }
    }

    renderer.domElement.addEventListener('pointerdown', onPointerDown)
    renderer.domElement.addEventListener('pointermove', onPointerMove)
    renderer.domElement.addEventListener('pointerup', onPointerUp)
    renderer.domElement.addEventListener('pointercancel', onPointerUp)
    renderer.domElement.addEventListener('pointerleave', onPointerLeave)

    const resize = () => {
      const width = Math.max(1, container.clientWidth)
      const height = Math.max(1, container.clientHeight)
      renderer.setSize(width, height, false)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
    }
    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(container)
    resize()

    let frame = 0
    let visible = true
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
    }, { threshold: 0.01 })
    visibilityObserver.observe(container)

    const startedAt = Date.now()
    const stemBottom = -2.135
    let displayedProgress = clamped
    const animate = () => {
      frame = requestAnimationFrame(animate)
      if (!visible) return
      const elapsed = (Date.now() - startedAt) / 1000
      displayedProgress += (targetProgressRef.current - displayedProgress) * 0.055
      const easedProgress = displayedProgress * displayedProgress * (3 - 2 * displayedProgress)
      const breath = 1 + Math.sin(elapsed * 1.4) * 0.035 + pulse * 0.08
      pulse *= 0.92

      particleMaterial.uniforms.uBreath.value = breath
      particleMaterial.uniforms.uProgress.value = displayedProgress
      lineMaterial.uniforms.uProgress.value = displayedProgress
      ambientMaterial.uniforms.uBreath.value = 0.9 + Math.sin(elapsed * 0.8) * 0.12
      const headGrowth = 0.18 + easedProgress * 0.82
      const stemGrowth = 0.12 + easedProgress * 0.88
      head.position.y = stemBottom + stemHeight * stemGrowth + 0.06
      head.scale.setScalar(headGrowth * breath)
      stem.scale.y = stemGrowth
      stem.position.y = stemBottom + (stemHeight * stemGrowth) / 2
      stemMaterial.opacity = 0.2 + displayedProgress * 0.46
      lineMaterial.uniforms.uProgress.value = displayedProgress
      coreMaterial.opacity = 0.28 + displayedProgress * 0.4
      const leafReveal = Math.max(0, (displayedProgress - 0.18) / 0.5)
      ;(leftLeaf.material as THREE.LineBasicMaterial).opacity = Math.min(0.36, leafReveal * 0.34)
      ;(rightLeaf.material as THREE.LineBasicMaterial).opacity = Math.min(0.36, leafReveal * 0.34)
      core.scale.setScalar(1 + Math.sin(elapsed * 1.9) * 0.12 + pulse * 0.3)

      root.rotation.x += (targetX + dragX - root.rotation.x) * 0.055
      root.rotation.y += (targetY + dragY + elapsed * 0.08 - root.rotation.y) * 0.055
      root.rotation.z = Math.sin(elapsed * 0.55) * 0.018
      ambient.rotation.y = -elapsed * 0.025
      ambient.position.y = Math.sin(elapsed * 0.32) * 0.035
      renderer.render(scene, camera)
    }
    animate()

    return () => {
      cancelAnimationFrame(frame)
      resizeObserver.disconnect()
      visibilityObserver.disconnect()
      renderer.domElement.removeEventListener('pointerdown', onPointerDown)
      renderer.domElement.removeEventListener('pointermove', onPointerMove)
      renderer.domElement.removeEventListener('pointerup', onPointerUp)
      renderer.domElement.removeEventListener('pointercancel', onPointerUp)
      renderer.domElement.removeEventListener('pointerleave', onPointerLeave)
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Line || object instanceof THREE.Points || object instanceof THREE.LineSegments) {
          object.geometry?.dispose()
          const materials = Array.isArray(object.material) ? object.material : [object.material]
          materials.forEach((material) => material.dispose())
        }
      })
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [seedKey])

  const label = language === 'zh'
    ? `可旋转的粒子蒲公英，成长进度 ${Math.round(progress * 100)}%`
    : `Rotatable particle dandelion, ${Math.round(progress * 100)}% grown`

  return (
    <div
      ref={containerRef}
      className={`relative h-[268px] w-full cursor-grab overflow-hidden rounded-[28px] active:cursor-grabbing ${className}`}
      role="img"
      aria-label={label}
      style={transparent
        ? { background: 'transparent', boxShadow: 'none' }
        : {
            background:
              'linear-gradient(180deg, rgba(2,34,36,.98) 0%, rgba(1,17,21,.99) 100%)',
            boxShadow:
              'inset 0 0 0 1px rgba(218,255,241,.13), inset 0 0 36px rgba(31,255,188,.035), 0 20px 48px rgba(0,48,47,.18)',
          }}
    >
      <div
        className="pointer-events-none absolute inset-x-[18%] bottom-3 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(118,255,216,.26), transparent)' }}
      />
    </div>
  )
}
