import sounds from '../utils/sounds'

export default function SoundBanner() {
  const handleClick = () => {
    sounds.init()
  }

  return (
    <div id="sound-init-banner" className="sound-banner" onClick={handleClick}>
      <span className="material-symbols-rounded">volume_up</span>
      <p>Bấm vào bất kỳ đâu để kích hoạt âm thanh sinh động!</p>
    </div>
  )
}
