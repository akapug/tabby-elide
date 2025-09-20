import React from 'react'

export default function LinkTile(props: { label: string; url: string }) {
  return (
    <a href={props.url} target="_blank" rel="noreferrer"
       style={{ display: 'block', border: '1px solid #e5e7eb', borderRadius: 8, padding: 12, textDecoration: 'none' }}>
      <div style={{ fontWeight: 600 }}>
        🔗 {props.label}
      </div>
      <div style={{ color: '#64748b', fontSize: 12 }}>{props.url}</div>
    </a>
  )
}

