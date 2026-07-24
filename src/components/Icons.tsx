/** 手绘感的线性图标，统一 stroke 风格 */

export function DandelionIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className={className}>
      <line x1="12" y1="13" x2="12" y2="22" />
      <line x1="12" y1="8" x2="12" y2="3" />
      <line x1="12" y1="8" x2="7.5" y2="4.5" />
      <line x1="12" y1="8" x2="16.5" y2="4.5" />
      <line x1="12" y1="8" x2="5" y2="8" />
      <line x1="12" y1="8" x2="19" y2="8" />
      <line x1="12" y1="8" x2="7" y2="11.5" />
      <line x1="12" y1="8" x2="17" y2="11.5" />
      <circle cx="12" cy="8" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function SeedIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className={className}>
      <line x1="12" y1="16" x2="12" y2="9" />
      <line x1="12" y1="9" x2="7" y2="4.5" />
      <line x1="12" y1="9" x2="9.5" y2="3.5" />
      <line x1="12" y1="9" x2="12" y2="3" />
      <line x1="12" y1="9" x2="14.5" y2="3.5" />
      <line x1="12" y1="9" x2="17" y2="4.5" />
      <ellipse cx="12" cy="18.5" rx="2" ry="3" fill="currentColor" stroke="none" opacity="0.85" />
    </svg>
  )
}

export function SproutIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className={className}>
      <path d="M12 21v-8" />
      <path d="M12 13c0-3.5-3-5-6.5-5 0 3.5 3 5.5 6.5 5z" />
      <path d="M12 11c0-3 2.5-4.5 6-4.5 0 3.5-2.5 5-6 4.5z" />
      <path d="M5 21h14" opacity="0.5" />
    </svg>
  )
}

export function PersonIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className={className}>
      <circle cx="12" cy="8" r="3.4" />
      <path d="M5.5 20c1-3.6 3.6-5.2 6.5-5.2s5.5 1.6 6.5 5.2" />
    </svg>
  )
}

export function ChatIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M5.2 5.5h13.6a2.2 2.2 0 0 1 2.2 2.2v7.1a2.2 2.2 0 0 1-2.2 2.2h-7.3l-4.7 3.1.7-3.1H5.2A2.2 2.2 0 0 1 3 14.8V7.7a2.2 2.2 0 0 1 2.2-2.2z" />
      <path d="M7.5 10.1h9" opacity="0.7" />
      <path d="M7.5 13.2h5.8" opacity="0.45" />
    </svg>
  )
}

export function WindIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className={className}>
      <path d="M3 8h9a2.5 2.5 0 1 0-2.4-3.2" />
      <path d="M3 12h14a2.5 2.5 0 1 1-2.4 3.2" />
      <path d="M3 16h7a2 2 0 1 1-1.9 2.6" opacity="0.6" />
    </svg>
  )
}

export function PlayIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M8 5.5v13l11-6.5-11-6.5z" />
    </svg>
  )
}

export function CloseIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className={className}>
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="18" y1="6" x2="6" y2="18" />
    </svg>
  )
}

export function ArrowIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M9 6l6 6-6 6" />
    </svg>
  )
}

/** 单颗蒲公英种子的图形（用于漂浮、装饰） */
export function SeedGlyph({ size = 44, className = '' }: { size?: number; className?: string }) {
  const spikes = [-3, -2, -1, 0, 1, 2, 3]
  return (
    <svg viewBox="-16 -18 32 40" width={size} height={size * 1.25} className={className}>
      <line x1="0" y1="16" x2="0" y2="-4" stroke="#7A6E54" strokeWidth="1.3" strokeLinecap="round" />
      <ellipse cx="0" cy="17.5" rx="2" ry="3.2" fill="#8A7B5C" />
      {spikes.map((k) => (
        <line
          key={k}
          x1="0"
          y1="-4"
          x2={Math.sin(k * 0.32) * 10}
          y2={-4 - Math.cos(k * 0.32) * 10}
          stroke="#B7AC8E"
          strokeWidth="1"
          strokeLinecap="round"
        />
      ))}
    </svg>
  )
}
