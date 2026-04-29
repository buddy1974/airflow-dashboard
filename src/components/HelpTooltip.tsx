import { useState } from 'react'
import { HelpCircle } from 'lucide-react'

interface Props { text: string }

export default function HelpTooltip({ text }: Props) {
  const [show, setShow] = useState(false)

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onFocus={() => setShow(true)}
        onBlur={() => setShow(false)}
        className="ml-1 text-charcoal-lighter hover:text-teal-500 transition-colors align-middle"
        aria-label="Hilfe"
      >
        <HelpCircle size={14} />
      </button>
      {show && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none">
          <span className="block bg-charcoal text-white text-xs leading-relaxed rounded-xl px-3 py-2 shadow-lg w-56 text-center">
            {text}
          </span>
          <span className="block w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-charcoal mx-auto" />
        </span>
      )}
    </span>
  )
}
