import React, { useEffect, useState } from 'react'
import type { Payload, Tile } from './types'
import Announcement from '../widgets/Announcement'
import LinkTile from '../widgets/LinkTile'
import AppTile from '../widgets/AppTile'
import Tasks from '../widgets/Tasks'

function TileRenderer({ tile }: { tile: Tile }) {
  switch (tile.type) {
    case 'announcement': return <Announcement title={tile.title} body={tile.body} />
    case 'link': return <LinkTile label={tile.label} url={tile.url} />
    case 'app': return <AppTile label={tile.label} url={tile.url} sso={tile.sso} />
    case 'tasks': return <Tasks title={tile.title} />
    default: return null
  }
}

export default function App() {
  const [state, setState] = useState<{ loading: boolean; payload?: Payload }>({ loading: true })

  useEffect(() => {
    (async () => {
      const { default: boot } = await import('../lib/boot')
      const result = await boot({ headless: false })
      setState({ loading: false, payload: result?.payload as Payload | undefined })
    })()
  }, [])

  if (state.loading) return <div style={{ padding: 24 }}>Loading…</div>

  const payload = state.payload || { theme: { primary: '#0EA5E9' }, pages: [] as any[] } as any
  const page = payload.pages?.[0]
  const sections = page?.sections || []

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      <header style={{ padding: 16, background: payload.theme?.primary || '#0EA5E9', color: 'white' }}>Tabby</header>
      <main style={{ padding: 16 }}>
        {sections.length === 0 ? (
          <div style={{ color: '#64748b' }}>No content yet.</div>
        ) : (
          sections.map((s, idx) => (
            <div key={idx} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12, marginBottom: 16 }}>
              {s.tiles.map((t, i) => (
                <React.Fragment key={i}>
                  <TileRenderer tile={t as Tile} />
                </React.Fragment>
              ))}
            </div>
          ))
        )}
      </main>
    </div>
  )
}
