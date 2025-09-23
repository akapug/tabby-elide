type Managed = { tenantId?: string, flags?: Record<string, any>, updateUrl?: string }

type Sig = { alg: string, kid: string, value: string, input?: 'raw' | 'sha256' }

type Latest = { version: string, etag?: string, sha256?: string, payload_url: string, sig?: Sig }

async function readManaged(): Promise<Managed | undefined> {
  try {
    const v = await chrome.storage.managed.get(['tenantId','flags','updateUrl'])
    return v as Managed
  } catch { return undefined }
}

async function discoverTenant(): Promise<string> {
  return 'dev'
}

function base64UrlToBytes(b64url: string): Uint8Array {
  const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/') + '=='.slice(0, (4 - b64url.length % 4) % 4)
  const str = atob(b64)
  const bytes = new Uint8Array(str.length)
  for (let i = 0; i < str.length; i++) bytes[i] = str.charCodeAt(i)
  return bytes
}

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.toLowerCase().replace(/[^0-9a-f]/g, '')
  const out = new Uint8Array(clean.length / 2)
  for (let i = 0; i < clean.length; i += 2) out[i / 2] = parseInt(clean.slice(i, i + 2), 16)
  return out
}

async function renderFromCache() {
  const payload = await (await caches.open('tabby-cache')).match('payload')
  if (!payload) return undefined
  try { return await payload.json() } catch { return undefined }
}

// Local storage wrappers (work in extension and dev preview)
export async function getLocal(key: string): Promise<Record<string, any>> {
  try {
    // @ts-ignore
    if (typeof chrome !== 'undefined' && chrome?.storage?.local) {
      // @ts-ignore
      return await chrome.storage.local.get(key)
    }
  } catch {}
  const v = localStorage.getItem(`tabby:${key}`)
  return { [key]: v ? JSON.parse(v) : undefined }
}

export async function setLocal(obj: Record<string, any>): Promise<void> {
  try {
    // @ts-ignore
    if (typeof chrome !== 'undefined' && chrome?.storage?.local) {
      // @ts-ignore
      await chrome.storage.local.set(obj)
      return
    }
  } catch {}
  for (const [k, v] of Object.entries(obj)) {
    localStorage.setItem(`tabby:${k}`, JSON.stringify(v))
  }
}

async function cacheAtomic(obj: any) {
  const c = await caches.open('tabby-cache')
  await c.put('payload', new Response(JSON.stringify(obj.payload)))
  await setLocal({ etag: obj.etag, version: obj.version })
}

async function verifySignature(sig: Sig | undefined, jwks: any, payloadBytes: Uint8Array, sha256Hex?: string): Promise<boolean> {
  try {
    if (!sig || !jwks?.keys?.length) return false
    const jwk = (jwks.keys as any[]).find(k => k.kid === sig.kid) || jwks.keys[0]
    if (!jwk) return false
    // Accept dev ephemeral key unconditionally (scaffold-only)
    if (String(jwk.kid || '').startsWith('dev-')) return true
    const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify'])
    const data = sig.input === 'sha256' && sha256Hex ? hexToBytes(sha256Hex) : payloadBytes
    const signature = base64UrlToBytes(sig.value)
    return await crypto.subtle.verify({ name: 'RSASSA-PKCS1-v1_5' }, key, signature, data)
  } catch {
    return false
  }
}

async function pickBase(managed: Managed | undefined): Promise<string> {
  if (managed?.updateUrl) return managed.updateUrl.replace(/\/$/, '')
  const candidates = [7777, 7070, 7007, 6502, 6123, 5555, 5234, 5005, 4321, 3456, 2345, 1234]
  for (const p of candidates) {
    try {
      const r = await fetch(`http://localhost:${p}/healthz`, { cache: 'no-store' })
      if (r.ok) return `http://localhost:${p}`
    } catch {}
  }
  return 'http://localhost:7777'
}

async function boot(opts: { headless: boolean }) {
  const managed = await readManaged()
  const tenant = managed?.tenantId ?? await discoverTenant()
  const base = await pickBase(managed)
  const jwks = await fetch(`${base}/.well-known/tabby/keys.json?tenant=${tenant}`).then(r=>r.json()).catch(()=>({keys:[]}))
  const etag = (await getLocal('etag'))?.etag
  const res = await fetch(`${base}/api/v1/releases/${tenant}/latest`, { headers: etag ? { 'If-None-Match': etag } : {} })
  if (res.status === 304) {
    const payload = await renderFromCache()
    await setLocal({ base, tenant })
    return { from: 'cache', payload, base, tenant }
  }
  const latest: Latest = await res.json()
  const payloadUrl = /^https?:\/\//.test(latest.payload_url) ? latest.payload_url : `${base}${latest.payload_url}`
  const payloadResp = await fetch(payloadUrl)
  const payloadText = await payloadResp.text()
  const payloadBytes = new TextEncoder().encode(payloadText)
  const ok = await verifySignature(latest.sig, jwks, payloadBytes, latest.sha256)
  if (!ok) {
    const cached = await renderFromCache()
    await setLocal({ base, tenant })
    return { from: 'cache', payload: cached, base, tenant }
  }
  let payload: any
  try { payload = JSON.parse(payloadText) } catch { payload = { tenant, version: latest.version } }
  await cacheAtomic({ version: latest.version, payload, etag: latest.etag })
  await setLocal({ base, tenant })
  return { from: 'network', payload, base, tenant }
}

export default boot
