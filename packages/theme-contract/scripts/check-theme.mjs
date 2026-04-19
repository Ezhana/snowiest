import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { themeContractCss } from '../src/theme.ts'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const themeFile = resolve(scriptDir, '../src/theme.css')
const expectedTheme = `${themeContractCss}\n`
const currentTheme = await readFile(themeFile, 'utf8')

if (currentTheme !== expectedTheme) {
  console.error('packages/theme-contract/src/theme.css is out of sync with src/contract.ts.')
  console.error('Run `pnpm --dir packages/theme-contract sync:theme` to regenerate it.')
  process.exit(1)
}
