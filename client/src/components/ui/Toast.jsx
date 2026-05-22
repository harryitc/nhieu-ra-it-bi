import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import useGameStore from '../../store/gameStore'
import sounds from '../../utils/sounds'

export default function Toast() {
  const toasts = useGameStore((s) => s.toasts)

  return createPortal(
    <div id="custom-toast-container" className="custom-toast-container">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>,
    document.body
  )
}

function ToastItem({ toast }) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    // Trigger fade-out just before the store removes the toast
    const timer = setTimeout(() => {
      el.classList.add('toast-fadeOut')
    }, 3100)
    return () => clearTimeout(timer)
  }, [])

  const iconMap = {
    success: 'check_circle',
    error: 'error',
    warning: 'warning',
    info: 'info'
  }

  return (
    <div ref={ref} className={`custom-toast toast-${toast.type}`}>
      <span className="material-symbols-rounded toast-icon">{iconMap[toast.type] ?? 'info'}</span>
      <div className="toast-content">{toast.message}</div>
    </div>
  )
}
