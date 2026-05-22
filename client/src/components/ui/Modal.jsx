import useGameStore from '../../store/gameStore'
import sounds from '../../utils/sounds'

export default function Modal() {
  const modal = useGameStore((s) => s.modal)
  const hideModal = useGameStore((s) => s.hideModal)

  if (!modal) return null

  const iconClassMap = {
    wifi_off: 'icon-error',
    error: 'icon-error',
    warning: 'icon-warning',
    check_circle: 'icon-success',
    success: 'icon-success',
    logout: 'icon-error',
    info: 'icon-info'
  }
  const iconClass = iconClassMap[modal.icon] ?? 'icon-info'

  const handleOk = () => {
    sounds.playClick()
    hideModal()
    modal.onConfirm?.()
  }

  const handleCancel = () => {
    sounds.playClick()
    hideModal()
    modal.onCancel?.()
  }

  return (
    <div id="custom-modal-backdrop" className="custom-modal-backdrop">
      <div className="glass-card modal-card animate-slide-up">
        <div className="modal-header">
          <span className={`material-symbols-rounded modal-icon ${iconClass}`}>{modal.icon ?? 'info'}</span>
          <h3>{modal.title}</h3>
        </div>
        <div className="modal-body">
          <p>{modal.message}</p>
        </div>
        <div className="modal-footer" style={{ display: 'flex', gap: 15, justifyContent: 'center', width: '100%' }}>
          {modal.showCancel && (
            <button className="btn btn-secondary" style={{ minWidth: 120 }} onClick={handleCancel}>
              Hủy Bỏ
            </button>
          )}
          <button className="btn btn-primary btn-glow-effect" style={{ minWidth: 120 }} onClick={handleOk}>
            Xác Nhận
          </button>
        </div>
      </div>
    </div>
  )
}
