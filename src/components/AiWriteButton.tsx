import { Sparkles } from 'lucide-react'

interface Props {
  label:    string
  onClick:  () => void
  loading:  boolean
  disabled?: boolean
  fullWidth?: boolean
  size?: 'md' | 'lg'
}

export default function AiWriteButton({ label, onClick, loading, disabled, fullWidth, size = 'lg' }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading || disabled}
      title="Künstliche Intelligenz erstellt diesen Text automatisch für Sie"
      className={`inline-flex items-center justify-center gap-2.5 font-semibold transition-all rounded-xl disabled:opacity-60 disabled:cursor-not-allowed
        bg-teal-500 hover:bg-teal-600 text-white shadow-sm hover:shadow-md
        ${size === 'lg' ? 'px-6 py-4 text-base' : 'px-5 py-3 text-sm'}
        ${fullWidth ? 'w-full' : ''}
      `}
    >
      {loading ? (
        <>
          <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full flex-shrink-0"/>
          KI arbeitet…
        </>
      ) : (
        <>
          <Sparkles size={size === 'lg' ? 22 : 18} className="flex-shrink-0"/>
          {label}
        </>
      )}
    </button>
  )
}
