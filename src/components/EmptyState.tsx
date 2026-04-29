import { ReactNode } from 'react'
import { Inbox } from 'lucide-react'

interface Props {
  title:        string
  message:      string
  actionLabel?: string
  onAction?:    () => void
  secondaryLabel?:  string
  onSecondary?:     () => void
  icon?:        ReactNode
}

export default function EmptyState({ title, message, actionLabel, onAction, secondaryLabel, onSecondary, icon }: Props) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-12 flex flex-col items-center text-center">
      <div className="w-20 h-20 rounded-full bg-teal-50 flex items-center justify-center mb-4 text-teal-400">
        {icon ?? <Inbox size={40} />}
      </div>
      <h3 className="text-xl font-bold text-charcoal mb-2">{title}</h3>
      <p className="text-sm text-charcoal-lighter max-w-md leading-relaxed mb-6">{message}</p>
      <div className="flex gap-3 flex-wrap justify-center">
        {actionLabel && onAction && (
          <button
            onClick={onAction}
            className="bg-teal-500 hover:bg-teal-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            {actionLabel}
          </button>
        )}
        {secondaryLabel && onSecondary && (
          <button
            onClick={onSecondary}
            className="border-2 border-teal-300 text-teal-600 hover:bg-teal-50 font-medium px-6 py-3 rounded-xl transition-colors"
          >
            {secondaryLabel}
          </button>
        )}
      </div>
    </div>
  )
}
