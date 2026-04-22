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
  dependencies?: { depends_on_id: string; type?: string }[]
}

type FormState = {
  title: string
  description: string
  status: string
  issue_type: string
  priority: number
  assignee: string
  notes: string
}

const STATUSES = ['open', 'closed', 'blocked', 'in_progress', 'deferred']
const TYPES = ['task', 'convoy', 'event', 'wisp']
const PRIORITIES = [1, 2, 3, 4, 5]

const emptyForm: FormState = {
  title: '',
  description: '',
  status: 'open',
  issue_type: 'task',
  priority: 2,
  assignee: '',
  notes: '',
}

function statusChip(s: string) {
  const base = 'inline-block px-2 py-0.5 rounded text-xs font-medium'
  if (s === 'open') return `${base} bg-blue-100 text-blue-700`
  if (s === 'closed') return `${base} bg-zinc-100 text-red-700`
  if (s === 'in_progress') return `${base} bg-green-100 text-green-700`
  if (s === 'blocked') return `${base} bg-red-100 text-red-700`
  if (s === 'deferred') return `${base} bg-yellow-100 text-yellow-700`
  if (s === 'pinned') return `${base} bg-purple-100 text-purple-700`
  return `${base} bg-zinc-100 text-red-600`
}

function Field({ label, value }: { label: string; value?: string | number | null }) {
  if (value == null || value === '') return null
  return (
    <div>
      <p className="text-xs text-red-700 mb-0.5">{label}</p>
      <p className="text-sm text-red-900 whitespace-pre-wrap break-words">{String(value)}</p>
    </div>
  )
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-red-700 mb-1">{label}</label>
      {children}
    </div>
  )
}

const inputCls = 'w-full border border-zinc-300 rounded px-2.5 py-1.5 text-sm text-red-900 focus:outline-none focus:border-zinc-500'
const selectCls = `${inputCls} bg-white`

function BeadModal({
  mode,
  editId,
  initialForm,
  onClose,
  onSaved,
}: {
  mode: 'create' | 'edit'
  editId?: string
  initialForm: FormState
  onClose: () => void
  onSaved: (id: string) => void
}) {
  const [form, setForm] = useState<FormState>(initialForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function save() {
    setSaving(true)
    setError(null)
    try {
      const url = mode === 'edit' ? `/api/beads/${editId}` : '/api/beads'
      const method = mode === 'edit' ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, assignee: form.assignee || null }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Save failed'); return }
      onSaved(mode === 'edit' ? editId! : data.id)
    } catch {
      setError('Network error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white border border-zinc-200 rounded-xl w-full max-w-lg shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200">
          <h2 className="text-base font-semibold text-red-900">
            {mode === 'create' ? 'New Bead' : `Edit ${editId}`}
          </h2>
          <button onClick={onClose} className="text-red-600 hover:text-red-800 text-xl leading-none">×</button>
        </div>
        <div className="p-5 space-y-3 max-h-[70vh] overflow-y-auto">
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <FormField label="Title *">
            <input className={inputCls} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} autoFocus />
          </FormField>
          <FormField label="Description">
            <textarea className={inputCls} rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </FormField>
          <div className="grid grid-cols-3 gap-3">
            <FormField label="Status">
              <select className={selectCls} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </FormField>
            <FormField label="Type">
              <select className={selectCls} value={form.issue_type} onChange={(e) => setForm({ ...form, issue_type: e.target.value })}>
                {TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </FormField>
            <FormField label="Priority">
              <select className={selectCls} value={form.priority} onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })}>
                {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </FormField>
          </div>
          <FormField label="Assignee">
            <input className={inputCls} value={form.assignee} onChange={(e) => setForm({ ...form, assignee: e.target.value })} placeholder="Optional" />
          </FormField>
          <FormField label="Notes">
            <textarea className={inputCls} rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </FormField>
        </div>
        <div className="flex gap-3 justify-end px-5 py-4 border-t border-zinc-200">
          <button onClick={onClose} className="px-4 py-1.5 text-sm text-red-700 hover:text-red-900 transition-colors">Cancel</button>
          <button
            onClick={save}
            disabled={saving || !form.title.trim()}
            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-lg text-sm font-medium transition-colors"
          >
            {saving ? 'Saving…' : mode === 'create' ? 'Create' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

function DetailPanel({
  id,
  onEdit,
  onDeleted,
}: {
  id: string
  onEdit: (bead: BeadDetail) => void
  onDeleted: () => void
}) {
  const [bead, setBead] = useState<BeadDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    setLoading(true)
    setBead(null)
    setErr(null)
    fetch(`/api/beads/${id}`)
      .then((r) => { if (!r.ok) throw new Error(`${r.status}`); return r.json() })
      .then((d) => { setBead(d); setLoading(false) })
      .catch(() => { setErr('Failed to load bead'); setLoading(false) })
  }, [id])

  async function handleDelete() {
    if (!confirm(`Delete ${id}?`)) return
    setDeleting(true)
    await fetch(`/api/beads/${id}`, { method: 'DELETE' })
    onDeleted()
  }

  if (loading) return <p className="text-red-600 text-sm p-6">Loading…</p>
  if (err || !bead) return <p className="text-red-500 text-sm p-6">{err ?? 'Not found'}</p>

  return (
    <div className="p-5 space-y-5 overflow-y-auto h-full">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <span className="font-mono text-xs text-red-600">{bead.id}</span>
          <h2 className="text-lg font-semibold text-red-900 mt-1">{bead.title}</h2>
          <div className="flex flex-wrap gap-2 mt-2">
            <span className={statusChip(bead.status)}>{bead.status}</span>
            {bead.issue_type && (
              <span className="inline-block px-2 py-0.5 rounded text-xs bg-zinc-100 text-red-600">{bead.issue_type}</span>
            )}
            {bead.priority != null && (
              <span className="inline-block px-2 py-0.5 rounded text-xs bg-zinc-100 text-red-600">P{bead.priority}</span>
            )}
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => onEdit(bead)}
            className="px-3 py-1.5 text-xs border border-zinc-300 rounded-lg text-red-700 hover:bg-zinc-50 transition-colors"
          >
            Edit
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="px-3 py-1.5 text-xs border border-red-200 rounded-lg text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
          >
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <Field label="Description" value={bead.description} />
        <Field label="Design" value={bead.design} />
        <Field label="Acceptance Criteria" value={bead.acceptance_criteria} />
        <Field label="Notes" value={bead.notes} />
      </div>

      <div className="grid grid-cols-2 gap-3 border-t border-zinc-200 pt-4">
        <Field label="Assignee" value={bead.assignee} />
        <Field label="Owner" value={bead.owner} />
        <Field label="Rig" value={bead.rig} />
        <Field label="Est. minutes" value={bead.estimated_minutes} />
        <Field label="Created" value={bead.created_at} />
        <Field label="Updated" value={bead.updated_at} />
        <Field label="Closed" value={bead.closed_at} />
      </div>

      {bead.labels && bead.labels.length > 0 && (
        <div className="border-t border-zinc-200 pt-4">
          <p className="text-xs text-red-700 mb-1.5">Labels</p>
          <div className="flex flex-wrap gap-1.5">
            {bead.labels.map((l) => (
              <span key={l} className="px-2 py-0.5 rounded text-xs bg-indigo-50 text-indigo-700">{l}</span>
            ))}
          </div>
        </div>
      )}

      {bead.dependencies && bead.dependencies.length > 0 && (
        <div className="border-t border-zinc-200 pt-4">
          <p className="text-xs text-red-700 mb-1.5">Dependencies</p>
          <div className="flex flex-wrap gap-1.5">
            {bead.dependencies.map((d) => (
              <span key={d.depends_on_id} className="px-2 py-0.5 rounded font-mono text-xs bg-zinc-100 text-red-700">
                {d.type ? `${d.type}: ` : ''}{d.depends_on_id}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="border-t border-zinc-200 pt-4">
        <p className="text-xs text-red-700 mb-1.5">Raw JSON</p>
        <pre className="text-xs text-red-800 bg-zinc-50 border border-zinc-200 rounded p-3 overflow-x-auto whitespace-pre-wrap break-all">
          {JSON.stringify(bead, null, 2)}
        </pre>
      </div>
    </div>
  )
}

export default function Home() {
  const [beads, setBeads] = useState<BeadRow[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<string | null>(null)
  const [filter, setFilter] = useState('')
  const [modal, setModal] = useState<{ mode: 'create' | 'edit'; editId?: string; form: FormState } | null>(null)

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

  function openEdit(bead: BeadDetail) {
    setModal({
      mode: 'edit',
      editId: bead.id,
      form: {
        title: bead.title ?? '',
        description: bead.description ?? '',
        status: bead.status ?? 'open',
        issue_type: bead.issue_type ?? 'task',
        priority: bead.priority ?? 2,
        assignee: bead.assignee ?? '',
        notes: bead.notes ?? '',
      },
    })
  }

  function handleSaved(id: string) {
    setModal(null)
    setSelected(id)
    load()
  }

  function handleDeleted() {
    setSelected(null)
    load()
  }

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
      <div className="w-80 shrink-0 flex flex-col border-r border-zinc-200">
        <div className="p-3 border-b border-zinc-200 shrink-0">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-sm font-semibold text-red-900">Beads</h1>
            <button
              onClick={() => setModal({ mode: 'create', form: emptyForm })}
              className="px-2.5 py-1 text-xs bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
            >
              + New
            </button>
          </div>
          <input
            className="w-full bg-white border border-zinc-300 rounded px-2 py-1.5 text-xs text-red-900 placeholder-red-600 focus:outline-none focus:border-zinc-500"
            placeholder="Filter…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <p className="text-red-600 text-xs p-4">Loading…</p>
          ) : visible.length === 0 ? (
            <p className="text-red-600 text-xs p-4">{filter ? 'No matches.' : 'No beads.'}</p>
          ) : (
            visible.map((b) => (
              <button
                key={b.id}
                onClick={() => setSelected(b.id)}
                className={`w-full text-left px-3 py-2.5 border-b border-zinc-100 hover:bg-zinc-50 transition-colors ${
                  selected === b.id ? 'bg-zinc-50 border-l-2' : ''
                }`}
                style={selected === b.id ? { borderLeftColor: 'AccentColor' } : undefined}
              >
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="font-mono text-[10px] text-red-600 shrink-0">{b.id}</span>
                  <span className={statusChip(b.status)}>{b.status}</span>
                </div>
                <p className="text-xs text-red-900 truncate leading-snug">{b.title}</p>
                <div className="flex gap-2 mt-0.5">
                  <span className="text-[10px] text-red-600">{b.issue_type}</span>
                  <span className="text-[10px] text-red-600">P{b.priority}</span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Right panel — bead detail */}
      <div className="flex-1 overflow-hidden">
        {selected ? (
          <DetailPanel
            key={selected}
            id={selected}
            onEdit={openEdit}
            onDeleted={handleDeleted}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-red-600 text-sm">Select a bead to view details</p>
          </div>
        )}
      </div>

      {modal && (
        <BeadModal
          mode={modal.mode}
          editId={modal.editId}
          initialForm={modal.form}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}
