import { motion } from 'framer-motion'
import type { DandelionSpec } from '@/lib/dandelion'
import type { Connection, JournalReceipt, SentDandelion } from '@/types'
import { useLanguage } from '@/i18n'
import { DEFAULT_WORDS, DEFAULT_WORDS_ZH } from '@/data/content'
import AmbientSky from '@/components/AmbientSky'

interface Props {
  displayName: string
  words: string
  tags: string[]
  spec: DandelionSpec
  sent: SentDandelion[]
  receipts: JournalReceipt[]
  connections: Connection[]
  onReset: () => void
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between px-5 py-4">
      <span className="font-mono2 text-[10px] uppercase tracking-[0.2em] text-foreground/55">{k}</span>
      <span className="font-mono2 text-[10px] uppercase tracking-[0.15em]">{v}</span>
    </div>
  )
}

/** 04 YOU — deliberately blank: no avatar wall, no stats, no labels */
export default function Me({ displayName, words, tags, sent, receipts, connections, onReset }: Props) {
  const { language } = useLanguage()
  const zh = language === 'zh'
  const displayWords = zh && words === DEFAULT_WORDS ? DEFAULT_WORDS_ZH : words
  return (
    <div className="relative h-full overflow-hidden bg-[#f2efff]">
      <AmbientSky tone="violet" />
      <div className="relative z-10 h-full overflow-y-auto px-5 pb-24 pt-12 no-scrollbar">
      <h2 className="max-w-[230px] text-[22px] font-semibold leading-[1.14] text-[#132340]">
        {displayName
          ? (zh ? `${displayName}，你由自己留下的声音构成。` : `${displayName}, in the voice you chose to leave.`)
          : (zh ? '你由自己留下的声音构成。' : 'You are the voice you chose to leave.')}
      </h2>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="spec-card mt-5 p-5">
        <div className="flex items-baseline justify-between">
          <p className="font-mono2 text-[9px] uppercase tracking-[0.25em] text-foreground/45">{zh ? '我交给风的声音' : 'the voice I gave the wind'}</p>
          <span className="font-mono2 text-[9px] uppercase tracking-[0.15em] text-foreground/35">{zh ? '第一株' : 'first bloom'}</span>
        </div>
        <p className="mt-3 text-[13.5px] leading-[1.95] text-foreground/85">
          {displayWords || (zh ? '一段声音已经交给风。这里不展示标签，也不把你改写成一行简介。' : 'A voice has been given to the wind. No labels are shown here, and you are never reduced to a bio.')}
        </p>
        <p className="font-mono2 mt-3 border-t border-border/15 pt-3 text-[9px] uppercase tracking-[0.15em] text-foreground/40">
          {zh ? '下一次表达，只从你认真接住的种子里长出来' : 'the next chance to speak grows only from a seed you choose to keep'}
        </p>
      </motion.div>

      <div className="spec-card mt-3 divide-y divide-border/10">
        <Row k={zh ? '个人标签' : 'markers'} v={tags.length > 0 ? (zh ? '从不展示' : 'never shown') : '—'} />
        <Row k={zh ? '加入天数' : 'days here'} v="001" />
        <Row k={zh ? '吹出的蒲公英' : 'blooms sent'} v={String(sent.length).padStart(3, '0')} />
        <Row k={zh ? '建立的联系' : 'quiet bonds'} v={String(connections.length).padStart(3, '0')} />
        <Row k={zh ? '关注 / 点赞' : 'followers / likes'} v={zh ? '刻意不设置' : 'n/a — by design'} />
      </div>

      <div className="mt-6">
        <div className="flex items-baseline justify-between">
          <p className="font-mono2 text-[10px] uppercase tracking-[0.25em] text-foreground/55">{zh ? '风送回的手帐' : 'wind receipts'}</p>
          <span className="font-mono2 text-[9px] uppercase tracking-[0.15em] text-foreground/45">{zh ? `保留 ${receipts.length} 张` : `${receipts.length} kept`}</span>
        </div>
        {receipts.length > 0 ? (
          <div className="mt-3 space-y-3">
            {receipts.map((receipt) => (
              <motion.article
                key={receipt.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mx-auto w-[94%] rotate-[-0.5deg] bg-[#fffdf5] px-5 py-5 text-[#27251f] shadow-[0_14px_30px_-16px_rgba(55,40,80,0.45)]"
                style={{ borderRadius: '4px 4px 12px 12px' }}
              >
                <div className="border-b border-dashed border-stone-300 pb-3 text-center">
                  <p className="font-mono2 text-[9px] uppercase tracking-[0.28em] text-stone-500">{zh ? 'PUFF* 每日小票' : 'puff* daily receipt'}</p>
                  <p className="mt-2 text-[16px] font-semibold">{zh ? '风把这一天送了回来' : receipt.title}</p>
                </div>
                <p className="mt-4 text-[12.5px] leading-[1.9] text-stone-700">
                  {zh && receipt.summary === DEFAULT_WORDS ? DEFAULT_WORDS_ZH : receipt.summary}
                </p>
                <div className="font-mono2 mt-4 flex justify-between border-t border-dashed border-stone-300 pt-3 text-[8px] uppercase tracking-[0.15em] text-stone-400">
                  <span>{zh ? '由自然风送回' : 'returned by natural wind'}</span>
                  <span>{new Date(receipt.createdAt).toLocaleDateString(zh ? 'zh-CN' : 'en-US')}</span>
                </div>
              </motion.article>
            ))}
          </div>
        ) : (
          <div className="spec-card-dash mt-3 px-5 py-5">
            <p className="text-[11.5px] leading-[1.9] text-foreground/50">
              {zh
                ? '后来成熟的蒲公英，如果 24 小时里没有被吹向别人，就会被风送回这里，成为一张只属于你的手帐。第一株会一直等你亲自吹散。'
                : 'If a later dandelion is not sent within 24 hours, the wind returns it here as a private journal receipt. The first bloom always waits for your breath.'}
            </p>
          </div>
        )}
      </div>

      <div className="spec-card-dash mt-3 px-5 py-5">
        <p className="text-[12px] leading-[2] text-foreground/55">
          {zh ? <>没有粉丝数，没有点赞，也没有学历和头衔。<br />认识一个人，应该从一段真实的声音开始，<br />而不是一张写满标签的名片。</> : <>No follower counts. No likes. No degrees or titles.<br />Knowing someone should begin with a true voice —<br />not a card crowded with labels.</>}
        </p>
      </div>

      <p className="font-mono2 mt-6 text-center text-[9px] uppercase tracking-[0.3em] text-foreground/30">
        {zh ? 'puff* — 让真实随风抵达' : 'puff* — something true, carried by wind'}
      </p>
      <button
        onClick={onReset}
        className="font-mono2 mt-4 w-full py-2 text-[9px] uppercase tracking-[0.18em] text-foreground/35 underline underline-offset-4"
      >
        {zh ? '重置演示' : 'reset prototype'}
      </button>
      </div>
    </div>
  )
}
