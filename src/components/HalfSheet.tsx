import { useEffect, useId, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  children: ReactNode
  footer?: ReactNode
  heightClassName?: string
  closeLabel?: string
  tone?: 'blue' | 'orange' | 'mint' | 'teal' | 'violet'
}

/**
 * PUFF 的统一弹层：所有需要用户停下来完成的操作，
 * 都从屏幕底部升起为一张约半屏高的圆角卡片。
 */
export default function HalfSheet({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  heightClassName = 'h-[56%] min-h-[360px] max-h-[620px]',
  closeLabel = 'Close',
  tone = 'blue',
}: Props) {
  const titleId = useId()
  const toneStyles = {
    blue: {
      overlay: 'bg-[#02071b]/58',
      surface: 'bg-[linear-gradient(150deg,rgba(68,170,255,.98),rgba(35,102,232,.98)_50%,rgba(19,58,159,.99))] shadow-[0_-18px_70px_rgba(0,20,85,.35),inset_0_1px_0_rgba(255,255,255,.3)]',
      footer: 'bg-[linear-gradient(180deg,rgba(18,64,171,0),rgba(10,42,132,.34)_32%)]',
    },
    orange: {
      overlay: 'bg-[#281319]/52',
      surface: 'bg-[radial-gradient(circle_at_12%_8%,rgba(255,220,198,.28),transparent_34%),radial-gradient(circle_at_92%_42%,rgba(218,124,105,.24),transparent_44%),linear-gradient(150deg,rgba(199,132,113,.97),rgba(157,83,76,.98)_52%,rgba(91,48,58,.99))] shadow-[0_-18px_70px_rgba(70,30,38,.38),inset_0_1px_0_rgba(255,242,232,.28)]',
      footer: 'bg-[linear-gradient(180deg,rgba(94,48,56,0),rgba(63,31,42,.34)_32%)]',
    },
    mint: {
      overlay: 'bg-[#042c2a]/46',
      surface: 'bg-[linear-gradient(150deg,rgba(83,230,194,.98),rgba(24,184,157,.98)_50%,rgba(8,111,111,.99))] shadow-[0_-18px_70px_rgba(1,75,69,.32),inset_0_1px_0_rgba(255,255,255,.36)]',
      footer: 'bg-[linear-gradient(180deg,rgba(5,123,109,0),rgba(3,93,89,.3)_32%)]',
    },
    teal: {
      overlay: 'bg-[#011519]/62',
      surface: 'bg-[linear-gradient(150deg,rgba(36,191,174,.98),rgba(12,112,118,.99)_48%,rgba(4,45,62,.99))] shadow-[0_-18px_70px_rgba(0,29,37,.46),inset_0_1px_0_rgba(255,255,255,.28)]',
      footer: 'bg-[linear-gradient(180deg,rgba(4,68,75,0),rgba(2,37,50,.42)_32%)]',
    },
    violet: {
      overlay: 'bg-[#160b35]/52',
      surface: 'bg-[linear-gradient(150deg,rgba(186,151,255,.98),rgba(125,84,225,.98)_50%,rgba(68,42,151,.99))] shadow-[0_-18px_70px_rgba(49,24,110,.38),inset_0_1px_0_rgba(255,255,255,.34)]',
      footer: 'bg-[linear-gradient(180deg,rgba(91,54,178,0),rgba(56,31,130,.34)_32%)]',
    },
  } as const
  const toneStyle = toneStyles[tone]
  const overlayClass = toneStyle.overlay
  const surfaceClass = toneStyle.surface
  const footerClass = toneStyle.footer

  useEffect(() => {
    if (!open) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose, open])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className={`absolute inset-0 z-[80] flex items-end ${overlayClass} backdrop-blur-[7px]`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) onClose()
          }}
        >
          <motion.section
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            initial={{ y: '105%', scale: 0.98 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: '105%', scale: 0.98 }}
            transition={{ type: 'spring', damping: 30, stiffness: 320, mass: 0.9 }}
            className={`${heightClassName} ${surfaceClass} liquid-sheet relative flex w-full flex-col overflow-hidden rounded-t-[38px] border-x-0 border-b-0 border-t text-white`}
          >
            <div className="mx-auto mt-2.5 h-1 w-11 shrink-0 rounded-full bg-white/40" />

            <header className="flex shrink-0 items-start gap-4 px-6 pb-4 pt-4">
              <div className="min-w-0 flex-1">
                <h3 id={titleId} className="text-[20px] font-semibold leading-tight">
                  {title}
                </h3>
                {subtitle && <p className="mt-1 text-[11px] leading-relaxed text-white/62">{subtitle}</p>}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label={closeLabel}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/20 bg-white/10 text-white/72 transition active:scale-95 active:bg-white/20"
              >
                <X className="h-4 w-4" />
              </button>
            </header>

            <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-5 pb-4">{children}</div>

            {footer && (
              <footer className={`${footerClass} shrink-0 px-5 pb-5 pt-3`}>
                {footer}
              </footer>
            )}
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
