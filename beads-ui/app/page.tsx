'use client'

import { useState, useEffect, useCallback } from 'react'

type BeadRow = {
  id: string
  title: string
  status: string
  issue_type: string
  priority: number
}

type BeadDetail = BeadRow & {
  description?: string
  design?: string
  acceptance_criteria?: string
  notes?: string
  assignee?: string
  owner?: string
  created_at?: string
  updated_at?: string
  closed_at?: string
  estimated_minutes?: number
  rig?: string
  labels?: string[]
  dependencies?: string[]
}

function statusChip(s: string) {
  const base = 'inline-block px-2 py-0.5 rounded text-xs font-medium'
  if (s === 'open') return `${base} bg-blue-900/60 text-blue-300`
  if (s === 'closed') return `${base} bg-zinc-800 text-zinc-500`
  if (s === 'in_progress') return `${base} bg-green-900/60 text-green-300`
  if (s === 'blocked') return `${base} bg-red-900/60 text-red-400`
  if (s === 'deferred') return `${base} bg-yellow-900/60 text-yellow-400`
  if (s === 'pinned') return `${base} bg-purple-900/60 text-purple-300`
  return `${base} bg-zinc-800 text-zinc-400`
}

function Field({ label, value }: { label: string; value?: string | number | null }) {
  if (value == null || value === '') return null
  return (
    <div>
      <p className="text-xs text-zinc-500 mb-0.5">{label}</p>
      <p className="text-sm text-zinc-200 whitespace-pre-wrap break-words">{String(value)}</p>
    </div>
  )
}

function DetailPanel({ id }: { id: string }) {
  const [bead, setBead] = useState<BeadDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/beads/${id}`)
      .then((r) => { if (!r.ok) throw new Error(`${r.status}`); return r.json() })
      .then((d) => { setBead(d); setLoading(false) })
      .catch(() => { setErr('Failed to load bead'); setLoading(false) })
  }, [id])

  if (loading) return <p className="text-zinc-500 text-sm p-6">Loading…</p>
  if (err || !bead) return <p className="text-red-400 text-sm p-6">{err ?? 'Not found'}</p>

  return (
    <div className="p-5 space-y-5 overflow-y-auto h-full">
      <div>
        <span className="font-mono text-xs text-zinc-500">{bead.id}</span>
        <h2 className="text-lg font-semibold text-zinc-100 mt-1">{bead.title}</h2>
        <div className="flex flex-wrap gap-2 mt-2">
          <span className={statusChip(bead.status)}>{bead.status}</span>
          {bead.issue_type && (
            <span className="inline-block px-2 py-0.5 rounded text-xs bg-zinc-800 text-zinc-400">
              {bead.issue_type}
            </span>
          )}
          {bead.priority != null && (
            <span className="inline-block px-2 py-0.5 rounded text-xs bg-zinc-800 text-zinc-400">
              P{bead.priority}
            </span>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <Field label="Description" value={bead.description} />
        <Field label="Design" value={bead.design} />
        <Field label="Acceptance Criteria" value={bead.acceptance_criteria} />
        <Field label="Notes" value={bead.notes} />
      </div>

      <div className="grid grid-cols-2 gap-3 border-t border-zinc-800 pt-4">
        <Field label="Assignee" value={bead.assignee} />
        <Field label="Owner" value={bead.owner} />
        <Field label="Rig" value={bead.rig} />
        <Field label="Est. minutes" value={bead.estimated_minutes} />
        <Field label="Created" value={bead.created_at} />
        <Field label="Updated" value={bead.updated_at} />
        <Field label="Closed" value={bead.closed_at} />
      </div>

      {bead.labels && bead.labels.length > 0 && (
        <div className="border-t border-zinc-800 pt-4">
          <p className="text-xs text-zinc-500 mb-1.5">Labels</p>
          <div className="flex flex-wrap gap-1.5">
            {bead.labels.map((l) => (
              <span key={l} className="px-2 py-0.5 rounded text-xs bg-indigo-900/50 text-indigo-300">
                {l}
              </span>
            ))}
          </div>
        </div>
      )}

      {bead.dependencies && bead.dependencies.length > 0 && (
        <div className="border-t border-zinc-800 pt-4">
          <p className="text-xs text-zinc-500 mb-1.5">Dependencies</p>
          <div className="flex flex-wrap gap-1.5">
            {bead.dependencies.map((d) => (
              <span key={d} className="px-2 py-0.5 rounded font-mono text-xs bg-zinc-800 text-zinc-400">
                {d}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function Home() {
  const [beads, setBeads] = useState<BeadRow[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<string | null>(null)
  const [filter, setFilter] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/beads')
      setBeads(await res.json())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const visible = filter
    ? beads.filter((b) =>
        b.id.includes(filter) ||
        b.title.toLowerCase().includes(filter.toLowerCase()) ||
        b.status.includes(filter) ||
        b.issue_type.includes(filter)
      )
    : beads

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left panel — bead list */}
      <div className="w-80 shrink-0 flex flex-col border-r border-zinc-800">
        <div className="p-3 border-b border-zinc-800 shrink-0">
          <h1 className="text-sm font-semibold text-zinc-300 mb-2">Beads</h1>
          <input
            className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1.5 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-600"
            placeholder="Filter…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <p className="text-zinc-500 text-xs p-4">Loading…</p>
          ) : visible.length === 0 ? (
            <p className="text-zinc-600 text-xs p-4">
              {filter ? 'No matches.' : 'No beads.'}
            </p>
          ) : (
            visible.map((b) => (
              <button
                key={b.id}
                onClick={() => setSelected(b.id)}
                className={`w-full text-left px-3 py-2.5 border-b border-zinc-800/50 hover:bg-zinc-900 transition-colors ${
                  selected === b.id ? 'bg-zinc-900 border-l-2 border-l-indigo-500' : ''
                }`}
              >
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="font-mono text-[10px] text-zinc-600 shrink-0">{b.id}</span>
                  <span className={statusChip(b.status)}>{b.status}</span>
                </div>
                <p className="text-xs text-zinc-200 truncate leading-snug">{b.title}</p>
                <div className="flex gap-2 mt-0.5">
                  <span className="text-[10px] text-zinc-600">{b.issue_type}</span>
                  <span className="text-[10px] text-zinc-600">P{b.priority}</span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Right panel — bead detail */}
      <div className="flex-1 overflow-hidden">
        {selected ? (
          <DetailPanel key={selected} id={selected} />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-zinc-600 text-sm">Select a bead to view details</p>
          </div>
        )}
      </div>
    </div>
  )
}
