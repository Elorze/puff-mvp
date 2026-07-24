import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Check, Settings } from 'lucide-react'
import HalfSheet from '@/components/HalfSheet'

export type Language = 'zh' | 'en'

interface LanguageContextValue {
  language: Language
  setLanguage: (language: Language) => void
  toggleLanguage: () => void
}

const LanguageContext = createContext<LanguageContextValue | null>(null)
const STORAGE_KEY = 'puff-language'

function detectLanguage(): Language {
  if (typeof window === 'undefined') return 'zh'
  const saved = window.localStorage.getItem(STORAGE_KEY)
  if (saved === 'zh' || saved === 'en') return saved
  return window.navigator.language.toLowerCase().startsWith('zh') ? 'zh' : 'en'
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(detectLanguage)

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, language)
    document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en'
  }, [language])

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      toggleLanguage: () => setLanguage((current) => (current === 'zh' ? 'en' : 'zh')),
    }),
    [language],
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const value = useContext(LanguageContext)
  if (!value) throw new Error('useLanguage must be used inside LanguageProvider')
  return value
}

export function LanguageToggle({ tone = 'blue' }: { tone?: 'blue' | 'orange' | 'mint' | 'teal' | 'violet' }) {
  const { language, setLanguage } = useLanguage()
  const [open, setOpen] = useState(false)
  const zh = language === 'zh'

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="absolute right-5 top-11 z-[70] grid h-8 w-8 place-items-center text-white/68 transition active:scale-90 active:text-white"
        aria-label={zh ? '打开设置' : 'Open settings'}
      >
        <Settings className="h-3.5 w-3.5" strokeWidth={1.65} />
      </button>

      <HalfSheet
        open={open}
        onClose={() => setOpen(false)}
        title={zh ? '设置' : 'Settings'}
        subtitle={zh ? '选择界面语言。' : 'Choose the interface language.'}
        closeLabel={zh ? '关闭设置' : 'Close settings'}
        heightClassName="h-[38%] min-h-[280px] max-h-[360px]"
        tone={tone}
      >
        <div className="space-y-2">
          {([
            ['zh', '中文', '简体中文'],
            ['en', 'English', 'English'],
          ] as const).map(([value, label, detail]) => {
            const selected = language === value
            return (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setLanguage(value)
                  setOpen(false)
                }}
                className={`flex min-h-14 w-full items-center rounded-[18px] border px-4 text-left transition active:scale-[0.985] ${
                  selected
                    ? 'border-white/42 bg-white/18 text-white'
                    : 'border-white/12 bg-white/[0.07] text-white/68'
                }`}
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-medium">{label}</span>
                  <span className="mt-0.5 block text-[10px] text-white/48">{detail}</span>
                </span>
                {selected && <Check className="h-4 w-4 text-white/82" />}
              </button>
            )
          })}
        </div>
      </HalfSheet>
    </>
  )
}
