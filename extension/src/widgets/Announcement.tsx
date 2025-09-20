import React from 'react'

export default function Announcement(props: { title: string; body?: string }) {
  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12, background: '#f8fafc' }}>
      <div style={{ fontWeight: 600, marginBottom: 6 }}>📣 {props.title}</div>
      {props.body && <div style={{ color: '#334155' }}>{props.body}</div>}
    </div>
  )
}

