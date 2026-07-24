import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, Search } from 'lucide-react'
import type { Connection } from '@/types'
import VoiceNote from '@/components/VoiceNote'
import { DandelionIcon } from '@/components/Icons'
import { useLanguage } from '@/i18n'

interface Props {
  connections: Connection[]
  onDiscover: () => void
}

const AVATAR_GRADIENTS = [
  'from-[#9cf6dd] via-[#48d5be] to-[#177f78]',
  'from-[#b9ddff] via-[#68a8ed] to-[#3858aa]',
  'from-[#dbd0ff] via-[#a996ef] to-[#6651ae]',
  'from-[#f5d9b3] via-[#e6a56f] to-[#9b6250]',
]

function FlowingMintBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden bg-[#061f25]" aria-hidden>
      <motion.div
        className="absolute -left-28 -top-28 h-[390px] w-[420px] rounded-[46%_54%_63%_37%/54%_42%_58%_46%] bg-[radial-gradient(circle_at_60%_58%,#82f8de_0%,#24c7b5_42%,#174d66_72%,transparent_82%)] blur-[24px]"
        animate={{ x: [0, 88, 22, 0], y: [0, 52, 142, 0], rotate: [0, 96, 224, 360], scale: [1, 1.14, 0.9, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -right-40 top-[6%] h-[360px] w-[410px] rounded-[62%_38%_42%_58%/42%_61%_39%_58%] bg-[radial-gradient(circle_at_40%_48%,#8fcfff_0%,#497ed5_42%,#544690_70%,transparent_82%)] opacity-90 blur-[28px]"
        animate={{ x: [0, -104, -24, 0], y: [0, 92, 188, 0], rotate: [0, -112, -236, -360], scale: [0.92, 1.12, 0.88, 0.92] }}
        transition={{ duration: 13, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -bottom-44 -left-36 h-[410px] w-[440px] rounded-[42%_58%_54%_46%/62%_42%_58%_38%] bg-[radial-gradient(circle_at_60%_38%,#66e6c8_0%,#168d8a_46%,#082e3b_76%,transparent_84%)] opacity-80 blur-[26px]"
        animate={{ x: [0, 116, 34, 0], y: [0, -76, -168, 0], rotate: [0, 126, 258, 360], scale: [1.06, 0.9, 1.16, 1.06] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,25,34,.04)_0%,rgba(3,17,23,.72)_54%,rgba(2,12,17,.96)_100%)]" />
    </div>
  )
}

function VoiceAvatar({ index, active = false, size = 'md' }: { index: number; active?: boolean; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass = size === 'lg' ? 'h-16 w-16' : size === 'sm' ? 'h-12 w-12' : 'h-14 w-14'
  return (
    <div className={`relative shrink-0 rounded-full bg-gradient-to-br ${AVATAR_GRADIENTS[index % AVATAR_GRADIENTS.length]} p-[2px] shadow-[0_10px_26px_rgba(0,20,24,.26)] ${sizeClass}`}>
      <div className="flex h-full w-full items-center justify-center rounded-full border border-white/40 bg-white/12 text-white backdrop-blur-md">
        <DandelionIcon className={size === 'lg' ? 'h-8 w-8' : 'h-6 w-6'} />
      </div>
      {active && <span className="absolute bottom-0.5 right-0.5 h-3 w-3 rounded-full border-2 border-[#071a1e] bg-[#68f4c4]" />}
    </div>
  )
}

export default function Chat({ connections, onDiscover }: Props) {
  const { language } = useLanguage()
  const zh = language === 'zh'
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [replyState, setReplyState] = useState<'idle' | 'recording' | 'sent'>('idle')
  const [query, setQuery] = useState('')

  const selected = useMemo(
    () => connections.find((connection) => connection.id === selectedId) ?? null,
    [connections, selectedId],
  )
  const visibleConnections = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return connections
    return connections.filter((connection) => {
      return `${connection.senderName} ${connection.openingLine} ${connection.openingLineZh ?? ''}`.toLowerCase().includes(normalized)
    })
  }, [connections, query, zh])

  const openConversation = (connection: Connection) => {
    setSelectedId(connection.id)
    setReplyState('idle')
  }

  return (
    <div className="relative h-full overflow-hidden text-white">
      <FlowingMintBackground />
      <AnimatePresence mode="wait" initial={false}>
        {!selected ? (
          <motion.section
            key="conversation-list"
            initial={{ opacity: 0, x: -14 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.24 }}
            className="relative z-10 flex h-full flex-col px-5 pb-24 pt-12"
          >
            <h2 className="max-w-[280px] text-[28px] font-semibold leading-[1.08]">
              {zh ? '让声音慢慢靠近。' : 'Let voices find their way back.'}
            </h2>

            <label className="glass-pill mt-5 flex h-11 items-center gap-2 rounded-full px-4 text-white/75">
              <Search className="h-4 w-4 shrink-0" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={zh ? '搜索声音' : 'Search'}
                className="min-w-0 flex-1 bg-transparent text-[13px] text-white outline-none placeholder:text-white/48"
              />
            </label>

            <div className="no-scrollbar mt-5 flex shrink-0 gap-4 overflow-x-auto pb-3">
              <button type="button" onClick={onDiscover} className="flex w-16 shrink-0 flex-col items-center gap-2">
                <span className="flex h-14 w-14 items-center justify-center rounded-full border border-white/40 bg-white/10 text-[25px] font-light text-white backdrop-blur-xl">+</span>
                <span className="text-[11px] text-white/65">{zh ? '接种子' : 'Discover'}</span>
              </button>
              {connections.map((connection, index) => (
                <button key={connection.id} type="button" onClick={() => openConversation(connection)} className="flex w-16 shrink-0 flex-col items-center gap-2">
                  <VoiceAvatar index={index} active />
                  <span className="w-full truncate text-[11px] text-white/80">{connection.senderName}</span>
                </button>
              ))}
            </div>

            <div className="no-scrollbar -mx-5 mt-1 min-h-0 flex-1 overflow-y-auto rounded-t-[30px] border-t border-white/14 bg-[#07191e]/72 px-5 pb-7 pt-5 backdrop-blur-2xl">
              <h3 className="text-[17px] font-semibold">{zh ? '对话' : 'Messages'}</h3>
              {visibleConnections.length > 0 ? (
                <div className="mt-3 divide-y divide-white/10">
                  {visibleConnections.map((connection) => {
                    const index = connections.findIndex((item) => item.id === connection.id)
                    const opening = zh ? (connection.openingLineZh ?? connection.openingLine) : connection.openingLine
                    return (
                      <button
                        key={connection.id}
                        type="button"
                        onClick={() => openConversation(connection)}
                        className="grid w-full grid-cols-[52px_1fr_auto] items-center gap-3 py-3.5 text-left active:opacity-70"
                      >
                        <VoiceAvatar index={index} active size="sm" />
                        <span className="min-w-0">
                          <strong className="block truncate text-[14px] font-semibold">{connection.senderName}</strong>
                          <span className="mt-1 block truncate text-[11px] text-white/50">{opening}</span>
                        </span>
                        <span className="text-[10px] text-white/38">
                          {new Date(connection.startedAt).toLocaleDateString(zh ? 'zh-CN' : 'en-US', { month: 'numeric', day: 'numeric' })}
                        </span>
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div className="flex h-[210px] flex-col items-center justify-center text-center">
                  <p className="text-[15px] font-medium text-white/78">{query ? (zh ? '没有找到相关声音' : 'No matching voices') : (zh ? '这里还没有声音停留。' : 'No voices are resting here yet.')}</p>
                  {!query && (
                    <button type="button" onClick={onDiscover} className="mt-4 rounded-full border border-white/25 bg-white/10 px-5 py-2.5 text-[12px] text-white/80">
                      {zh ? '去接住一颗种子' : 'Catch a seed'}
                    </button>
                  )}
                </div>
              )}
            </div>
          </motion.section>
        ) : (
          <motion.section
            key="conversation-detail"
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 18 }}
            transition={{ duration: 0.24 }}
            className="relative z-10 flex h-full flex-col px-5 pb-24 pt-11"
          >
            <header className="grid grid-cols-[44px_1fr_44px] items-center">
              <button
                type="button"
                onClick={() => setSelectedId(null)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 backdrop-blur-xl active:scale-95"
                aria-label={zh ? '返回对话列表' : 'Back to conversations'}
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="text-center">
                <p className="text-[14px] font-semibold">{selected.senderName}</p>
                <p className="mt-0.5 text-[10px] text-white/48">{zh ? `${selected.distanceKm.toLocaleString()} 公里外` : `${selected.distanceKm.toLocaleString()} km away`}</p>
              </div>
              <div />
            </header>

            <div className="liquid-panel no-scrollbar mt-5 flex min-h-0 flex-1 flex-col overflow-y-auto rounded-[30px] px-5 py-6">
              <div className="flex flex-col items-center">
                <VoiceAvatar index={connections.findIndex((item) => item.id === selected.id)} active size="lg" />
                <p className="mt-3 max-w-[250px] text-center text-[12px] leading-relaxed text-white/58">
                  {zh ? '一颗种子，让两段生活在这里相遇。' : 'A seed brought two distant lives to the same place.'}
                </p>
              </div>

              <div className="mt-7 max-w-[88%] self-start rounded-[26px] rounded-bl-[8px] bg-white/86 p-3 text-[#113339] shadow-lg">
                <VoiceNote duration={selected.audioSeconds ?? 12} src={selected.audioUrl} compact />
                <p className="px-2 pb-1 pt-2 text-[11px] leading-relaxed text-[#31575c]/65">
                  {zh ? (selected.openingLineZh ?? selected.openingLine) : selected.openingLine}
                </p>
              </div>

              <AnimatePresence>
                {replyState === 'sent' && (
                  <motion.div
                    initial={{ opacity: 0, x: 14 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="mt-5 max-w-[82%] self-end rounded-[26px] rounded-br-[8px] bg-[#7ee8d0]/90 p-3 text-[#0c4545] shadow-lg"
                  >
                    <VoiceNote duration={8} compact />
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="mt-auto pt-8">
                <button
                  type="button"
                  onClick={() => setReplyState((value) => value === 'recording' ? 'sent' : 'recording')}
                  className={`beam-control w-full rounded-full border py-3.5 text-[13px] font-medium text-white transition active:scale-[0.98] ${
                    replyState === 'recording'
                      ? 'border-white/75 bg-[linear-gradient(100deg,#11bfae,#75efd0,#20cbb7)] shadow-[inset_0_1px_0_rgba(255,255,255,.46),0_12px_28px_rgba(15,139,123,.3)]'
                      : 'border-white/25 bg-[#0f766e]/82 shadow-[inset_0_1px_0_rgba(255,255,255,.2)]'
                  }`}
                >
                  {replyState === 'recording'
                    ? (zh ? '发送语音' : 'Send voice')
                    : (zh ? '录制回复' : 'Record a reply')}
                </button>
                {replyState === 'recording' && (
                  <p className="mt-2 text-center text-[11px] text-white/52">{zh ? '正在录音，再次点击即可发送' : 'Recording. Tap again to send.'}</p>
                )}
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  )
}
