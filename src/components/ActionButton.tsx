import { ReactNode } from 'react'

interface Props {
  label:    string
  icon?:    ReactNode
  onClick?: () => void
  color?:   'teal' | 'red' | 'yellow' | 'grey' | 'outline'
  size?:    'sm' | 'md' | 'lg'
  disabled?: boolean
  type?:    'button' | 'submit'
  fullWidth?: boolean
}

const colorMap = {
  teal:    'bg-teal-500 hover:bg-teal-600 text-white',
  red:     'bg-red-500  hover:bg-red-600  text-white',
  yellow:  'bg-yellow-400 hover:bg-yellow-500 text-charcoal',
  grey:    'bg-gray-100 hover:bg-gray-200 text-charcoal',
  outline: 'border-2 border-teal-500 text-teal-600 hover:bg-teal-50 bg-white',
}

const sizeMap = {
  sm: 'px-3 py-1.5 text-sm rounded-lg gap-1.5',
  md: 'px-4 py-2.5 text-sm rounded-xl gap-2',
  lg: 'px-6 py-4 text-base rounded-xl gap-2.5 font-semibold',
}

export default function ActionButton({ label, icon, onClick, color = 'teal', size = 'md', disabled, type = 'button', fullWidth }: Props) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${colorMap[color]} ${sizeMap[size]} ${fullWidth ? 'w-full' : ''}`}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {label}
    </button>
  )
}
