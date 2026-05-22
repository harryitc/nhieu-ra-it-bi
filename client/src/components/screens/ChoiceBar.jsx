import { useShallow } from 'zustand/react/shallow'
import useGameStore from '../../store/gameStore'
import { sendToServer } from '../../hooks/useWebSocket'
import sounds from '../../utils/sounds'
import { HAND_SVGS } from '../../utils/handSvgs'

const SAUV_NGUAV_BUTTONS = [
  { choice: 'sấp', label: 'ÚP TAY (Sấp)', svgKey: 'sấp' },
  { choice: 'ngửa', label: 'NGỬA TAY (Ngửa)', svgKey: 'ngửa' }
]
const KBO_BUTTONS = [
  { choice: 'kéo', label: 'KÉO', svgKey: 'kéo' },
  { choice: 'búa', label: 'BÚA', svgKey: 'búa' },
  { choice: 'bao', label: 'BAO', svgKey: 'bao' }
]

export default function ChoiceBar() {
  const { myPlayer, roundType, myChoice, choiceChanges, maxChanges } = useGameStore(useShallow((s) => ({
    myPlayer: s.myPlayer,
    roundType: s.roundType,
    myChoice: s.myChoice,
    choiceChanges: s.choiceChanges,
    maxChanges: s.maxChanges
  })))

  // Hidden when spectator or safe
  if (!myPlayer || myPlayer.isSpectator || myPlayer.isSafe) return null

  const isLocked = myChoice !== null && maxChanges !== 999 && choiceChanges >= maxChanges
  const buttons = roundType === 'oan-tu-ti' ? KBO_BUTTONS : SAUV_NGUAV_BUTTONS

  const handleChoose = (choice) => {
    if (isLocked) return
    sounds.playClick()
    sendToServer({ type: 'SUBMIT_CHOICE', choice })
  }

  let hintsText = null
  if (myChoice && !isLocked) {
    if (maxChanges === 999) {
      hintsText = 'Bạn đã chọn. Có thể đổi không giới hạn cho đến khi lật tay!'
    } else {
      const remaining = maxChanges - choiceChanges
      hintsText = `Đã chọn. Còn ${remaining} lần đổi.`
    }
  } else if (isLocked) {
    hintsText = null
  }

  return (
    <div id="choice-bar" className="choice-bar active">
      <div id="choice-buttons-container" className={`choice-buttons-container ${roundType === 'oan-tu-ti' ? 'kbo-mode' : ''}`}>
        {buttons.map(({ choice, label, svgKey }) => {
          const isSelected = myChoice === choice
          const disabled = isLocked && !isSelected
          return (
            <button
              key={choice}
              className={`choice-btn ${isSelected ? 'selected' : ''} ${disabled ? 'disabled' : ''}`}
              data-choice={choice}
              title={label}
              disabled={disabled}
              onClick={() => handleChoose(choice)}
            >
              <span
                className="hand-svg-wrapper"
                dangerouslySetInnerHTML={{ __html: HAND_SVGS[svgKey] ?? '' }}
              />
              <span className="choice-label">{label}</span>
            </button>
          )
        })}
      </div>
      {isLocked && (
        <p className="choice-locked-message" id="choice-locked-msg">
          <span className="material-symbols-rounded">lock</span>
          Lựa chọn của bạn đã bị khóa. Đợi chủ phòng lật tay!
        </p>
      )}
      {hintsText && (
        <p className="choice-hint-message" id="choice-hint-msg">{hintsText}</p>
      )}
    </div>
  )
}
