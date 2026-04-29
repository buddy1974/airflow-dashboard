interface Props { status: string }

const TEAL   = new Set(['AKTIV', 'KONFORM', 'BEZAHLT', 'GENEHMIGT', 'ABGESCHLOSSEN', 'GRUEN', 'EINGESTELLT'])
const YELLOW = new Set(['FAELLIG', 'AUSSTEHEND', 'BEANTRAGT', 'ENTWURF', 'GEPLANT'])
const RED    = new Set(['DEFEKT', 'KRITISCH', 'ROT', 'UEBERFAELLIG', 'ABGELEHNT', 'STORNIERT', 'ABGELAUFEN'])
const ORANGE = new Set(['WARTUNG', 'GELB', 'ABWESEND', 'IN_BEARBEITUNG', 'IN_PRUEFUNG'])

export default function Badge({ status }: Props) {
  let cls = 'bg-gray-100 text-gray-600'
  if (TEAL.has(status))   cls = 'bg-teal-100 text-teal-700'
  if (YELLOW.has(status)) cls = 'bg-yellow-100 text-yellow-700'
  if (RED.has(status))    cls = 'bg-red-100 text-red-700'
  if (ORANGE.has(status)) cls = 'bg-orange-100 text-orange-700'

  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {status.replace(/_/g, ' ')}
    </span>
  )
}
