import { motion } from 'framer-motion'

interface Props {
  onStart: () => void
}

export default function Onboarding({ onStart }: Props) {
  return (
    <button
      type="button"
      onClick={onStart}
      aria-label="进入 PUFF"
      className="group relative grid h-full w-full place-items-center overflow-hidden bg-[linear-gradient(145deg,#6be7ff_0%,#548cff_42%,#3849d8_100%)] text-white"
    >
      <video
        className="absolute inset-0 h-full w-full scale-[1.02] object-cover opacity-90 mix-blend-luminosity"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden
      >
        <source src="/media/puff-opening.mp4" type="video/mp4" />
      </video>

      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(155deg, rgba(94,229,255,.34) 0%, rgba(65,126,255,.16) 44%, rgba(41,46,170,.48) 100%)',
          mixBlendMode: 'color',
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,transparent_18%,rgba(8,17,80,.1)_70%,rgba(4,10,48,.32)_100%)]" />

      <motion.span
        initial={{ opacity: 0, scale: 0.92, filter: 'blur(8px)' }}
        animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
        transition={{ duration: 1.35, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 text-[42px] font-semibold leading-none"
      >
        PUFF*
      </motion.span>
    </button>
  )
}
