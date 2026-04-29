import { useState, useRef, ChangeEvent } from 'react'
import { Camera, CheckCircle, AlertCircle } from 'lucide-react'
import api from '../lib/api'

interface Props {
  onScan:  (data: Record<string, string>) => void
  label?:  string
  type?:   string
}

export default function OcrUpload({ onScan, label, type }: Props) {
  const [scanning,  setScanning]  = useState(false)
  const [done,      setDone]      = useState(false)
  const [error,     setError]     = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setScanning(true); setError(''); setDone(false)
    const fd = new FormData()
    fd.append('file', file)
    if (type) fd.append('type', type)
    try {
      const res = await api.post<{ success: boolean; data: Record<string, string> }>('/ai/ocr', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      onScan(res.data.data)
      setDone(true)
    } catch {
      setError('OCR-Funktion noch nicht verfügbar. Sie können die Werte manuell eintragen.')
    } finally {
      setScanning(false)
    }
  }

  return (
    <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 flex flex-col items-center gap-3 bg-gray-50">
      <div className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center">
        <Camera size={32} className="text-teal-500"/>
      </div>
      <div className="text-center">
        <p className="font-semibold text-charcoal">{label ?? 'Papierformular fotografieren oder scannen'}</p>
        <p className="text-sm text-charcoal-lighter mt-1 max-w-sm">
          Haben Sie ein ausgefülltes Papierformular? Laden Sie ein Foto hoch — wir lesen die Werte automatisch ein.
        </p>
        <p className="text-xs text-charcoal-lighter mt-2">Akzeptierte Dateien: Fotos (.jpg, .png), PDF-Dateien, eingescannte Formulare</p>
      </div>

      {done   && <div className="flex items-center gap-2 text-teal-600 text-sm"><CheckCircle size={16}/> Daten erfolgreich eingelesen!</div>}
      {error  && <div className="flex items-center gap-2 text-yellow-700 text-sm bg-yellow-50 px-3 py-2 rounded-lg"><AlertCircle size={16}/> {error}</div>}
      {scanning && <div className="animate-spin h-6 w-6 border-2 border-teal-500 border-t-transparent rounded-full"/>}

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={scanning}
        className="bg-teal-500 hover:bg-teal-600 text-white font-medium px-5 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50 flex items-center gap-2"
      >
        <Camera size={16}/> {scanning ? 'Wird eingelesen…' : 'Datei auswählen oder Foto hochladen'}
      </button>
      <input ref={inputRef} type="file" accept=".jpg,.jpeg,.png,.pdf" className="hidden" onChange={handleFile}/>
      <p className="text-xs text-charcoal-lighter italic">Diese Funktion liest Ihre handschriftlichen Formulare automatisch ein</p>
    </div>
  )
}
