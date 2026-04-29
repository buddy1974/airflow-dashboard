import { ReactNode } from 'react'

interface Props {
  label: string
  value: number | string
  icon: ReactNode
  color?: 'teal' | 'red' | 'yellow' | 'orange' | 'grey'
}

const colorMap = {
  teal:   'bg-teal-100 text-teal-700',
  red:    'bg-red-100 text-red-700',
  yellow: 'bg-yellow-100 text-yellow-700',
  orange: 'bg-orange-100 text-orange-700',
  grey:   'bg-gray-100 text-gray-600',
}

export default function StatCard({ label, value, icon, color = 'teal' }: Props) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-5 flex items-center gap-4">
      <div className={`p-3 rounded-full ${colorMap[color]}`}>{icon}</div>
      <div>
        <p className="text-2xl font-bold text-charcoal">{value}</p>
        <p className="text-sm text-charcoal-lighter">{label}</p>
      </div>
    </div>
  )
}
