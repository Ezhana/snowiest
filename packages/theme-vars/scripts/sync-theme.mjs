import { writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { themeVarsCss } from '../src/theme.ts'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const themeFile = resolve(scriptDir, '../src/theme.css')

await writeFile(themeFile, `${themeVarsCss}\n`, 'utf8')
