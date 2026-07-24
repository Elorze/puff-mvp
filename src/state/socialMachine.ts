import { useEffect, useMemo, useReducer } from 'react'
import { DEFAULT_TAGS, DEFAULT_WORDS, MOCK_LETTERS, MOCK_PLANTED } from '@/data/content'
import type {
  Connection,
  GrowthStage,
  JournalReceipt,
  Letter,
  PlantedSeed,
  ReadyDandelion,
  SentDandelion,
  SetupStage,
} from '@/types'

const LEGACY_STORAGE_KEY = 'puff-social-machine-v1'
// Hackathon test clock: the product ritual represents 24 hours,
// but the complete growth can be observed in one real minute.
const GROWTH_DURATION_MS = 60 * 1000
const NATURAL_DRIFT_GRACE_MS = 24 * 60 * 60 * 1000
export const DEMO_STEP_MS = 24 * 60 * 60 * 1000

export interface SocialState {
  version: 1
  setupStage: SetupStage
  displayName: string
  location: string
  tags: string[]
  words: string
  pendingSpecKey: string
  renewalSeedId: string | null
  firstDandelionCreated: boolean
  readyDandelion: ReadyDandelion | null
  incoming: Letter[]
  planted: PlantedSeed[]
  connections: Connection[]
  sent: SentDandelion[]
  receipts: JournalReceipt[]
  virtualNow: number
  lastRealAt: number
}

export type SocialEvent =
  | { type: 'START' }
  | { type: 'SKIP_TO_DEMO'; realNow: number }
  | { type: 'TAGS_COMPLETED'; displayName: string; location: string; tags: string[] }
  | { type: 'RECORD_COMPLETED'; realNow: number }
  | { type: 'BLOOM_COMPLETED' }
  | { type: 'ACTIVE_BLOW'; realNow: number }
  | { type: 'RECEIVE_REMOTE_SEED'; letter: Letter }
  | { type: 'ACCEPT_SEED'; letter: Letter; realNow: number }
  | { type: 'RELEASE_SEED'; letterId: string }
  | { type: 'HARVEST_SEED'; plantedId: string; realNow: number }
  | { type: 'ADVANCE_DEMO_TIME'; realNow: number }
  | { type: 'TICK'; realNow: number }
  | { type: 'RESET'; realNow: number }

function id(prefix: string, now: number) {
  return `${prefix}-${now}-${Math.random().toString(36).slice(2, 7)}`
}

function stageForProgress(progress: number): GrowthStage {
  if (progress >= 1) return 'mature'
  if (progress >= 0.7) return 'bud'
  if (progress >= 0.28) return 'sprout'
  return 'seed'
}

function syncPlanted(seed: PlantedSeed, now: number): PlantedSeed {
  if (!seed.acceptedAt || !seed.maturesAt) return seed
  const elapsed = Math.max(0, now - seed.acceptedAt)
  const progress = Math.min(1, elapsed / GROWTH_DURATION_MS)
  return {
    ...seed,
    progress,
    stage: stageForProgress(progress),
    daysLeft: progress >= 1 ? 0 : 1,
  }
}

function makeReceipt(dandelion: ReadyDandelion, now: number): JournalReceipt {
  const excerpt = dandelion.words.trim() || 'A quiet day, held without needing to explain itself.'
  return {
    id: id('receipt', now),
    dandelionId: dandelion.id,
    createdAt: now,
    title: 'A day the wind returned',
    summary: excerpt.length > 160 ? `${excerpt.slice(0, 157)}…` : excerpt,
    source: 'natural-wind',
  }
}

function reconcile(state: SocialState, realNow: number): SocialState {
  const elapsedReal = Math.max(0, realNow - state.lastRealAt)
  const virtualNow = state.virtualNow + elapsedReal
  const planted = state.planted.map((seed) => syncPlanted(seed, virtualNow))
  const shouldDrift =
    state.readyDandelion?.naturalDriftAt != null &&
    virtualNow >= state.readyDandelion.naturalDriftAt

  if (shouldDrift && state.readyDandelion) {
    return {
      ...state,
      virtualNow,
      lastRealAt: realNow,
      planted,
      readyDandelion: null,
      receipts: [makeReceipt(state.readyDandelion, virtualNow), ...state.receipts],
    }
  }

  return { ...state, virtualNow, lastRealAt: realNow, planted }
}

function makeInitialState(realNow = Date.now()): SocialState {
  const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
  const demoUser = params?.get('user')?.toUpperCase() ?? ''
  const multiplayerDemo = demoUser === 'A' || demoUser === 'B'
  const isSender = demoUser === 'A'
  return {
    version: 1,
    setupStage: multiplayerDemo ? (isSender ? 'record' : 'app') : 'onboarding',
    displayName: multiplayerDemo ? (isSender ? 'Aster' : 'Morrow') : '',
    location: multiplayerDemo ? (isSender ? 'CN/GD/SHENZHEN' : 'CN/SH/SHANGHAI') : '',
    tags: multiplayerDemo ? DEFAULT_TAGS : [],
    words: '',
    pendingSpecKey: DEFAULT_WORDS,
    renewalSeedId: null,
    firstDandelionCreated: false,
    readyDandelion: null,
    incoming: multiplayerDemo ? [] : MOCK_LETTERS,
    planted: [],
    connections: [],
    sent: [],
    receipts: [],
    virtualNow: realNow,
    lastRealAt: realNow,
  }
}

function makeDemoState(realNow: number): SocialState {
  const state = makeInitialState(realNow)
  const demoPlanted = MOCK_PLANTED.map((seed, index) => {
    const progress = Math.min(0.92, Math.max(0.08, seed.progress))
    const acceptedAt = realNow - progress * GROWTH_DURATION_MS
    return {
      ...seed,
      acceptedAt,
      maturesAt: acceptedAt + GROWTH_DURATION_MS,
      connectionId: `demo-connection-${index + 1}`,
      stage: stageForProgress(progress),
      progress,
      daysLeft: 1,
    }
  })

  return {
    ...state,
    setupStage: 'app',
    displayName: 'Mia',
    location: 'CN/GD/SHENZHEN',
    tags: DEFAULT_TAGS,
    words: DEFAULT_WORDS,
    pendingSpecKey: `${DEFAULT_WORDS}::demo`,
    renewalSeedId: null,
    firstDandelionCreated: true,
    readyDandelion: {
      id: 'demo-first-dandelion',
      origin: 'first',
      specKey: `${DEFAULT_WORDS}::demo`,
      words: DEFAULT_WORDS,
      createdAt: realNow,
      readyAt: realNow,
      naturalDriftAt: null,
    },
    planted: demoPlanted,
    connections: demoPlanted.map((seed) => ({
      id: seed.connectionId!,
      letterId: seed.letter.id,
      senderName: seed.letter.senderName,
      startedAt: seed.acceptedAt!,
      distanceKm: seed.letter.distanceKm,
      status: 'open',
      openingLine: seed.letter.text,
      openingLineZh: seed.letter.textZh,
      audioSeconds: seed.letter.audioSeconds,
    })),
  }
}

function makeFirstDandelion(state: SocialState): ReadyDandelion {
  return {
    id: id('dandelion', state.virtualNow),
    origin: 'first',
    specKey: state.pendingSpecKey,
    words: state.words,
    createdAt: state.virtualNow,
    readyAt: state.virtualNow,
    naturalDriftAt: null,
  }
}

export function socialReducer(current: SocialState, event: SocialEvent): SocialState {
  let state =
    'realNow' in event && event.type !== 'RESET'
      ? reconcile(current, event.realNow)
      : current

  switch (event.type) {
    case 'START':
      return { ...state, setupStage: 'tags' }
    case 'SKIP_TO_DEMO':
      return makeDemoState(event.realNow)
    case 'TAGS_COMPLETED':
      return {
        ...state,
        displayName: event.displayName,
        location: event.location,
        tags: event.tags,
        setupStage: 'record',
      }
    case 'RECORD_COMPLETED': {
      const specKey = `voice::${state.virtualNow}`
      return {
        ...state,
        words: '',
        pendingSpecKey: specKey,
        setupStage: 'bloom',
      }
    }
    case 'BLOOM_COMPLETED': {
      if (state.firstDandelionCreated && state.renewalSeedId) {
        const seed = state.planted.find((item) => item.id === state.renewalSeedId)
        if (!seed || seed.stage !== 'mature') {
          return { ...state, setupStage: 'app', renewalSeedId: null }
        }
        const dandelionId = id('dandelion', state.virtualNow)
        return {
          ...state,
          setupStage: 'app',
          renewalSeedId: null,
          planted: state.planted.filter((item) => item.id !== seed.id),
          readyDandelion: {
            id: dandelionId,
            origin: 'received-seed',
            sourceSeedId: seed.id,
            specKey: state.pendingSpecKey,
            words: state.words,
            createdAt: state.virtualNow,
            readyAt: state.virtualNow,
            naturalDriftAt: state.virtualNow + NATURAL_DRIFT_GRACE_MS,
          },
        }
      }
      if (state.firstDandelionCreated) return { ...state, setupStage: 'app' }
      return {
        ...state,
        setupStage: 'app',
        firstDandelionCreated: true,
        readyDandelion: makeFirstDandelion(state),
      }
    }
    case 'ACTIVE_BLOW':
      if (!state.readyDandelion) return state
      return {
        ...state,
        sent: [
          {
            id: state.readyDandelion.id,
            words: state.readyDandelion.words,
            sentAt: state.virtualNow,
            seedCount: 3 + (state.readyDandelion.id.length % 2),
            origin: state.readyDandelion.origin,
          },
          ...state.sent,
        ],
        readyDandelion: null,
      }
    case 'RECEIVE_REMOTE_SEED':
      if (state.incoming.some((letter) => letter.id === event.letter.id)) return state
      return {
        ...state,
        incoming: [event.letter, ...state.incoming],
      }
    case 'ACCEPT_SEED': {
      if (!state.incoming.some((letter) => letter.id === event.letter.id)) return state
      const connectionId = id('bond', state.virtualNow)
      const planted: PlantedSeed = {
        id: id('planted', state.virtualNow),
        letter: event.letter,
        stage: 'seed',
        progress: 0,
        daysLeft: 1,
        acceptedAt: state.virtualNow,
        maturesAt: state.virtualNow + GROWTH_DURATION_MS,
        connectionId,
      }
      return {
        ...state,
        incoming: state.incoming.filter((letter) => letter.id !== event.letter.id),
        planted: [planted, ...state.planted],
        connections: [
          {
            id: connectionId,
            letterId: event.letter.id,
            senderName: event.letter.senderName,
            startedAt: state.virtualNow,
            distanceKm: event.letter.distanceKm,
            status: 'open',
            openingLine: event.letter.text,
            openingLineZh: event.letter.textZh,
            audioSeconds: event.letter.audioSeconds,
            audioUrl: event.letter.audioUrl,
          },
          ...state.connections,
        ],
      }
    }
    case 'RELEASE_SEED':
      return {
        ...state,
        incoming: state.incoming.filter((letter) => letter.id !== event.letterId),
      }
    case 'HARVEST_SEED': {
      if (state.readyDandelion) return state
      const seed = state.planted.find((item) => item.id === event.plantedId)
      if (!seed || seed.stage !== 'mature') return state
      return {
        ...state,
        setupStage: 'record',
        renewalSeedId: seed.id,
        pendingSpecKey: `renewal::${seed.id}::${state.virtualNow}`,
      }
    }
    case 'ADVANCE_DEMO_TIME':
      return reconcile(
        {
          ...state,
          virtualNow: state.virtualNow + DEMO_STEP_MS,
          lastRealAt: event.realNow,
        },
        event.realNow,
      )
    case 'TICK':
      return state
    case 'RESET':
      return makeInitialState(event.realNow)
    default:
      return state
  }
}

function loadInitialState(): SocialState {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(LEGACY_STORAGE_KEY)
  }
  return makeInitialState()
}

export function useSocialMachine() {
  const [state, dispatch] = useReducer(socialReducer, undefined, loadInitialState)

  useEffect(() => {
    const timer = window.setInterval(() => dispatch({ type: 'TICK', realNow: Date.now() }), 1_000)
    return () => window.clearInterval(timer)
  }, [])

  const selectors = useMemo(
    () => ({
      matureCount: state.planted.filter((seed) => seed.stage === 'mature').length,
      growingCount: state.planted.filter((seed) => seed.stage !== 'mature').length,
      hasReadyDandelion: Boolean(state.readyDandelion),
      latestReceipt: state.receipts[0] ?? null,
    }),
    [state],
  )

  return { state, dispatch, selectors }
}
