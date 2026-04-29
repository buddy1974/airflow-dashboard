import { Check } from 'lucide-react'

interface Step {
  number:      number
  title:       string
  description: string
  completed?:  boolean
}

interface Props {
  steps:   Step[]
  current?: number
}

export default function GuidedStep({ steps, current = 0 }: Props) {
  return (
    <div className="mb-6 bg-teal-50 rounded-xl p-5">
      <p className="text-xs font-semibold text-teal-700 uppercase tracking-wider mb-4">
        {current > 0 && current <= steps.length ? `Schritt ${current} von ${steps.length}` : 'So funktioniert es'}
      </p>
      <div className="space-y-3">
        {steps.map((step) => {
          const done    = step.completed || step.number < current
          const active  = step.number === current
          return (
            <div key={step.number} className={`flex items-start gap-3 ${!done && !active ? 'opacity-50' : ''}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 ${
                done   ? 'bg-teal-500 text-white' :
                active ? 'bg-white border-2 border-teal-500 text-teal-600' :
                'bg-gray-200 text-gray-500'
              }`}>
                {done ? <Check size={13}/> : step.number}
              </div>
              <div>
                <p className={`text-sm font-semibold ${active ? 'text-teal-700' : 'text-charcoal'}`}>{step.title}</p>
                <p className="text-xs text-charcoal-lighter leading-relaxed">{step.description}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
