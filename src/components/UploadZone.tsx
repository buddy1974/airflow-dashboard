import { useState, useRef, ChangeEvent, DragEvent } from 'react'
import { UploadCloud, CheckCircle } from 'lucide-react'

interface Props {
  label?:   string
  hint?:    string
  accept?:  string
  onFile:   (file: File) => void
  loading?: boolean
  disabled?: boolean
}

export default function UploadZone({ label, hint, accept = '.xlsx,.xls,.csv,.pdf,.docx,.jpg,.jpeg,.png', onFile, loading, disabled }: Props) {
  const [dragging, setDragging] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) { setFileName(file.name); onFile(file) }
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) { setFileName(file.name); onFile(file) }
  }

  return (
    <div
      onClick={() => !disabled && inputRef.current?.click()}
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center gap-3 transition-colors cursor-pointer ${
        disabled ? 'opacity-50 cursor-not-allowed' :
        dragging  ? 'border-teal-500 bg-teal-50' :
        fileName  ? 'border-teal-400 bg-teal-50' :
        'border-teal-300 hover:border-teal-400 hover:bg-teal-50'
      }`}
    >
      {loading ? (
        <div className="animate-spin h-10 w-10 border-4 border-teal-500 border-t-transparent rounded-full"/>
      ) : fileName ? (
        <CheckCircle size={48} className="text-teal-500"/>
      ) : (
        <UploadCloud size={48} className="text-teal-400"/>
      )}

      <div className="text-center">
        {fileName ? (
          <>
            <p className="font-semibold text-teal-600">{fileName}</p>
            <p className="text-xs text-charcoal-lighter mt-1">Datei ausgewählt ✓ — Klicken Sie hier, um eine andere Datei auszuwählen</p>
          </>
        ) : (
          <>
            <p className="font-semibold text-charcoal">{label ?? 'Datei hier ablegen'}</p>
            <p className="text-sm text-charcoal-lighter mt-1">{hint ?? 'oder klicken Sie hier, um eine Datei von Ihrem Computer auszuwählen'}</p>
          </>
        )}
        <p className="text-xs text-charcoal-lighter mt-2">Unterstützte Formate: Excel, Word, PDF, Fotos</p>
      </div>
      <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={handleChange} disabled={disabled}/>
    </div>
  )
}
