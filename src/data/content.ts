import type { Letter, PlantedSeed } from '@/types'

/** Incoming mail (demo data) */
export const MOCK_LETTERS: Letter[] = [
  {
    id: 'l1',
    kind: 'audio',
    senderName: 'Moss',
    audioSeconds: 12,
    text: 'I watered a pot of mint in my kitchen at 3 a.m., and suddenly the day felt less bad. How about you — have you been sleeping okay?',
    textZh: '凌晨三点，我给厨房里的一盆薄荷浇了水，突然觉得这一天也没有那么糟。你呢，最近睡得还好吗？',
    tags: ['WOMAN', '25–30', 'NIGHT OWL'],
    distanceKm: 1204,
    daysTraveling: 6,
  },
  {
    id: 'l2',
    kind: 'audio',
    senderName: 'Noon',
    audioSeconds: 18,
    text: 'There’s a watchmaker in my town, forty years at the same bench. He says it’s fine if a watch runs slow, as long as you don’t lose yourself. I’ve kept that sentence for years. Today I’m mailing it to you.',
    textZh: '我的小城里有位修表匠，在同一张工作台前坐了四十年。他说，表走慢一点没关系，只要别把自己弄丢。这句话我留了很多年，今天把它寄给你。',
    tags: ['MAN', '40+', 'OLD MOVIES'],
    distanceKm: 867,
    daysTraveling: 4,
  },
  {
    id: 'l3',
    kind: 'audio',
    senderName: 'Cocoa',
    audioSeconds: 9,
    text: 'A short clip with no music: someone slowly finishes a cup of hot cocoa on camera, says nothing, and smiles at you at the end.',
    textZh: '一段没有音乐的短片：有人在镜头前慢慢喝完一杯热可可，什么也没说，最后对你笑了一下。',
    tags: ['UNSAID', '18–24', 'TEA PERSON'],
    distanceKm: 2310,
    daysTraveling: 9,
  },
]

/** Seeds already growing in the garden (demo data) */
export const MOCK_PLANTED: PlantedSeed[] = [
  {
    id: 'p1',
    stage: 'sprout',
    progress: 0.62,
    daysLeft: 2,
    letter: {
      id: 'pl1',
      kind: 'audio',
      senderName: 'Fern',
      audioSeconds: 14,
      text: 'I fixed my grandmother’s palm-leaf fan. The breeze feels the same as when I was a kid.',
      textZh: '我修好了外婆留下的蒲扇。扇出来的风，和小时候一模一样。',
      tags: ['WOMAN', '31–39', 'PLANT PERSON'],
      distanceKm: 512,
      daysTraveling: 3,
    },
  },
  {
    id: 'p2',
    stage: 'seed',
    progress: 0.18,
    daysLeft: 5,
    letter: {
      id: 'pl2',
      kind: 'audio',
      senderName: 'Rain',
      audioSeconds: 11,
      text: 'It rained today. I stood under the eaves for a long time and realized I’d never really watched rain before.',
      textZh: '今天下雨了。我在屋檐下站了很久，才发现自己以前从没有认真看过一场雨。',
      tags: ['NON-BINARY', '25–30', 'RAIN WALKER'],
      distanceKm: 1580,
      daysTraveling: 7,
    },
  },
]

export const DEFAULT_WORDS =
  'I like walking home on rainy evenings, taking the long way on purpose. The moment the streetlights come on, the world always feels a little gentler.'
export const DEFAULT_WORDS_ZH = '我喜欢在下雨的傍晚绕远路走回家。路灯亮起的那一刻，世界总会突然变得温柔一点。'
export const DEFAULT_TAGS = ['WOMAN', '25–30', 'RAIN WALKER']

export const TAG_LABEL_ZH: Record<string, string> = {
  'SHE/HER': 'she/her',
  'HE/HIM': 'he/him',
  'THEY/THEM': 'they/them',
  'ASK ME': '之后再问我',
  'FULL-TIME': '全职工作',
  FOUNDER: '创业中',
  CREATIVE: '创意行业',
  RESEARCH: '研究 / 教育',
  CARE: '照护 / 服务',
  'BETWEEN JOBS': '暂时停下来',
  OTHER: '其他',
  'EARLY BIRD': '早起的人',
  'CITY WALKER': '城市漫游',
  'HOME BODY': '喜欢待在家',
  OUTDOOR: '常在户外',
  'SLOW LIVING': '缓慢生活',
  WOMAN: '女性',
  MAN: '男性',
  'NON-BINARY': '非二元',
  UNSAID: '不透露',
  STRAIGHT: '异性恋',
  GAY: '同性恋',
  BI: '双性恋',
  QUEER: '酷儿',
  AGELESS: '不以年龄定义',
  STUDENT: '学生',
  WORKING: '在职',
  FREELANCE: '自由职业',
  CRAFTSPERSON: '手艺人',
  'SLOW MORNINGS': '缓慢清晨',
  'NIGHT OWL': '夜猫子',
  'TEA PERSON': '爱喝茶',
  'PLANT PERSON': '植物爱好者',
  'RAIN WALKER': '喜欢雨中散步',
  'OLD MOVIES': '老电影',
  'CITY SLEEPER': '城市夜行者',
  'SEA SIDE': '向往海边',
}

/** 标签 → 字母池（每颗种子顶端一个字母） */
export function tagsToChars(tags: string[]): string[] {
  return tags
    .join('')
    .replace(/[\s–+]/g, '')
    .split('')
}
