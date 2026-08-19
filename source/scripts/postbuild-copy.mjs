import { cpSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'

const root = process.cwd()
const standaloneDir = join(root, '.next', 'standalone')
const nextStaticDir = join(root, '.next', 'static')
const publicDir = join(root, 'public')
const standaloneStaticDir = join(standaloneDir, '.next', 'static')
const standalonePublicDir = join(standaloneDir, 'public')

function copyDir(source, target) {
  if (!existsSync(source)) return
  mkdirSync(dirname(target), { recursive: true })
  cpSync(source, target, { recursive: true, force: true })
}

copyDir(nextStaticDir, standaloneStaticDir)
copyDir(publicDir, standalonePublicDir)

console.log(`Copied standalone assets to ${standaloneDir}`)
