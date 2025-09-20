export type Tile =
  | { type: 'announcement'; title: string; body?: string }
  | { type: 'link'; label: string; url: string }
  | { type: 'app'; label: string; url: string; sso?: 'saml' | 'oidc' }

export type Section = { kind: 'grid'; tiles: Tile[] }
export type Page = { route: string; sections: Section[] }
export type Payload = {
  tenant: string
  version: string
  theme?: { logoUrl?: string; primary?: string; font?: string }
  pages: Page[]
}

