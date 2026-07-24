import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import LetterSphere3D from '@/components/LetterSphere3D'
import type { DandelionSpec } from '@/lib/dandelion'
import { useLanguage } from '@/i18n'
import { TAG_LABEL_ZH } from '@/data/content'

interface Props {
  spec: DandelionSpec
  chars: string[]
  tags: string[]
  renewal?: boolean
  readyToExit: boolean
  onPrepare: () => void
  onDone: () => void
}

type Phase = 'chips' | 'scatter' | 'grow' | 'handoff'

/** 过渡页：选中的标签碎成字母飞散，再聚成一朵蒲公英 */
export default function Bloom({ spec, chars, tags, renewal = false, readyToExit, onPrepare, onDone }: Props) {
  const { language } = useLanguage()
  const zh = language === 'zh'
  const [phase, setPhase] = useState<Phase>(renewal ? 'grow' : 'chips')
  const [minimumGrowShown, setMinimumGrowShown] = useState(false)

  useEffect(() => {
    if (renewal) {
      const prepareTimer = window.setTimeout(onPrepare, 1750)
      const minimumTimer = window.setTimeout(() => setMinimumGrowShown(true), 2200)
      const handoffTimer = window.setTimeout(() => setPhase('handoff'), 3300)
      return () => {
        window.clearTimeout(prepareTimer)
        window.clearTimeout(minimumTimer)
        window.clearTimeout(handoffTimer)
      }
    }
    const t1 = window.setTimeout(() => setPhase('scatter'), 900)
    const t2 = window.setTimeout(() => setPhase('grow'), 1380)
    // Mount the real blow screen underneath while this transition still covers it.
    const t3 = window.setTimeout(onPrepare, 2450)
    const t4 = window.setTimeout(() => setMinimumGrowShown(true), 3150)
    const t5 = window.setTimeout(() => setPhase('handoff'), 4600)
    return () => {
      window.clearTimeout(t1)
      window.clearTimeout(t2)
      window.clearTimeout(t3)
      window.clearTimeout(t4)
      window.clearTimeout(t5)
    }
  }, [onPrepare, renewal])

  useEffect(() => {
    if (readyToExit && minimumGrowShown && phase === 'grow') {
      setPhase('handoff')
    }
  }, [minimumGrowShown, phase, readyToExit])

  // 每个字母的飞散轨迹
  const letters = useMemo(() => {
    const all = chars.length > 0 ? chars : []
    return all.map((ch, i) => {
      const a = Math.random() * Math.PI * 2
      const d = 90 + Math.random() * 130
      return {
        ch,
        key: i,
        x: Math.cos(a) * d,
        y: Math.sin(a) * d - 40,
        rot: (Math.random() - 0.5) * 70,
        delay: i * 0.02,
      }
    })
  }, [chars])

  return (
    <motion.div
      className="absolute inset-0 z-40 flex flex-col overflow-hidden bg-gradient-to-b from-[#3b82f6] via-[#60a5fa] to-[#bfdbfe]"
      animate={{ opacity: phase === 'handoff' ? 0 : 1 }}
      transition={{ duration: 0.52, ease: [0.22, 1, 0.36, 1] }}
      onAnimationComplete={() => {
        if (phase === 'handoff') onDone()
      }}
    >
      {/* 3D 蒲公英：字母聚成 */}
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0, scale: 0.5, filter: 'blur(12px)' }}
        animate={
          phase === 'grow' || phase === 'handoff'
            ? { opacity: 1, scale: 1, filter: 'blur(0px)' }
            : { opacity: 0, scale: 0.5, filter: 'blur(12px)' }
        }
        transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="pointer-events-none h-full w-full">
          <LetterSphere3D spec={spec} chars={chars} />
        </div>
      </motion.div>

      {/* 标签 chips */}
      <AnimatePresence>
        {!renewal && phase === 'chips' && (
          <motion.div
            className="absolute inset-0 z-10 flex flex-wrap items-center justify-center gap-2.5 px-10"
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
          >
            {tags.map((t, i) => (
              <motion.span
                key={t}
                initial={{ opacity: 0, y: 14, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: i * 0.16, duration: 0.4 }}
                className="font-mono2 rounded-full border border-white/50 bg-white/15 px-4 py-2 text-[12px] uppercase tracking-[0.2em] text-white backdrop-blur-md"
              >
                {zh ? (TAG_LABEL_ZH[t] ?? t) : t}
              </motion.span>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 碎成字母飞散 */}
      {!renewal && phase !== 'chips' && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
          {letters.map((l) => (
            <motion.span
              key={l.key}
              className="absolute font-mono2 text-[15px] font-medium text-white"
              initial={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
              animate={{ x: l.x, y: l.y, rotate: l.rot, opacity: 0 }}
              transition={{ duration: 1.3, delay: l.delay, ease: 'easeOut' }}
            >
              {l.ch}
            </motion.span>
          ))}
        </div>
      )}

      {/* 说明文字 */}
      <motion.div
        className="absolute inset-x-0 bottom-[12%] z-10 text-center"
        initial={{ opacity: 0, y: 10 }}
        animate={{
          opacity: phase === 'grow' ? 1 : 0,
          y: phase === 'grow' ? 0 : 8,
        }}
        transition={{ delay: 0.5, duration: 0.6 }}
      >
        <p className="text-[15px] font-semibold tracking-tight text-white">
          {renewal
            ? (zh ? '新的声音，长成了新的蒲公英。' : 'A new voice became a new dandelion.')
            : (zh ? '你的声音，长成了蒲公英。' : 'Your voice became a dandelion.')}
        </p>
        <p className="mt-1.5 text-[10px] text-white/62">
          {zh ? '现在，把它交给风。' : 'Now, leave it to the wind.'}
        </p>
      </motion.div>
    </motion.div>
  )
}
