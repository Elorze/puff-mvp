import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { BriefcaseBusiness, CalendarDays, ChevronDown, MapPin, PencilLine, UserRound, Waves } from 'lucide-react'
import { useLanguage } from '@/i18n'
import HalfSheet from '@/components/HalfSheet'

interface Props {
  onDone: (profile: { displayName: string; location: string; tags: string[] }) => void
}

const PRONOUNS = ['SHE/HER', 'HE/HIM', 'THEY/THEM', 'ASK ME']
const OCCUPATIONS = [
  ['STUDENT', '学生', 'Student'],
  ['FULL-TIME', '全职工作', 'Full-time'],
  ['FREELANCE', '自由职业', 'Freelance'],
  ['FOUNDER', '创业中', 'Founder'],
  ['CREATIVE', '创意行业', 'Creative'],
  ['RESEARCH', '研究 / 教育', 'Research / education'],
  ['CARE', '照护 / 服务', 'Care / service'],
  ['BETWEEN JOBS', '暂时停下来', 'Between roles'],
  ['OTHER', '其他', 'Other'],
] as const
const RHYTHMS = [
  ['EARLY BIRD', '早起的人', 'Early bird'],
  ['NIGHT OWL', '夜猫子', 'Night owl'],
  ['CITY WALKER', '城市漫游', 'City walker'],
  ['HOME BODY', '喜欢待在家', 'Home body'],
  ['OUTDOOR', '常在户外', 'Often outdoors'],
  ['SLOW LIVING', '缓慢生活', 'Slow living'],
] as const

const LOCATIONS = [
  {
    key: 'CN',
    zh: '中国',
    en: 'China',
    regions: [
      { key: 'BJ', zh: '北京', en: 'Beijing', cities: [['BEIJING', '北京', 'Beijing']] },
      { key: 'SH', zh: '上海', en: 'Shanghai', cities: [['SHANGHAI', '上海', 'Shanghai']] },
      { key: 'GD', zh: '广东', en: 'Guangdong', cities: [['GUANGZHOU', '广州', 'Guangzhou'], ['SHENZHEN', '深圳', 'Shenzhen']] },
      { key: 'ZJ', zh: '浙江', en: 'Zhejiang', cities: [['HANGZHOU', '杭州', 'Hangzhou'], ['NINGBO', '宁波', 'Ningbo']] },
      { key: 'SC', zh: '四川', en: 'Sichuan', cities: [['CHENGDU', '成都', 'Chengdu']] },
    ],
  },
  {
    key: 'US',
    zh: '美国',
    en: 'United States',
    regions: [
      { key: 'CA', zh: '加利福尼亚', en: 'California', cities: [['LOS_ANGELES', '洛杉矶', 'Los Angeles'], ['SAN_FRANCISCO', '旧金山', 'San Francisco'], ['SAN_DIEGO', '圣地亚哥', 'San Diego']] },
      { key: 'NY', zh: '纽约州', en: 'New York', cities: [['NEW_YORK', '纽约', 'New York City'], ['BUFFALO', '布法罗', 'Buffalo']] },
      { key: 'WA', zh: '华盛顿州', en: 'Washington', cities: [['SEATTLE', '西雅图', 'Seattle']] },
    ],
  },
  {
    key: 'GB',
    zh: '英国',
    en: 'United Kingdom',
    regions: [
      { key: 'ENG', zh: '英格兰', en: 'England', cities: [['LONDON', '伦敦', 'London'], ['MANCHESTER', '曼彻斯特', 'Manchester'], ['BRISTOL', '布里斯托', 'Bristol']] },
      { key: 'SCT', zh: '苏格兰', en: 'Scotland', cities: [['EDINBURGH', '爱丁堡', 'Edinburgh'], ['GLASGOW', '格拉斯哥', 'Glasgow']] },
    ],
  },
  {
    key: 'JP',
    zh: '日本',
    en: 'Japan',
    regions: [
      { key: 'TOKYO', zh: '东京都', en: 'Tokyo', cities: [['TOKYO', '东京', 'Tokyo']] },
      { key: 'OSAKA', zh: '大阪府', en: 'Osaka', cities: [['OSAKA', '大阪', 'Osaka']] },
      { key: 'KYOTO', zh: '京都府', en: 'Kyoto', cities: [['KYOTO', '京都', 'Kyoto']] },
    ],
  },
  {
    key: 'SG',
    zh: '新加坡',
    en: 'Singapore',
    regions: [
      { key: 'CENTRAL', zh: '中央区', en: 'Central', cities: [['SINGAPORE', '新加坡', 'Singapore']] },
    ],
  },
] as const

const YEARS = Array.from({ length: 83 }, (_, index) => String(2008 - index))
const MONTHS = Array.from({ length: 12 }, (_, index) => String(index + 1).padStart(2, '0'))
const ITEM_HEIGHT = 44

function WheelColumn({
  label,
  values,
  value,
  onChange,
}: {
  label: string
  values: string[]
  value: string
  onChange: (value: string) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const frame = useRef<number | null>(null)
  const itemSize = (item: string) => {
    if (item.length >= 13) return 'text-[10.5px]'
    if (item.length >= 10) return 'text-[11.5px]'
    if (item.length >= 8) return 'text-[13px]'
    return 'text-[16px]'
  }

  useEffect(() => {
    const index = Math.max(0, values.indexOf(value))
    ref.current?.scrollTo({ top: index * ITEM_HEIGHT })
  }, [value, values])

  return (
    <div className="min-w-0 flex-1">
      <p className="mb-2 text-center text-[11px] text-white/45">{label}</p>
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.06]">
        <div className="pointer-events-none absolute inset-x-1 top-1/2 z-10 h-11 -translate-y-1/2 rounded-xl border border-blue-200/20 bg-blue-300/10" />
        <div
          ref={ref}
          onScroll={(event) => {
            if (frame.current) cancelAnimationFrame(frame.current)
            const scrollTop = event.currentTarget.scrollTop
            frame.current = requestAnimationFrame(() => {
              const index = Math.max(0, Math.min(values.length - 1, Math.round(scrollTop / ITEM_HEIGHT)))
              if (values[index] !== value) onChange(values[index])
            })
          }}
          className="no-scrollbar h-[168px] snap-y snap-mandatory overflow-y-auto py-[62px]"
          aria-label={label}
        >
          {values.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => {
                onChange(item)
                ref.current?.scrollTo({ top: values.indexOf(item) * ITEM_HEIGHT, behavior: 'smooth' })
              }}
              className={`relative z-20 flex h-11 w-full snap-center items-center justify-center overflow-hidden whitespace-nowrap px-1 text-center transition ${itemSize(item)} ${
                item === value ? 'font-medium text-white' : 'text-white/30'
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function FlowingBlue() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden bg-[#061545]">
      <motion.div
        className="absolute -left-16 -top-12 h-[270px] w-[290px] rounded-[42%_58%_55%_45%/48%_42%_58%_52%] bg-[radial-gradient(circle_at_64%_58%,#80d7ff_0%,#367cff_48%,#2042bd_82%)] opacity-95 blur-[18px] will-change-transform"
        animate={{
          x: [0, 72, 24, -18, 0],
          y: [0, 96, 188, 68, 0],
          rotate: [0, 48, 116, 176, 360],
          scale: [1, 1.16, 0.92, 1.08, 1],
          borderRadius: ['42% 58% 55% 45%', '57% 43% 38% 62%', '46% 54% 64% 36%', '58% 42% 49% 51%', '42% 58% 55% 45%'],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -right-24 top-[18%] h-[250px] w-[280px] rounded-[60%_40%_46%_54%/42%_55%_45%_58%] bg-[radial-gradient(circle_at_38%_45%,#9cddff_0%,#5898ff_43%,#4a50dc_82%)] opacity-90 blur-[19px] will-change-transform"
        animate={{
          x: [0, -82, -18, -64, 0],
          y: [0, 102, 224, 44, 0],
          rotate: [0, -62, -138, -224, -360],
          scale: [0.92, 1.12, 0.96, 1.18, 0.92],
          borderRadius: ['60% 40% 46% 54%', '44% 56% 62% 38%', '58% 42% 37% 63%', '41% 59% 54% 46%', '60% 40% 46% 54%'],
        }}
        transition={{ duration: 19, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -bottom-10 -left-20 h-[300px] w-[330px] rounded-[38%_62%_55%_45%/55%_39%_61%_45%] bg-[radial-gradient(circle_at_58%_34%,#4d8dff_0%,#2850d6_48%,#101f72_84%)] opacity-95 blur-[21px] will-change-transform"
        animate={{
          x: [0, 84, 26, -20, 0],
          y: [0, -176, -72, -112, 0],
          rotate: [0, 76, 162, 248, 360],
          scale: [1.08, 0.9, 1.17, 0.98, 1.08],
        }}
        transition={{ duration: 21, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -left-8 top-[43%] h-[190px] w-[230px] rounded-[55%_45%_63%_37%/42%_63%_37%_58%] bg-[radial-gradient(circle_at_50%_45%,#80caff_0%,#3c73ed_56%,#273ea8_86%)] opacity-85 blur-[15px] will-change-transform"
        animate={{ x: [0, 98, 26, 0], y: [0, 108, -66, 0], rotate: [0, 125, 260, 360], scale: [0.88, 1.16, 0.98, 0.88] }}
        transition={{ duration: 13, repeat: Infinity, ease: 'easeInOut' }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(112,188,255,.02),rgba(1,7,34,.1))]" />
    </div>
  )
}

export default function Tags({ onDone }: Props) {
  const { language } = useLanguage()
  const zh = language === 'zh'
  const [displayName, setDisplayName] = useState('')
  const [pronoun, setPronoun] = useState('')
  const [occupation, setOccupation] = useState('')
  const [rhythm, setRhythm] = useState('')
  const [birthday, setBirthday] = useState<{ year: string; month: string; day: string } | null>(null)
  const [location, setLocation] = useState<string | null>(null)
  const [activeSheet, setActiveSheet] = useState<'pronoun' | 'birthday' | 'location' | 'occupation' | 'rhythm' | null>(null)
  const [year, setYear] = useState('2000')
  const [month, setMonth] = useState('06')
  const [day, setDay] = useState('15')
  const [countryCode, setCountryCode] = useState('CN')
  const [regionCode, setRegionCode] = useState('GD')
  const [cityCode, setCityCode] = useState('SHENZHEN')

  const days = useMemo(() => {
    const total = new Date(Number(year), Number(month), 0).getDate()
    return Array.from({ length: total }, (_, index) => String(index + 1).padStart(2, '0'))
  }, [month, year])

  useEffect(() => {
    if (!days.includes(day)) setDay(days[days.length - 1])
  }, [day, days])

  const ageTag = useMemo(() => {
    if (!birthday) return ''
    const today = new Date()
    let age = today.getFullYear() - Number(birthday.year)
    const hasNotHadBirthday =
      today.getMonth() + 1 < Number(birthday.month) ||
      (today.getMonth() + 1 === Number(birthday.month) && today.getDate() < Number(birthday.day))
    if (hasNotHadBirthday) age -= 1
    if (age <= 24) return '18–24'
    if (age <= 30) return '25–30'
    if (age <= 39) return '31–39'
    return '40+'
  }, [birthday])

  const country = LOCATIONS.find((item) => item.key === countryCode) ?? LOCATIONS[0]
  const region = country.regions.find((item) => item.key === regionCode) ?? country.regions[0]
  const city = region.cities.find((item) => item[0] === cityCode) ?? region.cities[0]
  const locationLabel = useMemo(() => {
    if (!location) return ''
    const [savedCountry, savedRegion, savedCity] = location.split('/')
    const countryItem = LOCATIONS.find((item) => item.key === savedCountry)
    const regionItem = countryItem?.regions.find((item) => item.key === savedRegion)
    const cityItem = regionItem?.cities.find((item) => item[0] === savedCity)
    if (!countryItem || !regionItem || !cityItem) return ''
    return zh
      ? `${countryItem.zh} · ${regionItem.zh} · ${cityItem[1]}`
      : `${cityItem[2]}, ${regionItem.en}`
  }, [location, zh])

  const canContinue = Boolean(displayName.trim() && pronoun && birthday && location && occupation)
  const selected = [pronoun, ageTag, occupation, rhythm].filter(Boolean)

  return (
    <div className="relative h-full overflow-hidden text-white">
      <FlowingBlue />

      <div className="relative z-10 flex h-full flex-col px-5 pb-6 pt-11">
        <motion.header
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="pr-16"
        >
          <h2 className={`text-[28px] font-semibold ${zh ? 'whitespace-nowrap leading-[1.18]' : 'leading-none'}`}>
            {zh ? '先让风认识你。' : 'Let the wind know you.'}
          </h2>
          <p className="mt-2 max-w-[280px] text-[12px] leading-[1.4] text-white/55">
            {zh ? <>这些信息会帮助风，<br />找到与你相近的方向。</> : 'These details help the wind find a direction close to yours.'}
          </p>
        </motion.header>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="mt-5 space-y-2 rounded-[30px] border border-white/15 bg-[#06163b]/30 p-3 shadow-[0_24px_80px_rgba(0,7,35,.26)] backdrop-blur-md"
        >
          <label className="flex min-h-14 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.055] px-4">
            <PencilLine className="h-4 w-4 shrink-0 text-blue-200/70" />
            <span className="min-w-0 flex-1">
              <span className="block text-[10px] text-white/40">{zh ? '名字' : 'Name'}</span>
              <input
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                maxLength={24}
                autoComplete="name"
                placeholder={zh ? '名字或昵称' : 'Name or nickname'}
                className="mt-0.5 block w-full bg-transparent text-[13px] leading-tight text-white outline-none placeholder:text-white/35"
              />
            </span>
          </label>

          <button
            type="button"
            onClick={() => setActiveSheet('pronoun')}
            className="flex min-h-14 w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.055] px-4 text-left transition active:scale-[0.99]"
          >
            <UserRound className="h-4 w-4 shrink-0 text-blue-200/70" />
            <span className="min-w-0 flex-1">
              <span className="block text-[10px] text-white/40">{zh ? '代词' : 'Pronouns'}</span>
              <span className={`mt-0.5 block truncate text-[13px] ${pronoun ? 'text-white' : 'text-white/35'}`}>
                {pronoun ? pronoun.toLowerCase() : (zh ? '选择称呼方式' : 'Choose yours')}
              </span>
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 text-white/35" />
          </button>

          <button
            type="button"
            onClick={() => setActiveSheet('birthday')}
            className="flex min-h-14 w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.055] px-4 text-left transition active:scale-[0.99]"
          >
            <CalendarDays className="h-4 w-4 shrink-0 text-blue-200/70" />
            <span className="min-w-0 flex-1">
              <span className="block text-[10px] text-white/40">{zh ? '出生日期' : 'Birth date'}</span>
              <span className={`mt-0.5 block truncate text-[13px] ${birthday ? 'text-white' : 'text-white/35'}`}>
                {birthday ? `${birthday.year}.${birthday.month}.${birthday.day}` : (zh ? '滚动选择年月日' : 'Set your date')}
              </span>
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 text-white/35" />
          </button>

          <button
            type="button"
            onClick={() => setActiveSheet('location')}
            className="flex min-h-14 w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.055] px-4 text-left transition active:scale-[0.99]"
          >
            <MapPin className="h-4 w-4 shrink-0 text-blue-200/70" />
            <span className="min-w-0 flex-1">
              <span className="block text-[10px] text-white/40">{zh ? '所在地区' : 'Region'}</span>
              <span className={`mt-0.5 block truncate text-[13px] ${location ? 'text-white' : 'text-white/35'}`}>
                {locationLabel || (zh ? '选择国家、省份和城市' : 'Country, region, city')}
              </span>
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 text-white/35" />
          </button>

          <button
            type="button"
            onClick={() => setActiveSheet('occupation')}
            className="flex min-h-14 w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.055] px-4 text-left transition active:scale-[0.99]"
          >
            <BriefcaseBusiness className="h-4 w-4 shrink-0 text-blue-200/70" />
            <span className="min-w-0 flex-1">
              <span className="block text-[10px] text-white/40">{zh ? '现在主要在做什么' : 'Occupation'}</span>
              <span className={`mt-0.5 block truncate text-[13px] ${occupation ? 'text-white' : 'text-white/35'}`}>
                {occupation
                  ? OCCUPATIONS.find(([key]) => key === occupation)?.[zh ? 1 : 2]
                  : (zh ? '选择职业状态' : 'Choose one')}
              </span>
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 text-white/35" />
          </button>

          <button
            type="button"
            onClick={() => setActiveSheet('rhythm')}
            className="flex min-h-14 w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.055] px-4 text-left transition active:scale-[0.99]"
          >
            <Waves className="h-4 w-4 shrink-0 text-blue-200/70" />
            <span className="min-w-0 flex-1">
              <span className="block text-[10px] text-white/40">{zh ? '你的生活节奏（可选）' : 'Rhythm · optional'}</span>
              <span className={`mt-0.5 block truncate text-[13px] ${rhythm ? 'text-white' : 'text-white/35'}`}>
                {rhythm
                  ? RHYTHMS.find(([key]) => key === rhythm)?.[zh ? 1 : 2]
                  : (zh ? '选择一种描述' : 'Choose one')}
              </span>
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 text-white/35" />
          </button>
        </motion.div>

        <div className="mt-5">
          <button
            type="button"
            disabled={!canContinue}
            onClick={() => onDone({ displayName: displayName.trim(), location: location!, tags: selected })}
            className={`beam-control glass-pill relative w-full overflow-hidden rounded-[22px] py-3.5 text-[14px] font-medium transition active:scale-[0.98] ${
              canContinue
                ? 'text-white shadow-[0_16px_34px_-22px_rgba(103,190,255,.72)]'
                : 'cursor-default text-white/28 opacity-65'
            }`}
          >
            {zh ? '继续' : 'Continue'}
          </button>
        </div>
      </div>

      <HalfSheet
        open={activeSheet === 'pronoun'}
        onClose={() => setActiveSheet(null)}
        title={zh ? '你的代词' : 'Your pronouns'}
        subtitle={zh ? '选择你希望被称呼的方式。' : 'Choose how you would like to be addressed.'}
        closeLabel={zh ? '关闭' : 'Close'}
        heightClassName="h-[44%] min-h-[320px] max-h-[420px]"
      >
        <div className="grid grid-cols-2 gap-2">
          {PRONOUNS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => {
                setPronoun(item)
                setActiveSheet(null)
              }}
              className={`min-h-14 rounded-[18px] border px-3 text-[13px] transition active:scale-[0.97] ${
                pronoun === item
                  ? 'border-white/70 bg-white text-[#12429f] shadow-[0_8px_25px_rgba(0,29,112,.2)]'
                  : 'border-white/18 bg-white/10 text-white/82'
              }`}
            >
              {item.toLowerCase()}
            </button>
          ))}
        </div>
      </HalfSheet>

      <HalfSheet
        open={activeSheet === 'birthday'}
        onClose={() => setActiveSheet(null)}
        title={zh ? '出生日期' : 'Date of birth'}
        subtitle={zh ? '上下滚动，选择你的年月日。' : 'Scroll each wheel to set your date.'}
        closeLabel={zh ? '关闭' : 'Close'}
        heightClassName="h-[61%] min-h-[410px] max-h-[650px]"
        footer={(
          <button
            type="button"
            onClick={() => {
              setBirthday({ year, month, day })
              setActiveSheet(null)
            }}
            className="relative w-full overflow-hidden rounded-[22px] bg-[linear-gradient(112deg,rgba(122,190,255,.2),rgba(23,75,188,.42)_46%,rgba(97,158,255,.2))] py-3.5 text-[14px] font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,.26),inset_0_-1px_0_rgba(5,35,122,.34),0_12px_30px_rgba(4,26,101,.22)] backdrop-blur-2xl transition active:scale-[0.98]"
          >
            <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(255,255,255,.3),transparent_36%),radial-gradient(circle_at_82%_115%,rgba(83,173,255,.34),transparent_42%)]" />
            <span className="relative">{zh ? '确认日期' : 'Confirm date'}</span>
          </button>
        )}
      >
        <div className="flex gap-2">
          <WheelColumn label={zh ? '年' : 'Year'} values={YEARS} value={year} onChange={setYear} />
          <WheelColumn label={zh ? '月' : 'Month'} values={MONTHS} value={month} onChange={setMonth} />
          <WheelColumn label={zh ? '日' : 'Day'} values={days} value={day} onChange={setDay} />
        </div>
      </HalfSheet>

      <HalfSheet
        open={activeSheet === 'location'}
        onClose={() => setActiveSheet(null)}
        title={zh ? '所在地区' : 'Your region'}
        subtitle={zh ? '帮助风辨认你所处的时区、季节与生活节奏。' : 'Help the wind sense your timezone, season, and daily rhythm.'}
        closeLabel={zh ? '关闭' : 'Close'}
        heightClassName="h-[61%] min-h-[410px] max-h-[650px]"
        footer={(
          <button
            type="button"
            onClick={() => {
              setLocation(`${country.key}/${region.key}/${city[0]}`)
              setActiveSheet(null)
            }}
            className="beam-control glass-pill w-full rounded-[22px] py-3.5 text-[14px] font-semibold text-white transition active:scale-[0.98]"
          >
            {zh ? '确认地区' : 'Confirm region'}
          </button>
        )}
      >
        <div className="flex gap-2">
          <WheelColumn
            label={zh ? '国家' : 'Country'}
            values={LOCATIONS.map((item) => item[zh ? 'zh' : 'en'])}
            value={country[zh ? 'zh' : 'en']}
            onChange={(label) => {
              const nextCountry = LOCATIONS.find((item) => item[zh ? 'zh' : 'en'] === label) ?? LOCATIONS[0]
              const nextRegion = nextCountry.regions[0]
              const nextCity = nextRegion.cities[0]
              setCountryCode(nextCountry.key)
              setRegionCode(nextRegion.key)
              setCityCode(nextCity[0])
            }}
          />
          <WheelColumn
            label={zh ? '省 / 州' : 'Region'}
            values={country.regions.map((item) => item[zh ? 'zh' : 'en'])}
            value={region[zh ? 'zh' : 'en']}
            onChange={(label) => {
              const nextRegion = country.regions.find((item) => item[zh ? 'zh' : 'en'] === label) ?? country.regions[0]
              setRegionCode(nextRegion.key)
              setCityCode(nextRegion.cities[0][0])
            }}
          />
          <WheelColumn
            label={zh ? '城市' : 'City'}
            values={region.cities.map((item) => item[zh ? 1 : 2])}
            value={city[zh ? 1 : 2]}
            onChange={(label) => {
              const nextCity = region.cities.find((item) => item[zh ? 1 : 2] === label) ?? region.cities[0]
              setCityCode(nextCity[0])
            }}
          />
        </div>
      </HalfSheet>

      <HalfSheet
        open={activeSheet === 'occupation'}
        onClose={() => setActiveSheet(null)}
        title={zh ? '现在主要在做什么？' : 'What do you do?'}
        subtitle={zh ? '选一个最接近你目前状态的答案。' : 'Choose what feels closest right now.'}
        closeLabel={zh ? '关闭' : 'Close'}
      >
        <div className="grid grid-cols-2 gap-2">
          {OCCUPATIONS.map(([key, labelZh, labelEn]) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                setOccupation(key)
                setActiveSheet(null)
              }}
              className={`min-h-14 rounded-[18px] border px-3 py-3 text-left text-[12px] leading-snug transition active:scale-[0.97] ${
                occupation === key
                  ? 'border-white/70 bg-white text-[#12429f] shadow-[0_8px_25px_rgba(0,29,112,.2)]'
                  : 'border-white/18 bg-white/10 text-white/82'
              }`}
            >
              {zh ? labelZh : labelEn}
            </button>
          ))}
        </div>
      </HalfSheet>

      <HalfSheet
        open={activeSheet === 'rhythm'}
        onClose={() => setActiveSheet(null)}
        title={zh ? '你的生活节奏' : 'Your rhythm'}
        subtitle={zh ? '这是可选的，也可以暂时不回答。' : 'Optional — you can leave this unanswered.'}
        closeLabel={zh ? '关闭' : 'Close'}
      >
        <div className="space-y-2">
          {RHYTHMS.map(([key, labelZh, labelEn]) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                setRhythm(key)
                setActiveSheet(null)
              }}
              className={`flex min-h-12 w-full items-center justify-between rounded-[18px] border px-4 py-3 text-left text-[13px] transition active:scale-[0.98] ${
                rhythm === key
                  ? 'border-white/70 bg-white text-[#12429f]'
                  : 'border-white/18 bg-white/10 text-white/82'
              }`}
            >
              <span>{zh ? labelZh : labelEn}</span>
              <span className={`h-2 w-2 rounded-full ${rhythm === key ? 'bg-[#2c6ff0]' : 'bg-white/25'}`} />
            </button>
          ))}
          {rhythm && (
            <button
              type="button"
              onClick={() => {
                setRhythm('')
                setActiveSheet(null)
              }}
              className="w-full py-2 text-center text-[11px] text-white/58"
            >
              {zh ? '清除选择' : 'Clear selection'}
            </button>
          )}
        </div>
      </HalfSheet>
    </div>
  )
}
