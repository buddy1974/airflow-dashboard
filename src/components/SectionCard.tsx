import { ReactNode } from 'react'

interface Props {
  title:     string
  subtitle?: string
  action?:   ReactNode
  children:  ReactNode
  className?: string
  noPad?:    boolean
}

export default function SectionCard({ title, subtitle, action, children, className = '', noPad }: Props) {
  return (
    <div className={`bg-white rounded-2xl shadow-sm border-l-4 border-teal-500 overflow-hidden ${className}`}>
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div>
          <h3 className="font-semibold text-charcoal">{title}</h3>
          {subtitle && <p className="text-xs text-charcoal-lighter mt-0.5">{subtitle}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>
      <div className={noPad ? '' : 'p-6'}>{children}</div>
    </div>
  )
}
