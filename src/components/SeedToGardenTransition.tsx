import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import seedPng from '@/assets/sprites/seed.png'
import AmbientSky from '@/components/AmbientSky'
import { useLanguage } from '@/i18n'

interface Props {
  senderName: string
  onGarden: () => void
  onComplete: () => void
}

const PARTICLES = Array.from({ length: 28 }, (_, index) => {
  const angle = (index / 28) * Math.PI * 2
  const radius = 48 + (index % 5) * 13
  return {
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius * 0.72,
    size: 2 + (index % 3),
    delay: (index % 7) * 0.018,
  }
})

/**
 * 接受一颗种子后，保持它在视觉上连续存在：
 * 从接种页被风托起，中途切换到花圃，再落入土壤成为生长起点。
 */
export default function SeedToGardenTransition({ senderName, onGarden, onComplete }: Props) {
  const { language } = useLanguage()
  const zh = language === 'zh'
  const onGardenRef = useRef(onGarden)
  const onCompleteRef = useRef(onComplete)

  useEffect(() => {
    onGardenRef.current = onGarden
    onCompleteRef.current = onComplete
  }, [onComplete, onGarden])

  useEffect(() => {
    const gardenTimer = window.setTimeout(() => onGardenRef.current(), 680)
    const completeTimer = window.setTimeout(() => onCompleteRef.current(), 1_780)
    return () => {
      window.clearTimeout(gardenTimer)
      window.clearTimeout(completeTimer)
    }
  }, [])

  return (
    <motion.div
      className="pointer-events-auto absolute inset-0 z-[95] overflow-hidden"
      role="status"
      aria-label={zh ? '正在把种子送往花圃' : 'Carrying the seed to the garden'}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22 }}
    >
      <motion.div
        className="absolute inset-0"
        animate={{ opacity: [1, 1, 0] }}
        transition={{ duration: 1.2, times: [0, 0.42, 1], ease: 'easeInOut' }}
      >
        <AmbientSky tone="coral" />
      </motion.div>
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0, 1] }}
        transition={{ duration: 1.18, times: [0, 0.4, 1], ease: 'easeInOut' }}
      >
        <AmbientSky tone="mint" />
      </motion.div>

      <motion.div
        className="absolute inset-0 bg-[radial-gradient(circle_at_50%_48%,rgba(223,255,244,.22),transparent_27%),linear-gradient(180deg,rgba(7,24,38,.08),rgba(7,35,39,.22))]"
        animate={{ opacity: [0.55, 0.82, 0.38] }}
        transition={{ duration: 1.7, ease: 'easeInOut' }}
      />

      <div className="absolute inset-0 flex items-center justify-center">
        <motion.svg
          viewBox="0 0 180 430"
          className="absolute left-1/2 top-1/2 h-[430px] w-[180px] -translate-x-1/2 -translate-y-1/2 overflow-visible"
          fill="none"
          aria-hidden
        >
          <motion.path
            d="M91 357 C 142 292, 24 238, 92 166 C 132 124, 54 83, 90 42"
            stroke="rgba(235,255,247,.56)"
            strokeWidth="1.2"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: [0, 1, 1], opacity: [0, 0.7, 0] }}
            transition={{ duration: 1.42, times: [0, 0.62, 1], ease: 'easeInOut' }}
          />
        </motion.svg>

        {PARTICLES.map((particle, index) => (
          <motion.span
            key={index}
            className="absolute rounded-full bg-[#e4fff5] shadow-[0_0_9px_rgba(146,255,220,.9)]"
            style={{ width: particle.size, height: particle.size }}
            initial={{ x: particle.x, y: 92 + particle.y, opacity: 0, scale: 0.3 }}
            animate={{
              x: [particle.x, particle.x * 0.42, 0, 0],
              y: [92 + particle.y, 22 + particle.y * 0.2, -176, 28],
              opacity: [0, 0.82, 0.9, 0],
              scale: [0.3, 1, 0.7, 0.15],
            }}
            transition={{
              duration: 1.48,
              delay: particle.delay,
              times: [0, 0.28, 0.66, 1],
              ease: [0.42, 0, 0.2, 1],
            }}
          />
        ))}

        <motion.div
          className="absolute h-[86px] w-[86px] rounded-full bg-[radial-gradient(circle,rgba(211,255,241,.24),rgba(102,236,203,.08)_46%,transparent_70%)]"
          initial={{ y: 110, scale: 0.5, opacity: 0 }}
          animate={{ y: [110, 18, -178, 30], scale: [0.5, 1.05, 0.46, 0.18], opacity: [0, 1, 1, 0] }}
          transition={{ duration: 1.52, times: [0, 0.28, 0.65, 1], ease: [0.42, 0, 0.2, 1] }}
        />

        <motion.img
          src={seedPng}
          alt=""
          draggable={false}
          className="absolute h-[76px] w-auto select-none brightness-[1.55] drop-shadow-[0_0_12px_rgba(235,255,247,.88)]"
          initial={{ x: 0, y: 110, rotate: -12, scale: 0.55, opacity: 0 }}
          animate={{
            x: [0, 30, -14, 0],
            y: [110, 18, -178, 30],
            rotate: [-12, 18, -24, 4],
            scale: [0.55, 0.9, 0.42, 0.15],
            opacity: [0, 1, 1, 0],
          }}
          transition={{ duration: 1.52, times: [0, 0.28, 0.65, 1], ease: [0.42, 0, 0.2, 1] }}
        />

        <motion.div
          className="absolute h-12 w-12 rounded-full border border-[#d9fff2]/70"
          initial={{ y: 30, scale: 0, opacity: 0 }}
          animate={{ y: 30, scale: [0, 0, 1.9], opacity: [0, 0.72, 0] }}
          transition={{ duration: 1.62, times: [0, 0.74, 1], ease: 'easeOut' }}
        />
        <motion.div
          className="absolute h-6 w-6 rounded-full bg-[#d8fff2] shadow-[0_0_22px_7px_rgba(96,255,207,.64)]"
          initial={{ y: 30, scale: 0, opacity: 0 }}
          animate={{ y: 30, scale: [0, 0, 1, 0.2], opacity: [0, 0, 1, 0] }}
          transition={{ duration: 1.68, times: [0, 0.68, 0.82, 1], ease: 'easeOut' }}
        />
      </div>

      <motion.p
        className="absolute inset-x-8 bottom-20 text-center text-[12px] font-medium leading-relaxed text-white/88 drop-shadow-sm"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: [0, 1, 1, 0], y: [8, 0, 0, -4] }}
        transition={{ duration: 1.62, times: [0, 0.2, 0.72, 1] }}
      >
        {zh ? `${senderName} 的种子，正在花圃里落下。` : `${senderName}'s seed is settling into the garden.`}
      </motion.p>
    </motion.div>
  )
}
