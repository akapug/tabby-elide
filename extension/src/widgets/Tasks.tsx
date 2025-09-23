import React, { useEffect, useMemo, useState } from 'react'
import { getLocal } from '../lib/boot'

interface Task { id: string; text: string; done: boolean; createdAt: number }

export default function Tasks({ title }: { title?: string }) {
  const [base, setBase] = useState<string>('')
  const [tenant, setTenant] = useState<string>('dev')
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [error, setError] = useState<string | undefined>()

  useEffect(() => {
    let stopped = false
    const init = async (attempt = 0) => {
      try {
        const b = (await getLocal('base')).base || ''
        const t = (await getLocal('tenant')).tenant || 'dev'
        if (stopped) return
        setBase(b)
        setTenant(t)
        if (b) {
          const r = await fetch(`${b}/api/v1/tasks/${t}`, { cache: 'no-store' })
          const data = await r.json()
          if (stopped) return
          setTasks(Array.isArray(data.tasks) ? data.tasks : [])
          setLoading(false)
        } else if (attempt < 20) {
          setTimeout(() => init(attempt + 1), 500)
        } else {
          setLoading(false)
        }
      } catch (e) {
        console.warn('tasks init failed', e)
        if (!stopped) {
          setError('Unable to load tasks')
          setLoading(false)
        }
      }
    }
    init(0)
    return () => { stopped = true }
  }, [])

  const add = async () => {
    const body = text.trim()
    if (!body) return
    setError(undefined)
    try {
      const r = await fetch(`${base}/api/v1/tasks/${tenant}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: body }) })
      if (!r.ok) throw new Error('bad status')
      const task: Task = await r.json()
      setTasks((prev) => [task, ...prev])
      setText('')
    } catch (e) {
      console.warn('add failed', e)
      setError('Failed to add task')
    }
  }

  const toggle = async (id: string, done: boolean) => {
    setError(undefined)
    try {
      const r = await fetch(`${base}/api/v1/tasks/${tenant}/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ done }) })
      if (!r.ok) throw new Error('bad status')
      const updated: Task = await r.json()
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)))
    } catch (e) {
      console.warn('toggle failed', e)
      setError('Failed to update task')
    }
  }

  const remove = async (id: string) => {
    setError(undefined)
    try {
      const r = await fetch(`${base}/api/v1/tasks/${tenant}/${id}`, { method: 'DELETE' })
      if (!(r.ok || r.status === 204)) throw new Error('bad status')
      setTasks((prev) => prev.filter((t) => t.id !== id))
    } catch (e) {
      console.warn('delete failed', e)
      setError('Failed to delete task')
    }
  }

  const remaining = useMemo(() => tasks.filter((t) => !t.done).length, [tasks])

  return (
    <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 12, background: 'white' }}>
      <div style={{ fontWeight: 600, marginBottom: 8 }}>{title || 'Tasks'}{remaining ? ` • ${remaining} open` : ''}</div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') add() }}
          placeholder="Add a task and press Enter"
          style={{ flex: 1, padding: '6px 8px', border: '1px solid #cbd5e1', borderRadius: 6 }}
          disabled={loading || !base}
        />
        <button onClick={add} disabled={loading || !base || !text.trim()} style={{ padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: 6, background: '#f8fafc' }}>Add</button>
      </div>
      {error && <div style={{ color: '#b91c1c', marginTop: 8, fontSize: 12 }}>{error}</div>}
      <ul style={{ listStyle: 'none', padding: 0, margin: '10px 0 0 0', maxHeight: 260, overflow: 'auto' }}>
        {loading ? (
          <li style={{ color: '#64748b' }}>Loading…</li>
        ) : tasks.length === 0 ? (
          <li style={{ color: '#94a3b8' }}>No tasks yet.</li>
        ) : (
          tasks.map((t) => (
            <li key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
              <input type="checkbox" checked={t.done} onChange={(e) => toggle(t.id, e.target.checked)} />
              <span style={{ flex: 1, textDecoration: t.done ? 'line-through' : 'none', color: t.done ? '#64748b' : '#0f172a' }}>{t.text}</span>
              <button onClick={() => remove(t.id)} title="Delete" style={{ border: 'none', background: 'transparent', color: '#334155', cursor: 'pointer' }}>✕</button>
            </li>
          ))
        )}
      </ul>
      {!base && (
        <div style={{ color: '#b45309', fontSize: 12, marginTop: 8 }}>Waiting for backend to be detected. Ensure the control-plane server is running.</div>
      )}
    </div>
  )
}
