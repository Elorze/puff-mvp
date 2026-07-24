import type { Letter, RecordedVoice } from '@/types'

export interface RelayIdentity {
  enabled: boolean
  room: string
  userId: string
  peerLabel: string
  baseUrl: string
}

interface RelaySeed {
  id: string
  senderId: string
  senderName: string
  audioUrl: string
  audioSeconds: number
  createdAt: number
}

export type RelayStatus = 'connecting' | 'live' | 'offline'

function relayBaseUrl() {
  const configured = import.meta.env.VITE_RELAY_URL as string | undefined
  if (configured) return configured.replace(/\/$/, '')
  if (window.location.port === '8787') return window.location.origin
  return `${window.location.protocol}//${window.location.hostname}:8787`
}

export function getRelayIdentity(): RelayIdentity {
  const params = new URLSearchParams(window.location.search)
  const userId = params.get('user')?.trim().toUpperCase() ?? ''
  const room = params.get('room')?.trim() ?? 'puff-demo'
  const enabled = userId === 'A' || userId === 'B'
  return {
    enabled,
    room,
    userId,
    peerLabel: userId === 'A' ? 'B' : 'A',
    baseUrl: relayBaseUrl(),
  }
}

function blobToBase64(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(reader.error)
    reader.onload = () => {
      const value = String(reader.result ?? '')
      resolve(value.slice(value.indexOf(',') + 1))
    }
    reader.readAsDataURL(blob)
  })
}

export async function sendVoiceSeed(
  identity: RelayIdentity,
  voice: RecordedVoice,
  senderName: string,
) {
  if (!identity.enabled) return null
  const audioBase64 = await blobToBase64(voice.blob)
  const response = await fetch(`${identity.baseUrl}/seed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      room: identity.room,
      senderId: identity.userId,
      senderName: senderName.trim() || `Puff ${identity.userId}`,
      mimeType: voice.mimeType,
      audioBase64,
      audioSeconds: voice.duration,
    }),
  })
  if (!response.ok) {
    throw new Error(`Relay rejected the seed (${response.status})`)
  }
  return response.json() as Promise<{ id: string; delivered: number }>
}

function seedToLetter(seed: RelaySeed, baseUrl: string): Letter {
  const absoluteAudioUrl = new URL(seed.audioUrl, `${baseUrl}/`).toString()
  return {
    id: `remote-${seed.id}`,
    kind: 'audio',
    senderName: seed.senderName,
    senderId: seed.senderId,
    text: 'A voice arrived with the wind.',
    textZh: '一段声音随风抵达。',
    tags: [],
    audioSeconds: Math.max(1, Math.round(seed.audioSeconds || 1)),
    audioUrl: absoluteAudioUrl,
    distanceKm: 1_204,
    daysTraveling: 0,
  }
}

export function subscribeToSeeds(
  identity: RelayIdentity,
  onSeed: (letter: Letter) => void,
  onStatus: (status: RelayStatus) => void,
) {
  if (!identity.enabled) return () => undefined
  onStatus('connecting')
  const query = new URLSearchParams({ room: identity.room, user: identity.userId })
  const events = new EventSource(`${identity.baseUrl}/events?${query}`)
  events.addEventListener('open', () => onStatus('live'))
  events.addEventListener('error', () => onStatus('offline'))
  events.addEventListener('seed', (event) => {
    try {
      const seed = JSON.parse((event as MessageEvent<string>).data) as RelaySeed
      if (seed.senderId !== identity.userId) onSeed(seedToLetter(seed, identity.baseUrl))
    } catch {
      // Ignore malformed demo packets instead of interrupting the social flow.
    }
  })
  return () => events.close()
}
