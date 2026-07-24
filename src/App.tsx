import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Letter, RecordedVoice } from '@/types'
import { tagsToChars } from '@/data/content'
import { createSpec, type DandelionSpec } from '@/lib/dandelion'
import { useSocialMachine } from '@/state/socialMachine'
import { LanguageToggle, useLanguage } from '@/i18n'
import TabBar, { type Tab } from '@/components/TabBar'
import LetterSheet from '@/components/LetterSheet'
import SeedToGardenTransition from '@/components/SeedToGardenTransition'
import Onboarding from '@/sections/Onboarding'
import Tags from '@/sections/Tags'
import Record from '@/sections/Record'
import Bloom from '@/sections/Bloom'
import HomeBlow from '@/sections/HomeBlow'
import Receive from '@/sections/Receive'
import Garden from '@/sections/Garden'
import Chat from '@/sections/Chat'
import Me from '@/sections/Me'
import { getRelayIdentity, sendVoiceSeed, subscribeToSeeds } from '@/lib/relay'

export default function App() {
  const { state, dispatch, selectors } = useSocialMachine()
  const { language } = useLanguage()
  const zh = language === 'zh'
  const [showOpening, setShowOpening] = useState(true)
  const [tab, setTab] = useState<Tab>('blow')
  const [bloomHandoff, setBloomHandoff] = useState(false)
  const [homeSceneReady, setHomeSceneReady] = useState(false)
  const [openLetter, setOpenLetter] = useState<Letter | null>(null)
  const [plantHandoff, setPlantHandoff] = useState<Letter | null>(null)
  const [pendingVoice, setPendingVoice] = useState<RecordedVoice | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<number | null>(null)
  const chars = useMemo(() => tagsToChars(state.tags), [state.tags])
  const activeSpecKey = state.readyDandelion?.specKey ?? state.pendingSpecKey
  const spec = useMemo<DandelionSpec>(() => createSpec(activeSpecKey), [activeSpecKey])
  const relayIdentity = useMemo(() => getRelayIdentity(), [])
  const settingsTone = useMemo<'blue' | 'orange' | 'mint' | 'teal' | 'violet'>(() => {
    if (state.setupStage === 'record') return 'teal'
    if (state.setupStage !== 'app') return 'blue'
    if (tab === 'catch') return 'orange'
    if (tab === 'plot') return 'mint'
    if (tab === 'chat') return 'teal'
    if (tab === 'you') return 'violet'
    return 'blue'
  }, [state.setupStage, tab])

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    if (toastTimer.current) window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(null), 2600)
  }, [])

  useEffect(() => {
    return subscribeToSeeds(
      relayIdentity,
      (letter) => {
        dispatch({ type: 'RECEIVE_REMOTE_SEED', letter })
        setTab('catch')
        showToast(zh ? `${letter.senderName} 的声音随风抵达` : `${letter.senderName}'s voice arrived`)
      },
      () => undefined,
    )
  }, [dispatch, relayIdentity, showToast, zh])

  // —— flow: onboarding → tags → voice → bloom → app ——
  const handleBloomPrepare = useCallback(() => {
    setBloomHandoff(true)
    setHomeSceneReady(false)
    dispatch({ type: 'BLOOM_COMPLETED' })
    setTab('blow')
  }, [dispatch])

  const handleBloomDone = useCallback(() => {
    setBloomHandoff(false)
  }, [])

  const handleOpeningDone = () => {
    setShowOpening(false)
    if (state.setupStage === 'onboarding') {
      dispatch({ type: 'START' })
    }
  }
  // —— scatter = send ——
  const handleAllBlown = useCallback(() => {
    const seedCount = state.readyDandelion ? 3 + (state.readyDandelion.id.length % 2) : 3
    const voice = pendingVoice
    dispatch({ type: 'ACTIVE_BLOW', realNow: Date.now() })
    if (!relayIdentity.enabled) {
      showToast(zh ? `${seedCount} 颗种子已经启程` : `${seedCount} seeds are on their way`)
      return
    }
    if (!voice) {
      showToast(zh ? '这次没有真实录音，未发送给另一位用户' : 'No real recording was captured this time')
      return
    }
    showToast(zh ? `正在把声音吹向用户 ${relayIdentity.peerLabel}` : `Sending the voice to user ${relayIdentity.peerLabel}`)
    void sendVoiceSeed(relayIdentity, voice, state.displayName).then((result) => {
      setPendingVoice(null)
      if (result?.delivered) {
        showToast(zh ? `声音已经抵达用户 ${relayIdentity.peerLabel}` : `The voice reached user ${relayIdentity.peerLabel}`)
      } else {
        showToast(zh ? `用户 ${relayIdentity.peerLabel} 尚未连接` : `User ${relayIdentity.peerLabel} is not connected yet`)
      }
    }).catch(() => {
      showToast(zh ? '风暂时没有连上，请确认中继服务' : 'The shared wind is offline')
    })
  }, [dispatch, pendingVoice, relayIdentity, showToast, state.displayName, state.readyDandelion, zh])

  const handleAdvanceTime = () => {
    const hadReady = Boolean(state.readyDandelion)
    dispatch({ type: 'ADVANCE_DEMO_TIME', realNow: Date.now() })
    if (hadReady && state.readyDandelion?.origin === 'received-seed') {
      showToast(zh ? '24 小时过去——风把蒲公英送回给你' : '24 hours passed — the wind brought it home')
    } else if (state.planted.length > 0) {
      showToast(zh ? '24 小时过去——种子已经成熟' : '24 hours passed — the seed is ready')
    } else {
      showToast(zh ? '已跳过 24 小时' : '24 quiet hours passed')
    }
  }

  // —— catch ——
  const handlePlant = (letter: Letter) => {
    dispatch({ type: 'ACCEPT_SEED', letter, realNow: Date.now() })
    setOpenLetter(null)
    setPlantHandoff(letter)
  }
  const handleRelease = (letter: Letter) => {
    dispatch({ type: 'RELEASE_SEED', letterId: letter.id })
    setOpenLetter(null)
    showToast(zh ? '已放回风中' : 'it drifted on with the wind')
  }

  // —— plot ——
  const handleHarvest = (id: string) => {
    if (state.readyDandelion) {
      showToast(zh ? '窗台上已经有一株蒲公英' : 'the windowsill already holds one dandelion')
      return
    }
    dispatch({ type: 'HARVEST_SEED', plantedId: id, realNow: Date.now() })
    showToast(zh ? '它成熟了——先为今天留下新的声音' : 'It is ready — leave it a voice for today')
  }

  return (
    <div className="flex min-h-dvh items-center justify-center overflow-hidden bg-[#e4e4df]">
      {/* phone frame */}
      <div className="phone-frame relative flex flex-col overflow-hidden border border-border bg-background shadow-[0_24px_60px_-24px_rgba(0,0,0,0.35)]">
        {showOpening && <Onboarding onStart={handleOpeningDone} />}

        {!showOpening && <LanguageToggle tone={settingsTone} />}
        {!showOpening && state.setupStage === 'onboarding' && <Onboarding onStart={handleOpeningDone} />}
        {!showOpening && state.setupStage === 'tags' && (
          <Tags
            onDone={({ displayName, location, tags }) => {
              dispatch({ type: 'TAGS_COMPLETED', displayName, location, tags })
            }}
          />
        )}
        {!showOpening && state.setupStage === 'record' && (
          <Record
            renewal={state.firstDandelionCreated}
            onDone={(voice) => {
              setPendingVoice(voice)
              dispatch({ type: 'RECORD_COMPLETED', realNow: Date.now() })
            }}
          />
        )}
        {!showOpening && state.setupStage === 'app' && (
          <>
            <main className="min-h-0 flex-1">
              {tab === 'blow' && (
                <HomeBlow
                  spec={spec}
                  chars={chars}
                  dandelion={state.readyDandelion}
                  displayName={state.displayName}
                  sentCount={state.sent.length}
                  planted={state.planted}
                  virtualNow={state.virtualNow}
                  onAllBlown={handleAllBlown}
                  onAdvanceTime={handleAdvanceTime}
                  onSceneReady={() => setHomeSceneReady(true)}
                />
              )}
              {tab === 'catch' && <Receive letters={state.incoming} onCatch={setOpenLetter} />}
              {tab === 'plot' && (
                <Garden
                  planted={state.planted}
                  connections={state.connections}
                  virtualNow={state.virtualNow}
                  windowsillOccupied={selectors.hasReadyDandelion}
                  onHarvest={handleHarvest}
                />
              )}
              {tab === 'chat' && <Chat connections={state.connections} onDiscover={() => setTab('catch')} />}
              {tab === 'you' && (
                <Me
                  displayName={state.displayName}
                  words={state.words}
                  tags={state.tags}
                  spec={spec}
                  sent={state.sent}
                  receipts={state.receipts}
                  connections={state.connections}
                  onReset={() => {
                    dispatch({ type: 'RESET', realNow: Date.now() })
                    setTab('blow')
                  }}
                />
              )}
            </main>

            <TabBar tab={tab} onChange={setTab} />

            <LetterSheet
              letter={openLetter}
              onClose={() => setOpenLetter(null)}
              onPlant={handlePlant}
              onRelease={handleRelease}
            />

            <AnimatePresence>
              {plantHandoff && (
                <SeedToGardenTransition
                  key={plantHandoff.id}
                  senderName={plantHandoff.senderName}
                  onGarden={() => setTab('plot')}
                  onComplete={() => {
                    setPlantHandoff(null)
                    showToast(zh ? '一段联系，已经开始生长。' : 'A quiet bond has begun to grow.')
                  }}
                />
              )}
            </AnimatePresence>
          </>
        )}

        {!showOpening && (state.setupStage === 'bloom' || bloomHandoff) && (
          <Bloom
            spec={spec}
            chars={chars}
            tags={state.tags}
            renewal={state.firstDandelionCreated}
            readyToExit={homeSceneReady}
            onPrepare={handleBloomPrepare}
            onDone={handleBloomDone}
          />
        )}

        {/* toast */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="pointer-events-none absolute inset-x-0 bottom-24 z-50 flex justify-center px-8"
            >
              <span className="font-mono2 rounded-full bg-foreground px-5 py-2.5 text-[10px] uppercase tracking-[0.18em] text-background">
                {toast}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
