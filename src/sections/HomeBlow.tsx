import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Wind } from 'lucide-react'
import LetterSphere3D, { type LetterSphereHandle } from '@/components/LetterSphere3D'
import AmbientSky from '@/components/AmbientSky'
import type { DandelionSpec } from '@/lib/dandelion'
import type { PlantedSeed, ReadyDandelion } from '@/types'
import { useLanguage } from '@/i18n'
import { useMicrophoneLevel } from '@/hooks/useMicrophoneLevel'

interface Props {
  spec: DandelionSpec
  chars: string[]
  dandelion: ReadyDandelion | null
  displayName: string
  sentCount: number
  planted: PlantedSeed[]
  virtualNow: number
  onAllBlown: () => void
  onAdvanceTime: () => void
  onSceneReady?: () => void
}

function CardAurora({ secondary = false }: { secondary?: boolean }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <motion.div
        className={`absolute h-48 w-52 rounded-[46%_54%_62%_38%] blur-[20px] ${
          secondary ? '-left-12 -top-14 bg-sky-300/75' : '-right-10 -top-12 bg-pink-300/75'
        }`}
        animate={{ x: [0, secondary ? 102 : -96, 18, 0], y: [0, 72, 112, 0], rotate: [0, 108, 228, 360], scale: [1, 1.24, 0.86, 1] }}
        transition={{ duration: secondary ? 8 : 7, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className={`absolute h-44 w-56 rounded-[58%_42%_37%_63%] blur-[18px] ${
          secondary ? '-bottom-16 -right-10 bg-violet-300/70' : '-bottom-14 -left-10 bg-lime-200/80'
        }`}
        animate={{ x: [0, secondary ? -92 : 104, 12, 0], y: [0, -58, -96, 0], rotate: [0, -124, -252, -360], scale: [0.94, 1.2, 0.86, 0.94] }}
        transition={{ duration: secondary ? 9 : 8, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  )
}

/** 01 BLOW — the core ritual: scatter the dandelion, mail the words */
export default function HomeBlow({
  spec,
  chars,
  dandelion,
  displayName,
  sentCount,
  planted,
  onAllBlown,
  onAdvanceTime,
  onSceneReady,
}: Props) {
  const { language } = useLanguage()
  const zh = language === 'zh'
  const dandelionRef = useRef<LetterSphereHandle>(null)
  const lastBreathRef = useRef(0)
  const autoStartedForRef = useRef<string | null>(null)
  const [blowProgress, setBlowProgress] = useState(0)
  const { level, start: startMic, status: micStatus, stop: stopMic } = useMicrophoneLevel({
    onLevel: (strength) => {
      const now = performance.now()
      if (strength < 0.1 || now - lastBreathRef.current < 95) return
      lastBreathRef.current = now
      dandelionRef.current?.blow(strength)
    },
  })
  const nextSeed = [...planted].sort((a, b) => b.progress - a.progress)[0]

  useEffect(() => {
    if (!dandelion || autoStartedForRef.current === dandelion.id) return
    autoStartedForRef.current = dandelion.id
    setBlowProgress(0)
    void startMic()
  }, [dandelion, startMic])

  useEffect(() => {
    if (!dandelion && micStatus === 'active') stopMic()
  }, [dandelion, micStatus, stopMic])

  if (!dandelion) {
    return (
      <div className="relative flex h-full flex-col justify-center bg-[#eef4fb] px-5">
        <AmbientSky />
        <div className="relative z-10">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="spec-card relative overflow-hidden px-6 py-6 !backdrop-blur-xl">
          <CardAurora />
          <div className="relative z-10">
          <p className="text-[22px] font-semibold">
            {sentCount > 0 ? (zh ? '你的声音正在路上。' : 'Your voice is on its way.') : (zh ? '窗台暂时空着。' : 'The windowsill is resting.')}
          </p>
          <p className="mt-3 text-[12.5px] leading-[1.9] text-foreground/60">
            {sentCount > 0
              ? (zh ? '它化作 3–4 颗种子，正沿着相近的季节、时区与生活节奏，寻找愿意停下来听的人。' : 'It became three or four seeds, traveling toward someone whose season and rhythm may meet yours.')
              : (zh ? '下一株蒲公英不会凭空出现。它要从一颗被你接住、愿意留下的种子里慢慢长成。' : 'The next dandelion cannot appear on demand. It must grow from a seed you choose to keep.')}
          </p>
          {sentCount > 0 && (
            <p className="mt-4 border-t border-foreground/10 pt-3 text-[10px] leading-[1.75] text-foreground/48">
              {zh
                ? `风把你填下的标签全部吹散了——代词、年龄、职业与地区都没有被寄出。留下的身份信息只有昵称「${displayName}」；真正抵达对方的，是你的声音。`
                : `The wind scattered every label you entered—pronouns, age, occupation, and location were never sent. The only identity left is “${displayName}”; what truly arrives is your voice.`}
            </p>
          )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="spec-card relative mt-3 overflow-hidden px-6 py-5 !backdrop-blur-xl"
        >
          <CardAurora secondary />
          <div className="relative z-10">
          <p className="text-[17px] font-semibold text-foreground/80">{zh ? '下一株蒲公英' : 'Next dandelion'}</p>
          <div className="track mt-3 rounded-full">
            <motion.div initial={{ width: 0 }} animate={{ width: `${(nextSeed?.progress ?? 0) * 100}%` }} transition={{ duration: 0.6 }} />
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-foreground/50">
            {nextSeed?.stage === 'mature'
              ? (zh ? '花圃里有一颗种子已经成熟，正等你为它留下新的声音。' : 'A seed has matured in the garden. It is waiting for the voice you have today.')
              : nextSeed
              ? (zh ? '正式体验中，它会安静生长 24 小时；本次测试压缩为 1 分钟。成熟后，风才会再次来到窗台。' : 'In the full ritual it grows quietly for 24 hours; this test compresses the wait to one minute. When it matures, the wind returns.')
              : (zh ? '去接住一颗种子。先听完它的声音，再决定要不要让它留下。' : 'Catch a seed. Hear its voice before deciding whether to let it stay.')}
          </p>
          </div>
        </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex h-full flex-col bg-gradient-to-b from-[#3b82f6] via-[#60a5fa] to-[#bfdbfe]">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 px-6 pt-12">
        <p className="max-w-[235px] text-[22px] font-semibold leading-[1.16] text-white">
          {zh ? '蒲公英成熟了。' : <>Your dandelion<br />is ready.</>}
        </p>
      </div>

      <div className="min-h-0 flex-1">
        <LetterSphere3D
          ref={dandelionRef}
          spec={spec}
          chars={chars}
          onAllBlown={onAllBlown}
          onProgress={setBlowProgress}
          onReady={onSceneReady}
        />
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-[88px] z-10 flex flex-col items-center">
        <motion.button
          type="button"
          aria-label={
            micStatus === 'denied'
              ? (zh ? '重新允许吹气检测' : 'Retry breath detection')
              : micStatus === 'unsupported'
                ? (zh ? '模拟一阵风' : 'Simulate a gust')
                : (zh ? '对着蒲公英吹气' : 'Blow toward the dandelion')
          }
          onClick={() => {
            if (micStatus === 'denied') void startMic()
            if (micStatus === 'unsupported') dandelionRef.current?.gust()
          }}
          disabled={micStatus === 'requesting'}
          className="pointer-events-auto relative flex h-[62px] w-[238px] items-center gap-3 overflow-hidden rounded-[22px] bg-white/12 px-3.5 text-left text-white shadow-[inset_0_1px_0_rgba(255,255,255,.28),0_12px_30px_rgba(20,73,168,.16)] backdrop-blur-2xl disabled:opacity-60"
          animate={{
            scale: 1 + level * 0.025,
            filter: `drop-shadow(0 0 ${12 + level * 22}px rgba(224,248,255,${0.28 + level * 0.34}))`,
          }}
          transition={{ type: 'spring', stiffness: 260, damping: 18, mass: 0.5 }}
        >
          <motion.span
            className="relative grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/12"
            animate={{
              opacity: micStatus === 'active' ? 0.7 + level * 0.3 : 0.45,
              scale: micStatus === 'requesting' ? [0.86, 1.08, 0.86] : 1,
            }}
            transition={
              micStatus === 'requesting'
                ? { duration: 1.2, repeat: Infinity, ease: 'easeInOut' }
                : { duration: 0.12 }
            }
          >
            <Wind className="h-5 w-5" strokeWidth={1.55} />
          </motion.span>

          <span className="min-w-0 flex-1">
            <span className="flex items-center justify-between gap-2 text-[10px] text-white/78">
              <span>
                {micStatus === 'requesting'
                  ? (zh ? '正在感受风' : 'Feeling for wind')
                  : micStatus === 'denied'
                    ? (zh ? '轻触允许吹气' : 'Tap to enable breath')
                    : micStatus === 'unsupported'
                      ? (zh ? '轻触模拟一阵风' : 'Tap to simulate wind')
                      : level > 0.1
                        ? (zh ? '风正在经过' : 'The wind is moving')
                        : (zh ? '对着蒲公英轻轻吹气' : 'Blow softly')}
              </span>
              <span className="tabular-nums text-white/56">{Math.round(blowProgress * 100)}%</span>
            </span>
            <span className="mt-2 block h-[2px] overflow-hidden rounded-full bg-white/18">
              <motion.span
                className="block h-full rounded-full bg-white/82 shadow-[0_0_10px_rgba(255,255,255,.6)]"
                animate={{ width: `${Math.max(2, blowProgress * 100)}%` }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
              />
            </span>
          </span>
        </motion.button>

        {dandelion.origin === 'received-seed' && (
          <button
            onClick={onAdvanceTime}
            className="pointer-events-auto mt-1 text-[9px] text-white/58 underline decoration-white/30 underline-offset-4"
          >
            {zh ? '等待自然吹散（测试）' : 'Wait for natural wind (test)'}
          </button>
        )}
      </div>
    </div>
  )
}
