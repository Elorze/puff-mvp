import { useEffect } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'

export type AmbientTone = 'sky' | 'coral' | 'mint' | 'violet'

const PALETTES: Record<AmbientTone, {
  base: string
  nearA: string
  nearB: string
  farA: string
  farB: string
  veil: string
}> = {
  sky: {
    base: '#edf5ff',
    nearA: 'bg-[radial-gradient(circle_at_62%_55%,rgba(74,196,255,.96),rgba(86,139,255,.68)_48%,transparent_76%)]',
    nearB: 'bg-[radial-gradient(circle_at_38%_48%,rgba(255,139,220,.84),rgba(188,145,255,.64)_48%,transparent_76%)]',
    farA: 'bg-[radial-gradient(circle_at_55%_42%,rgba(178,243,201,.92),rgba(238,233,113,.68)_48%,transparent_78%)]',
    farB: 'bg-[radial-gradient(circle_at_42%_38%,rgba(255,219,118,.9),rgba(141,156,255,.62)_52%,transparent_79%)]',
    veil: 'bg-[linear-gradient(180deg,rgba(255,255,255,.08),rgba(232,241,255,.18))]',
  },
  coral: {
    base: '#cf603f',
    nearA: 'bg-[radial-gradient(circle_at_62%_55%,rgba(255,122,79,.96),rgba(255,176,91,.78)_48%,transparent_76%)]',
    nearB: 'bg-[radial-gradient(circle_at_38%_48%,rgba(244,91,176,.9),rgba(151,91,229,.72)_48%,transparent_76%)]',
    farA: 'bg-[radial-gradient(circle_at_55%_42%,rgba(255,213,88,.92),rgba(239,113,61,.76)_48%,transparent_78%)]',
    farB: 'bg-[radial-gradient(circle_at_42%_38%,rgba(89,167,235,.82),rgba(139,91,221,.7)_52%,transparent_79%)]',
    veil: 'bg-[linear-gradient(180deg,rgba(90,24,37,.04),rgba(88,25,34,.2))]',
  },
  mint: {
    base: '#eafff7',
    nearA: 'bg-[radial-gradient(circle_at_62%_55%,rgba(40,224,171,.95),rgba(72,202,218,.7)_48%,transparent_76%)]',
    nearB: 'bg-[radial-gradient(circle_at_38%_48%,rgba(101,176,255,.82),rgba(157,128,255,.58)_48%,transparent_76%)]',
    farA: 'bg-[radial-gradient(circle_at_55%_42%,rgba(195,245,111,.9),rgba(89,224,171,.68)_48%,transparent_78%)]',
    farB: 'bg-[radial-gradient(circle_at_42%_38%,rgba(255,170,218,.72),rgba(90,205,226,.62)_52%,transparent_79%)]',
    veil: 'bg-[linear-gradient(180deg,rgba(240,255,250,.04),rgba(204,248,232,.16))]',
  },
  violet: {
    base: '#f2efff',
    nearA: 'bg-[radial-gradient(circle_at_62%_55%,rgba(139,104,255,.94),rgba(97,153,255,.68)_48%,transparent_76%)]',
    nearB: 'bg-[radial-gradient(circle_at_38%_48%,rgba(255,133,207,.82),rgba(191,143,255,.65)_48%,transparent_76%)]',
    farA: 'bg-[radial-gradient(circle_at_55%_42%,rgba(124,236,211,.82),rgba(116,190,255,.62)_48%,transparent_78%)]',
    farB: 'bg-[radial-gradient(circle_at_42%_38%,rgba(255,219,120,.76),rgba(151,126,255,.62)_52%,transparent_79%)]',
    veil: 'bg-[linear-gradient(180deg,rgba(250,247,255,.04),rgba(232,224,255,.16))]',
  },
}

/** Flowing candy-color atmosphere with subtle pointer/touch parallax. */
export default function AmbientSky({
  className = '',
  tone = 'sky',
}: {
  className?: string
  tone?: AmbientTone
}) {
  const palette = PALETTES[tone]
  const pointerX = useMotionValue(0)
  const pointerY = useMotionValue(0)
  const springX = useSpring(pointerX, { stiffness: 48, damping: 18, mass: 0.9 })
  const springY = useSpring(pointerY, { stiffness: 48, damping: 18, mass: 0.9 })
  const nearX = useTransform(springX, [-1, 1], [-22, 22])
  const nearY = useTransform(springY, [-1, 1], [-18, 18])
  const farX = useTransform(springX, [-1, 1], [14, -14])
  const farY = useTransform(springY, [-1, 1], [11, -11])

  useEffect(() => {
    const handlePointer = (event: PointerEvent) => {
      pointerX.set((event.clientX / window.innerWidth - 0.5) * 2)
      pointerY.set((event.clientY / window.innerHeight - 0.5) * 2)
    }
    const reset = () => {
      pointerX.set(0)
      pointerY.set(0)
    }
    window.addEventListener('pointermove', handlePointer)
    window.addEventListener('pointerleave', reset)
    return () => {
      window.removeEventListener('pointermove', handlePointer)
      window.removeEventListener('pointerleave', reset)
    }
  }, [pointerX, pointerY])

  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      style={{ backgroundColor: palette.base }}
      aria-hidden
    >
      <motion.div className="absolute inset-0" style={{ x: nearX, y: nearY }}>
        <motion.div
          className={`absolute -left-20 -top-16 h-[310px] w-[330px] rounded-[44%_56%_62%_38%/52%_41%_59%_48%] blur-[20px] ${palette.nearA}`}
          animate={{ x: [0, 104, 28, -18, 0], y: [0, 112, 218, 72, 0], rotate: [0, 82, 196, 292, 360], scale: [1, 1.2, 0.9, 1.12, 1] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className={`absolute -right-24 top-[15%] h-[290px] w-[320px] rounded-[58%_42%_38%_62%/42%_58%_48%_52%] blur-[21px] ${palette.nearB}`}
          animate={{ x: [0, -112, -34, 18, 0], y: [0, 106, 226, 92, 0], rotate: [0, -104, -226, -302, -360], scale: [0.94, 1.18, 0.88, 1.08, 0.94] }}
          transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.div>

      <motion.div className="absolute inset-0" style={{ x: farX, y: farY }}>
        <motion.div
          className={`absolute -left-16 top-[44%] h-[270px] w-[300px] rounded-[39%_61%_55%_45%/59%_43%_57%_41%] blur-[19px] ${palette.farA}`}
          animate={{ x: [0, 118, 42, -12, 0], y: [0, 96, -84, -24, 0], rotate: [0, 132, 258, 318, 360], scale: [1.06, 0.86, 1.2, 0.94, 1.06] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className={`absolute -bottom-20 -right-12 h-[280px] w-[300px] rounded-[62%_38%_48%_52%/44%_62%_38%_56%] blur-[20px] ${palette.farB}`}
          animate={{ x: [0, -116, -28, 22, 0], y: [0, -96, -184, -70, 0], rotate: [0, -126, -264, -324, -360], scale: [0.96, 1.18, 0.86, 1.08, 0.96] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.div>

      <div className={`absolute inset-0 ${palette.veil}`} />
    </div>
  )
}
