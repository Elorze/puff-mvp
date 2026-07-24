import type { Letter } from '@/types'
import FloatingSeed from '@/components/FloatingSeed'
import AmbientSky from '@/components/AmbientSky'
import { useLanguage } from '@/i18n'

interface Props {
  letters: Letter[]
  onCatch: (letter: Letter) => void
}

const SEED_POSITIONS = [
  { top: '26%', delay: 0, duration: 19 },
  { top: '48%', delay: 1.2, duration: 23 },
  { top: '66%', delay: 2.4, duration: 17 },
]

/** 02 CATCH — catch seeds drifting in from far away */
export default function Receive({ letters, onCatch }: Props) {
  const { language } = useLanguage()
  const zh = language === 'zh'
  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-[#fff0e8]">
      <AmbientSky tone="coral" />
      <div className="relative z-20 px-6 pt-12">
        <h2 className="max-w-[230px] text-[22px] font-medium leading-[1.18] text-white drop-shadow-sm">
          {letters.length > 0 ? (zh ? `今天，有 ${letters.length} 颗种子经过这里。` : `${letters.length} seeds are passing by today.`) : (zh ? '今天的风已经走远。' : "Today's wind has moved on.")}
        </h2>
        <p className="mt-2 text-[13px] font-normal leading-[1.55] text-white/72">
          {letters.length > 0 ? (zh ? '轻轻接住一颗，听听是谁把声音交给了风。' : 'Catch one gently and hear the voice the wind carried here.') : (zh ? '不必追赶。明天还会有新的种子经过。' : "There is nothing to chase. Come back with tomorrow's breeze.")}
        </p>
      </div>

      {/* 淡淡的地平线 */}
      <div className="pointer-events-none absolute inset-x-6 top-[30%] border-t border-white/25" />

      <div className="relative min-h-0 flex-1">
        {letters.map((letter, i) => (
          <FloatingSeed
            key={letter.id}
            top={SEED_POSITIONS[i % SEED_POSITIONS.length].top}
            delay={SEED_POSITIONS[i % SEED_POSITIONS.length].delay}
            duration={SEED_POSITIONS[i % SEED_POSITIONS.length].duration}
            variant={i + 1}
            onCatch={() => onCatch(letter)}
          />
        ))}

      </div>
    </div>
  )
}
