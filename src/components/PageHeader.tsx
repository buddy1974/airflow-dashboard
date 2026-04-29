import { ReactNode } from 'react'

interface Props {
  title: string
  subtitle?: string
  action?: ReactNode
}

export default function PageHeader({ title, subtitle, action }: Props) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="border-l-4 border-teal-500 pl-4">
        <h1 className="text-2xl font-bold text-charcoal">{title}</h1>
        {subtitle && <p className="text-sm text-charcoal-lighter mt-0.5">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}
