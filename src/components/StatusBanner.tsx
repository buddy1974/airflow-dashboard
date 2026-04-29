import { useEffect, useState } from 'react'
import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react'

type BannerType = 'success' | 'warning' | 'error' | 'info'

interface Props {
  type:         BannerType
  message:      string
  actionLabel?: string
  onAction?:    () => void
  onDismiss?:   () => void
  autoDismiss?: boolean
}

const CONFIG = {
  success: { bg: 'bg-teal-50 border-teal-300 text-teal-800',  icon: CheckCircle,     iconClass: 'text-teal-500' },
  warning: { bg: 'bg-yellow-50 border-yellow-300 text-yellow-800', icon: AlertTriangle, iconClass: 'text-yellow-500' },
  error:   { bg: 'bg-red-50 border-red-300 text-red-800',     icon: XCircle,         iconClass: 'text-red-500' },
  info:    { bg: 'bg-teal-50 border-teal-200 text-teal-700',  icon: Info,            iconClass: 'text-teal-400' },
}

export default function StatusBanner({ type, message, actionLabel, onAction, onDismiss, autoDismiss = false }: Props) {
  const [visible, setVisible] = useState(true)
  const { bg, icon: Icon, iconClass } = CONFIG[type]

  useEffect(() => {
    if (autoDismiss) {
      const t = setTimeout(() => { setVisible(false); onDismiss?.() }, 4000)
      return () => clearTimeout(t)
    }
  }, [autoDismiss, onDismiss])

  if (!visible) return null

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border mb-4 ${bg}`}>
      <Icon size={20} className={`flex-shrink-0 ${iconClass}`}/>
      <p className="flex-1 text-sm font-medium">{message}</p>
      {actionLabel && onAction && (
        <button onClick={onAction} className="text-sm underline font-semibold whitespace-nowrap hover:no-underline">{actionLabel}</button>
      )}
      <button onClick={() => { setVisible(false); onDismiss?.() }} className="flex-shrink-0 opacity-60 hover:opacity-100">
        <X size={16}/>
      </button>
    </div>
  )
}
