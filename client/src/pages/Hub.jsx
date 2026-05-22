import { useNavigate } from 'react-router-dom'
import sounds from '../utils/sounds'

const GAMES = [
  {
    id: 'oantuti',
    path: '/oantuti',
    icon: 'sports_kabaddi',
    title: 'Oẳn Tù Tì',
    subtitle: 'Kéo – Búa – Bao nhiều người',
    desc: 'Chơi Kéo Búa Bao trực tuyến với bạn bè. Có 3 luật: Oẳn tù tì, Nhiều ra ít bị, Ít ra nhiều bị.',
    badge: null,
    color: 'var(--neon-purple)',
    available: true
  },
  {
    id: 'survival',
    path: '/survival',
    icon: 'bubble_chart',
    title: 'Sinh Tồn 2D',
    subtitle: 'Ăn thua như agar.io',
    desc: 'Di chuyển, ăn pellet và nuốt cell nhỏ hơn để lớn lên. Cuộc chiến sinh tồn thời gian thực nhiều người!',
    badge: 'Mới',
    color: 'var(--neon-green)',
    available: true
  },
  {
    id: 'game3',
    path: '/coming-soon',
    icon: 'quiz',
    title: 'Câu Đố',
    subtitle: 'Trắc nghiệm nhóm',
    desc: 'Đang phát triển...',
    badge: 'Sắp ra',
    color: 'var(--neon-blue)',
    available: false
  }
]

export default function Hub() {
  const navigate = useNavigate()

  const handleSelectGame = (game) => {
    if (!game.available) return
    sounds.init()
    sounds.playClick()
    navigate(game.path)
  }

  return (
    <div className="app-container">
      <div className="bg-glow bg-glow-1" />
      <div className="bg-glow bg-glow-2" />
      <div className="bg-glow bg-glow-3" />

      <div className="hub-page animate-fade-in">
        <header className="app-header">
          <div className="logo-container">
            <span className="material-symbols-rounded logo-icon">games</span>
          </div>
          <h1 className="app-title">GAME PHÒNG CHỜ</h1>
          <p className="app-subtitle">Chọn trò chơi để bắt đầu với bạn bè</p>
        </header>

        <div className="hub-games-grid">
          {GAMES.map((game) => (
            <div
              key={game.id}
              className={`hub-game-card glass-card ${game.available ? 'available' : 'unavailable'}`}
              style={{ '--game-color': game.color }}
              onClick={() => handleSelectGame(game)}
            >
              <div className="hub-game-icon">
                <span className="material-symbols-rounded">{game.icon}</span>
              </div>
              <div className="hub-game-info">
                <div className="hub-game-title-row">
                  <h2>{game.title}</h2>
                  {game.badge && <span className="badge badge-popular">{game.badge}</span>}
                </div>
                <p className="hub-game-subtitle">{game.subtitle}</p>
                <p className="hub-game-desc">{game.desc}</p>
              </div>
              {game.available && (
                <div className="hub-game-arrow">
                  <span className="material-symbols-rounded">arrow_forward_ios</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
