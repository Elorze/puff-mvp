export type GrowthStage = 'seed' | 'sprout' | 'bud' | 'mature'
export type SetupStage = 'onboarding' | 'tags' | 'record' | 'bloom' | 'app'
export type DandelionOrigin = 'first' | 'received-seed'

export interface RecordedVoice {
  blob: Blob
  duration: number
  mimeType: string
}

export interface Letter {
  id: string
  kind: 'audio'
  senderName: string
  senderId?: string
  text: string
  textZh?: string
  tags: string[]
  audioSeconds: number
  audioUrl?: string
  distanceKm: number
  daysTraveling: number
}

export interface PlantedSeed {
  id: string
  letter: Letter
  stage: GrowthStage
  progress: number // 0 - 1
  daysLeft: number
  acceptedAt?: number
  maturesAt?: number
  connectionId?: string
}

export interface ReadyDandelion {
  id: string
  origin: DandelionOrigin
  specKey: string
  words: string
  createdAt: number
  readyAt: number
  /**
   * The very first dandelion never drifts back to its owner.
   * Later dandelions become a journal receipt if they remain untouched.
   */
  naturalDriftAt: number | null
  sourceSeedId?: string
}

export interface SentDandelion {
  id: string
  words: string
  sentAt: number
  seedCount: number
  origin: DandelionOrigin
}

export interface Connection {
  id: string
  letterId: string
  senderName: string
  startedAt: number
  distanceKm: number
  status: 'open'
  openingLine: string
  openingLineZh?: string
  audioSeconds: number
  audioUrl?: string
}

export interface JournalReceipt {
  id: string
  dandelionId: string
  createdAt: number
  title: string
  summary: string
  source: 'natural-wind'
}

export const STAGE_LABEL: Record<GrowthStage, string> = {
  seed: 'SEED',
  sprout: 'SPROUT',
  bud: 'IN BUD',
  mature: 'RIPE',
}
