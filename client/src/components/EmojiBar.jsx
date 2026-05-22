import { sendToServer } from '../hooks/useWebSocket'
import sounds from '../utils/sounds'
import useGameStore from '../store/gameStore'

const EMOJIS = [
  { emoji: '👍', label: 'Thích' },
  { emoji: '🔥', label: 'Cháy' },
  { emoji: '😂', label: 'Cười' },
  { emoji: '😮', label: 'Bất ngờ' },
  { emoji: '😢', label: 'Khóc' },
  { emoji: '🎉', label: 'Chúc mừng' }
]

export default function EmojiBar() {
  const roomCode = useGameStore((s) => s.roomCode)

  if (!roomCode) return null

  const handleClick = (emoji, e) => {
    sendToServer({ type: 'SEND_REACTION', emoji })
    // Bounce animation
    e.currentTarget.style.transform = 'scale(0.8)'
    setTimeout(() => { e.currentTarget.style.transform = '' }, 100)
  }

  return (
    <div id="emoji-reaction-bar" className="emoji-reaction-bar">
      {EMOJIS.map(({ emoji, label }) => (
        <button
          key={emoji}
          className="emoji-btn"
          data-emoji={emoji}
          title={label}
          onClick={(e) => handleClick(emoji, e)}
        >
          {emoji}
        </button>
      ))}
    </div>
  )
}
