/** 程序化蒲公英：每朵都由一段文字 + 随机种子生成，参数各不相同 */

export function hashStr(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** 一朵蒲公英的“规格”——也是 UI 里展示的 SPEC 卡片内容 */
export interface DandelionSpec {
  id: number // 标本编号
  seedCount: number // 籽数
  radiusK: number // 绒球半径系数
  tiltDeg: number // 花头倾斜角
  density: number // 每颗籽的绒毛数
  fluffK: number // 绒毛长度系数
  asymK: number // 不对称度
}

export function createSpec(key: string): DandelionSpec {
  const rng = mulberry32(hashStr(key))
  return {
    id: 1 + Math.floor(rng() * 8999),
    seedCount: 150 + Math.floor(rng() * 43), // 150–192
    radiusK: 0.88 + rng() * 0.26,
    tiltDeg: Math.round((rng() - 0.5) * 14),
    density: 26 + Math.floor(rng() * 15), // 26–40
    fluffK: 0.85 + rng() * 0.35,
    asymK: 0.1 + rng() * 0.22,
  }
}

export function specLine(s: DandelionSpec, zh = false): string {
  return zh
    ? `编号 ${String(s.id).padStart(4, '0')} / 种子 ${s.seedCount} / 密度 ${s.density} / 倾角 ${s.tiltDeg > 0 ? '+' : ''}${s.tiltDeg}°`
    : `NO.${String(s.id).padStart(4, '0')} / SEEDS ${s.seedCount} / DENSITY ${s.density} / TILT ${s.tiltDeg > 0 ? '+' : ''}${s.tiltDeg}°`
}

/**
 * 预渲染 8 个绒毛种子精灵（每个也不同），运行时旋转缩放复用——
 * 比每帧画几千根线快得多，且保持手绘感。
 * 精灵坐标：128×128，籽在底部中心 (64,120)，绒毛球心在 (64,44)。
 */
export const SPRITE_ANCHOR_X = 64
export const SPRITE_ANCHOR_Y = 120
export const SPRITE_STALK = 76 // 籽到绒毛球心的距离（px）

export function buildSeedSprites(rand: () => number, density: number, fluffK: number): HTMLCanvasElement[] {
  const sprites: HTMLCanvasElement[] = []
  for (let v = 0; v < 8; v++) {
    const c = document.createElement('canvas')
    c.width = 128
    c.height = 128
    const g = c.getContext('2d')
    if (!g) continue
    const px = SPRITE_ANCHOR_X
    const py = 44
    const bow = (rand() - 0.5) * 12

    // 绒毛（先画，压在茎后面）
    const n = Math.max(18, density + Math.floor((rand() - 0.5) * 10))
    const spread = 2.1 + rand() * 0.6
    for (let i = 0; i < n; i++) {
      const t = n === 1 ? 0.5 : i / (n - 1)
      const ang = -Math.PI / 2 + (t - 0.5) * spread + (rand() - 0.5) * 0.14
      const len = (16 + rand() * 16) * fluffK
      const grey = 148 + Math.floor(rand() * 72)
      g.strokeStyle = `rgba(${grey},${grey},${grey},${0.32 + rand() * 0.32})`
      g.lineWidth = 0.8
      g.beginPath()
      g.moveTo(px, py)
      g.quadraticCurveTo(
        px + Math.cos(ang) * len * 0.55 + (rand() - 0.5) * 4,
        py + Math.sin(ang) * len * 0.55 + (rand() - 0.5) * 4,
        px + Math.cos(ang) * len,
        py + Math.sin(ang) * len,
      )
      g.stroke()
    }

    // 茎（略带弧度）
    g.strokeStyle = 'rgba(158,142,108,0.78)'
    g.lineWidth = 1.5
    g.lineCap = 'round'
    g.beginPath()
    g.moveTo(px, SPRITE_ANCHOR_Y - 4)
    g.quadraticCurveTo(px + bow, 84, px, py + 2)
    g.stroke()

    // 籽（深褐色小橄榄形）
    g.fillStyle = 'rgba(96,80,58,0.95)'
    g.beginPath()
    g.ellipse(px, SPRITE_ANCHOR_Y - 6, 2.6, 6.5, (bow * Math.PI) / 180, 0, Math.PI * 2)
    g.fill()

    sprites.push(c)
  }
  return sprites
}
