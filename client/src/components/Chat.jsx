import { useEffect, useRef, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import useGameStore from '../store/gameStore'
import { sendToServer } from '../hooks/useWebSocket'
import sounds from '../utils/sounds'
import { escapeHtml } from '../utils/helpers'

export default function Chat() {
  const { chatMessages, chatExpanded, unreadMessages, roomCode } = useGameStore(useShallow((s) => ({
    chatMessages: s.chatMessages,
    chatExpanded: s.chatExpanded,
    unreadMessages: s.unreadMessages,
    roomCode: s.roomCode
  })))
  const setChatExpanded = useGameStore((s) => s.setChatExpanded)

  const [inputValue, setInputValue] = useState('')
  const messagesEndRef = useRef(null)

  const visible = Boolean(roomCode)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  const openChat = () => {
    sounds.playClick()
    setChatExpanded(true)
  }

  const closeChat = () => {
    sounds.playClick()
    setChatExpanded(false)
  }

  const toggleChat = () => {
    sounds.playClick()
    setChatExpanded(!chatExpanded)
  }

  const sendMessage = () => {
    const text = inputValue.trim()
    if (!text) return
    sendToServer({ type: 'SEND_CHAT', message: text })
    setInputValue('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') sendMessage()
  }

  return (
    <div
      id="app-chat-wrapper"
      className={`chat-wrapper ${chatExpanded ? 'expanded' : 'collapsed'} ${visible ? '' : 'hidden'}`}
    >
      <button id="chat-toggle-btn" className="chat-toggle-btn" title={chatExpanded ? 'Đóng trò chuyện' : 'Mở trò chuyện'} onClick={toggleChat}>
        <span className="material-symbols-rounded">{chatExpanded ? 'close' : 'chat'}</span>
        {!chatExpanded && unreadMessages > 0 && (
          <span id="chat-badge" className="chat-badge">{unreadMessages}</span>
        )}
      </button>

      <div className="chat-panel">
        <div className="chat-panel-header">
          <span className="material-symbols-rounded" style={{ fontSize: 16, color: 'var(--neon-blue)' }}>chat</span>
          <span className="chat-panel-title">Trò Chuyện</span>
          <span className="chat-unread-count" style={{ display: unreadMessages > 0 ? '' : 'none' }}>{unreadMessages}</span>
        </div>

        <div className="chat-messages" id="chat-messages-container">
          {chatMessages.map((msg, idx) => (
            <ChatMessage key={idx} msg={msg} />
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="chat-input-bar">
          <input
            type="text"
            id="chat-input-field"
            placeholder="Nhập tin nhắn..."
            maxLength={60}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button id="chat-send-btn" title="Gửi tin nhắn" onClick={sendMessage}>
            <span className="material-symbols-rounded">send</span>
          </button>
        </div>
      </div>
    </div>
  )
}

function ChatMessage({ msg }) {
  const myId = useGameStore((s) => s.myPlayer?.id)

  if (msg.type === 'system') {
    return <div className="chat-system-message">{msg.message}</div>
  }

  const isMe = msg.playerId === myId
  return (
    <div className={`chat-msg-row ${isMe ? 'msg-me' : ''}`}>
      <div className="chat-msg-sender" style={{ color: msg.playerColor?.value }}>
        {msg.playerName}
      </div>
      <div
        className="chat-msg-bubble"
        dangerouslySetInnerHTML={{ __html: escapeHtml(msg.message) }}
      />
    </div>
  )
}
