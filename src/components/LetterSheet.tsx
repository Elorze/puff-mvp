import type { Letter } from '@/types'
import { useLanguage } from '@/i18n'
import VoiceNote from '@/components/VoiceNote'
import HalfSheet from '@/components/HalfSheet'

interface Props {
  letter: Letter | null
  onClose: () => void
  onPlant: (letter: Letter) => void
  onRelease: (letter: Letter) => void
}

function SpecRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="font-mono2 text-[10px] text-white/50">{k}</span>
      <span className="font-mono2 text-[11px] text-white/90">{v}</span>
    </div>
  )
}

/** 来信详情：遵循全局半屏卡片弹层规范 */
export default function LetterSheet({ letter, onClose, onPlant, onRelease }: Props) {
  const { language } = useLanguage()
  const zh = language === 'zh'
  return (
    <HalfSheet
      open={Boolean(letter)}
      onClose={onClose}
      title={letter ? (zh ? `${letter.senderName} 的蒲公英` : `A dandelion from ${letter.senderName}`) : (zh ? '一株路过的蒲公英' : 'A passing dandelion')}
      subtitle={zh ? '标签散去以后，只留下昵称与声音' : 'After the labels scatter, only a name and a voice remain'}
      closeLabel={zh ? '关闭' : 'Close'}
      tone="orange"
      heightClassName="h-[62%] min-h-[410px] max-h-[660px]"
      footer={letter ? (
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => onPlant(letter)}
            className="beam-control relative w-full overflow-hidden rounded-[22px] border border-white/14 bg-[linear-gradient(112deg,rgba(255,232,218,.12),rgba(91,47,57,.22)_48%,rgba(219,154,132,.1))] py-3.5 text-[13px] font-semibold text-white shadow-[inset_8px_10px_20px_-18px_rgba(255,255,255,.6),inset_-10px_-12px_22px_-20px_rgba(63,28,38,.48),0_12px_30px_rgba(55,22,31,.18)] backdrop-blur-2xl transition active:scale-[0.98]"
          >
            <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(255,244,235,.2),transparent_36%),radial-gradient(circle_at_82%_115%,rgba(223,151,132,.18),transparent_42%)]" />
            <span className="relative">{zh ? '接受种子并建立联系' : 'Accept seed and open a bond'}</span>
          </button>
          <button
            type="button"
            onClick={() => onRelease(letter)}
            className="w-full py-1.5 text-[11px] text-white/66 transition active:text-white"
          >
            {zh ? '放回风中' : 'Back to the wind'}
          </button>
        </div>
      ) : undefined}
    >
      {letter && (
        <>
          <div className="space-y-2 border-y border-white/15 py-3">
            <SpecRow k={zh ? '个人标签' : 'Markers'} v={zh ? '不向任何人展示' : 'Never shown'} />
            <SpecRow
              k={zh ? '来自' : 'From'}
              v={zh ? `${letter.distanceKm.toLocaleString()} 公里外` : `${letter.distanceKm.toLocaleString()} km away`}
            />
            <SpecRow
              k={zh ? '漂流时间' : 'In transit'}
              v={zh ? `${letter.daysTraveling} 天` : `${letter.daysTraveling} days`}
            />
          </div>

          <div className="liquid-panel mt-4 rounded-[24px] !border-white/10 !bg-[linear-gradient(150deg,rgba(255,244,237,.09),rgba(70,31,41,.13)_55%,rgba(255,221,205,.05))] px-4 py-4 !shadow-[inset_8px_10px_22px_-20px_rgba(255,250,246,.56),inset_-10px_-12px_24px_-22px_rgba(59,27,39,.48),0_16px_34px_-22px_rgba(49,20,29,.48)]">
            <p className="font-mono2 mb-3 text-[10px] text-white/58">
              {zh ? '对方留下了一段语音' : 'A voice note arrived'}
            </p>
            <VoiceNote duration={letter.audioSeconds ?? 12} src={letter.audioUrl} light accent="orange" />
            <p className="font-mono2 mt-3 text-center text-[9px] text-white/42">
              {zh ? '一次录制 · 没有文字转录' : 'One take · no transcript'}
            </p>
          </div>

          <p className="mt-4 text-[11px] leading-relaxed text-white/58">
            {zh
              ? '标签已经在风里散去。此刻你不知道对方是谁；请先听完这段声音，再决定是否让这颗种子留下。'
              : 'Their labels have dissolved into the wind. You know only this voice; hear it through, then decide whether to let the seed stay.'}
          </p>
        </>
      )}
    </HalfSheet>
  )
}
