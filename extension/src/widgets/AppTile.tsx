import React from 'react'

export default function AppTile(props: { label: string; url: string; sso?: 'saml' | 'oidc' }) {
  return (
    <a href={props.url} target="_blank" rel="noreferrer"
       style={{ display: 'block', border: '1px solid #e5e7eb', borderRadius: 8, padding: 12, textDecoration: 'none' }}>
      <div style={{ fontWeight: 600 }}>
        💻 {props.label} {props.sso ? <span style={{ color: '#64748b', fontSize: 12 }}>(SSO: {props.sso.toUpperCase()})</span> : null}
      </div>
    </a>
  )
}

