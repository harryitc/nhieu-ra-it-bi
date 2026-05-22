import { useEffect, useState } from 'react'
import useGameStore from '../store/gameStore'
import useWebSocket from '../hooks/useWebSocket'
import sounds from '../utils/sounds'
import WelcomeScreen from '../components/screens/WelcomeScreen'
import LobbyScreen from '../components/screens/LobbyScreen'
import PlayScreen from '../components/screens/PlayScreen'
import ResultModal from '../components/ResultModal'
import Chat from '../components/Chat'
import HistoryPanel from '../components/HistoryPanel'
import EmojiBar from '../components/EmojiBar'
import SoundBanner from '../components/SoundBanner'
import Toast from '../components/ui/Toast'
import Modal from '../components/ui/Modal'

export default function OanTuTi() {
  useWebSocket()

  const currentScreen = useGameStore((s) => s.currentScreen)
  const soundEnabled = useGameStore((s) => s.soundEnabled)
  const [soundReady, setSoundReady] = useState(false)

  useEffect(() => {
    sounds.enabled = soundEnabled
  }, [soundEnabled])

  useEffect(() => {
    const handler = () => {
      sounds.init()
      setSoundReady(true)
    }
    document.addEventListener('click', handler, { once: true })
    document.addEventListener('touchstart', handler, { once: true, passive: true })
    return () => {
      document.removeEventListener('click', handler)
      document.removeEventListener('touchstart', handler)
    }
  }, [])

  return (
    <div className="app-container">
      <div className="bg-glow bg-glow-1" />
      <div className="bg-glow bg-glow-2" />
      <div className="bg-glow bg-glow-3" />

      {currentScreen === 'welcome' && <WelcomeScreen />}
      {currentScreen === 'lobby' && <LobbyScreen />}
      {currentScreen === 'play' && <PlayScreen />}

      <ResultModal />
      <Chat />
      <HistoryPanel />
      <EmojiBar />
      {!soundReady && <SoundBanner />}
      <Toast />
      <Modal />
    </div>
  )
}
