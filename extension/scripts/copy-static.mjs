// Copy manifest.json and icons directory into dist/ after Vite build
import { copyFile, mkdir, cp } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = process.cwd()
const dist = resolve(root, 'dist')

async function main() {
  await mkdir(dist, { recursive: true })
  await copyFile(resolve(root, 'manifest.json'), resolve(dist, 'manifest.json'))
  // Copy managed storage schema (required by manifest reference)
  await copyFile(resolve(root, 'managed_schema.json'), resolve(dist, 'managed_schema.json')).catch(()=>{})
  // Copy icons directory if it exists
  await cp(resolve(root, 'icons'), resolve(dist, 'icons'), { force: true, recursive: true })
  console.log('Copied manifest.json, managed_schema.json, and icons/ to dist/')
}

main().catch((e) => { console.error(e); process.exit(1) })

