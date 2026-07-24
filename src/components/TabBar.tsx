import type { ComponentType } from 'react'
import { useLanguage } from '@/i18n'
import { ChatIcon, DandelionIcon, PersonIcon, SeedIcon, SproutIcon } from '@/components/Icons'

export type Tab = 'blow' | 'catch' | 'plot' | 'chat' | 'you'

const TABS: {
  key: Tab
  label: string
  labelZh: string
  color: string
  Icon: ComponentType<{ className?: string }>
}[] = [
  { key: 'blow', label: 'Blow', labelZh: '吹散', color: '#0ea5e9', Icon: DandelionIcon },
  { key: 'catch', label: 'Catch', labelZh: '接收', color: '#f97316', Icon: SeedIcon },
  { key: 'plot', label: 'Garden', labelZh: '花圃', color: '#10b981', Icon: SproutIcon },
  { key: 'chat', label: 'Chat', labelZh: '聊天', color: '#14b8a6', Icon: ChatIcon },
  { key: 'you', label: 'You', labelZh: '我的', color: '#8b5cf6', Icon: PersonIcon },
]

interface Props {
  tab: Tab
  onChange: (tab: Tab) => void
}

export default function TabBar({ tab, onChange }: Props) {
  const { language } = useLanguage()

  return (
    <nav className="nav-glass absolute inset-x-3 bottom-[max(env(safe-area-inset-bottom),10px)] z-30 grid h-[58px] grid-cols-5 items-center rounded-full px-2">
      {TABS.map(({ key, label, labelZh, color, Icon }) => {
        const active = tab === key
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            aria-label={language === 'zh' ? labelZh : label}
            className="relative mx-auto flex h-10 w-10 items-center justify-center rounded-full transition duration-200 active:scale-90"
            style={active ? { background: color, color: '#fff', boxShadow: `0 8px 18px -8px ${color}` } : { color: 'rgba(30,41,59,0.52)' }}
          >
            <Icon className="h-[21px] w-[21px]" />
          </button>
        )
      })}
    </nav>
  )
}
