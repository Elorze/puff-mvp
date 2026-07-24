import { motion } from 'framer-motion'
import seedPng from '@/assets/sprites/seed.png'
import { useLanguage } from '@/i18n'

interface Props {
  top: string
  delay?: number
  duration?: number
  variant?: number
  onCatch: () => void
}

/** 慢慢飘过天空的真实种子，点一下接住 */
export default function FloatingSeed({ top, delay = 0, duration = 18, variant = 1, onCatch }: Props) {
  const { language } = useLanguage()
  return (
    <motion.button
      type="button"
      aria-label={language === 'zh' ? '接住这颗种子' : 'catch this seed'}
      className="absolute z-10 -ml-7 p-3"
      style={{ top }}
      initial={{ left: '-16%' }}
      animate={{ left: '110%' }}
      transition={{ duration, delay, ease: 'linear', repeat: Infinity, repeatDelay: delay * 0.6 }}
      onClick={onCatch}
      whileTap={{ scale: 1.25 }}
    >
      <motion.img
        src={seedPng}
        alt=""
        className="h-24 w-auto opacity-95"
        style={{
          transform: variant % 2 === 0 ? 'scaleX(-1)' : undefined,
          filter: 'brightness(1.7) drop-shadow(0 0 7px rgba(255,255,255,0.75))',
        }}
        animate={{ y: [0, -13, 4, -9, 0], rotate: [-9, 7, -6, 9, -9] }}
        transition={{ duration: 6.5, repeat: Infinity, ease: 'easeInOut' }}
        draggable={false}
      />
    </motion.button>
  )
}
