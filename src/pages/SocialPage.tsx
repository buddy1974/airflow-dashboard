import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Sparkles, Trash2 } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import Badge from '../components/Badge'
import api from '../lib/api'

interface SocialPost {
  id: string; titel?: string; inhalt: string; status: string
  plattform: string; createdAt: string
}

export default function SocialPage() {
  const [thema,      setThema]      = useState('')
  const [ton,        setTon]        = useState('')
  const [draft,      setDraft]      = useState('')
  const [draftId,    setDraftId]    = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const queryClient = useQueryClient()

  const { data: posts, isLoading } = useQuery({
    queryKey: ['social-posts'],
    queryFn:  () => api.get<{ success: boolean; posts: SocialPost[] }>('/social/posts').then(r => r.data.posts).catch(() => [] as SocialPost[]),
  })

  const publishMutation = useMutation({
    mutationFn: (id: string) => api.post(`/social/posts/${id}/publish`).then(r => r.data),
    onSuccess:  () => queryClient.invalidateQueries({ queryKey: ['social-posts'] }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/social/posts/${id}`).then(r => r.data),
    onSuccess:  () => queryClient.invalidateQueries({ queryKey: ['social-posts'] }),
  })

  const generateDraft = async () => {
    if (!thema.trim()) return
    setGenerating(true); setDraft(''); setDraftId(null)
    try {
      const res = await api.post<{ success: boolean; data: { inhalt?: string; id?: string; post?: SocialPost } }>('/social/draft', { thema, ton })
      const d = res.data.data
      setDraft(d.inhalt ?? d.post?.inhalt ?? '')
      setDraftId(d.id ?? d.post?.id ?? null)
      queryClient.invalidateQueries({ queryKey: ['social-posts'] })
    } catch {
      setDraft('KI-Post-Generator noch nicht verfügbar (Phase 12).')
    } finally {
      setGenerating(false)
    }
  }

  const publishDraft = async () => {
    if (!draftId) return
    publishMutation.mutate(draftId)
    setDraft(''); setDraftId(null)
  }

  const charCount = draft.length

  return (
    <div>
      <PageHeader title="Social Media" subtitle="Facebook-Posts für airflow" />

      {/* Draft generator */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6 max-w-2xl">
        <div className="flex gap-3 mb-4">
          <input
            value={thema}
            onChange={e => setThema(e.target.value)}
            placeholder="Thema des Posts"
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
          />
          <input
            value={ton}
            onChange={e => setTon(e.target.value)}
            placeholder="Ton (optional)"
            className="w-40 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
          />
        </div>
        <button onClick={generateDraft} disabled={generating || !thema.trim()}
          className="flex items-center gap-2 bg-teal-500 text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-teal-600 transition-colors disabled:opacity-50">
          {generating
            ? <><div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"/>Erstelle…</>
            : <><Sparkles size={16}/> KI-Post erstellen</>}
        </button>

        {draft && (
          <div className="mt-4">
            <div className="relative">
              <textarea
                value={draft}
                onChange={e => setDraft(e.target.value)}
                rows={5}
                className="w-full border-2 border-teal-200 rounded-xl p-4 text-sm text-charcoal bg-teal-50 resize-none focus:outline-none focus:ring-2 focus:ring-teal-400"
              />
              <span className={`absolute bottom-3 right-3 text-xs ${charCount > 280 ? 'text-red-500 font-semibold' : 'text-charcoal-lighter'}`}>
                {charCount}/280
              </span>
            </div>
            <div className="flex gap-2 mt-3">
              <button onClick={publishDraft}
                className="bg-teal-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-600 transition-colors">
                Veröffentlichen
              </button>
              <button onClick={() => { setDraft(''); setDraftId(null) }}
                className="bg-gray-100 text-charcoal px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
                Verwerfen
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Posts table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b bg-gray-50">
          <h3 className="font-semibold text-sm text-charcoal">Alle Posts</h3>
        </div>
        {isLoading ? (
          <div className="flex justify-center py-8"><div className="animate-spin h-8 w-8 border-4 border-teal-500 border-t-transparent rounded-full"/></div>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-xs text-charcoal-lighter uppercase bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">Datum</th>
                <th className="px-4 py-3 text-left">Inhalt</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Plattform</th>
                <th className="px-4 py-3 text-left">Aktionen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(posts ?? []).map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-charcoal-lighter whitespace-nowrap">{new Date(p.createdAt).toLocaleDateString('de-DE')}</td>
                  <td className="px-4 py-3 text-charcoal max-w-xs truncate">{p.titel ?? p.inhalt.slice(0, 60)}</td>
                  <td className="px-4 py-3"><Badge status={p.status}/></td>
                  <td className="px-4 py-3 text-charcoal-lighter">{p.plattform}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {p.status === 'ENTWURF' && (
                        <button onClick={() => publishMutation.mutate(p.id)}
                          className="text-xs bg-teal-100 text-teal-700 px-2.5 py-1 rounded-full font-medium hover:bg-teal-200">
                          Veröffentlichen
                        </button>
                      )}
                      <button onClick={() => deleteMutation.mutate(p.id)} className="text-red-400 hover:text-red-600">
                        <Trash2 size={14}/>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!posts?.length && <tr><td colSpan={5} className="px-4 py-8 text-center text-charcoal-lighter">Keine Posts</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
