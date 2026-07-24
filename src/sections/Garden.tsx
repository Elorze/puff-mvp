import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Connection, PlantedSeed } from '@/types'
import { useLanguage } from '@/i18n'
import GrowingDandelion from '@/components/GrowingDandelion'
import VoiceNote from '@/components/VoiceNote'
import AmbientSky from '@/components/AmbientSky'

interface Props {
  planted: PlantedSeed[]
  connections: Connection[]
  virtualNow: number
  windowsillOccupied: boolean
  onHarvest: (id: string) => void
}

/** 03 PLOT — seeds ripen slowly; ripe ones become new dandelions */
export default function Garden({
  planted,
  connections,
  virtualNow,
  windowsillOccupied,
  onHarvest,
}: Props) {
  const { language } = useLanguage()
  const zh = language === 'zh'
  const [transitioningId, setTransitioningId] = useState<string | null>(null)
  const launchedRef = useRef(new Set<string>())
  const onHarvestRef = useRef(onHarvest)
  const matureSeed = planted.find((seed) => seed.stage === 'mature') ?? null

  useEffect(() => {
    onHarvestRef.current = onHarvest
  }, [onHarvest])

  useEffect(() => {
    if (!matureSeed || windowsillOccupied || launchedRef.current.has(matureSeed.id)) return
    launchedRef.current.add(matureSeed.id)
    setTransitioningId(matureSeed.id)
    const timer = window.setTimeout(() => onHarvestRef.current(matureSeed.id), 980)
    return () => window.clearTimeout(timer)
  }, [matureSeed?.id, windowsillOccupied])

  return (
    <div className="relative h-full overflow-hidden bg-[#eafff7]">
      <AmbientSky tone="mint" />
      <div className="relative z-10 h-full overflow-y-auto px-5 pb-24 pt-12 no-scrollbar">
      <h2 className="text-[22px] font-semibold tracking-tight text-[#132340]">{zh ? '花圃' : 'Garden'}</h2>

      <div className="mt-4 space-y-3">
        {planted.map((p, idx) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.07 }}
            className="spec-card p-5"
          >
            <GrowingDandelion progress={p.progress} seedKey={p.id} />

            <div className="track mt-3 rounded-full">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.round(p.progress * 100)}%` }}
                transition={{ duration: 0.7, delay: 0.15 }}
              />
            </div>

            <div className="mt-4">
              <VoiceNote duration={p.letter.audioSeconds ?? 12} src={p.letter.audioUrl} compact />
            </div>

            {p.stage === 'mature' ? (
              <div className="mt-4 flex min-h-10 items-center justify-center text-center">
                <p className="max-w-[260px] text-[11px] leading-relaxed text-foreground/48">
                  {windowsillOccupied
                    ? (zh ? '风还停在窗台上。它会在这里安静等候。' : 'The wind is still at the windowsill. This one will wait quietly.')
                    : (zh ? '成熟了。正在为新的声音腾出空间。' : 'It is ready. Making room for a new voice.')}
                </p>
              </div>
            ) : (
              <div className="mt-3.5 flex items-center justify-between text-[10px] text-foreground/44">
                <span>{zh ? '测试生长 · 1 分钟' : 'Test growth · 1 minute'}</span>
                <span className="tabular-nums">
                  {Math.max(
                    0,
                    Math.ceil(
                      p.maturesAt
                        ? (p.maturesAt - virtualNow) / 1000
                        : (1 - p.progress) * 60,
                    ),
                  )}
                  s
                </span>
              </div>
            )}
          </motion.div>
        ))}

        {planted.length === 0 && (
          <div className="spec-card px-6 py-10 text-center">
            <p className="text-[13px] font-medium text-foreground/65">{zh ? '花圃还在等待。' : 'The garden is waiting.'}</p>
            <p className="mt-4 text-[12.5px] leading-[1.9] text-foreground/55">
              {zh ? '接住一颗愿意留下的种子，它会在这里安静生长。' : 'Keep a seed, and it will begin its quiet growth here.'}
            </p>
          </div>
        )}
      </div>

      {/* bonds */}
      <div className="mt-8">
        <p className="font-mono2 text-[10px] uppercase tracking-[0.3em] text-foreground/55">{zh ? '已经建立的联系' : 'bonds that grew'}</p>
        {connections.length > 0 ? (
          <div className="mt-3 space-y-2">
            {connections.map((connection) => (
              <div key={connection.id} className="spec-card-dash px-5 py-4">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] text-foreground/50">{zh ? `${connection.senderName} 的种子` : `A seed from ${connection.senderName}`}</p>
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                </div>
                <p className="mt-2 line-clamp-2 text-[11.5px] leading-relaxed text-foreground/60">
                  {zh ? '一段声音，打开了一条安静的联系' : 'A voice opened a quiet line between you'}
                </p>
                <p className="font-mono2 mt-2 text-[9px] uppercase tracking-[0.12em] text-foreground/40">
                  {zh ? `已建立 · ${connection.distanceKm.toLocaleString()} 公里外` : `open · ${connection.distanceKm.toLocaleString()} km away`}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="spec-card-dash mt-3 px-6 py-8 text-center">
            <p className="text-[12px] leading-[2] text-foreground/50">
              {zh ? <>当你让一颗种子留下，<br />一条安静的联系会打开。<br />正式体验需要 24 小时，测试压缩为 1 分钟。</> : <>Let a seed stay, and a quiet line opens.<br />The full ritual takes 24 hours;<br />this test compresses it to one minute.</>}
            </p>
          </div>
        )}
      </div>
      </div>

      <AnimatePresence>
        {transitioningId && (
          <motion.div
            className="absolute inset-0 z-[75] flex items-center justify-center overflow-hidden"
            style={{ background: '#071d27' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className="absolute inset-0 bg-[radial-gradient(circle_at_50%_48%,rgba(87,246,205,.16),transparent_32%),radial-gradient(circle_at_28%_72%,rgba(80,151,255,.12),transparent_42%),radial-gradient(circle_at_74%_70%,rgba(153,105,255,.1),transparent_40%)]"
              initial={{ opacity: 0.25, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1.08 }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            />
            <motion.div
              className="relative h-[430px] w-[330px]"
              initial={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
              animate={{ scale: 0.055, opacity: 0.18, filter: 'blur(10px)' }}
              transition={{ duration: 0.9, ease: [0.76, 0, 0.24, 1] }}
            >
              <GrowingDandelion
                progress={1}
                seedKey={transitioningId}
                transparent
                className="!h-full !rounded-none"
              />
            </motion.div>
            <motion.span
              className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#d7fff1] shadow-[0_0_18px_5px_rgba(123,255,218,.7),0_0_48px_16px_rgba(91,194,255,.32)]"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1.4, 1], opacity: [0, 1, 1] }}
              transition={{ delay: 0.5, duration: 0.42, ease: 'easeOut' }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
