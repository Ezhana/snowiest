#!/usr/bin/env node
/**
 * Build step: derive `src/lib/tags.generated.ts` from `src/content/tags.json`.
 *
 * `--check` verifies the committed module is current without writing (useful in CI).
 */
import { relative } from 'node:path'
import process from 'node:process'
import { generateTags, GENERATED_FILE } from './tags.mjs'

const args = process.argv.slice(2)
const unknown = args.filter((arg) => arg !== '--check')

try {
  if (unknown.length > 0) {
    console.error(
      `✗ 未知参数：${unknown.join(' ')}。用法：node scripts/generate-tags.mjs [--check]`,
    )
    process.exitCode = 1
  } else {
    const check = args.includes('--check')
    const { tags, changed } = await generateTags({ check })
    const file = relative(process.cwd(), GENERATED_FILE)

    if (check) {
      console.log(`标签类型文件已是最新（${tags.length} 个标签）：${file}`)
    } else if (changed) {
      console.log(`已生成标签类型（${tags.length} 个标签）：${file}`)
    } else {
      console.log(`标签类型文件已是最新（${tags.length} 个标签）：${file}`)
    }
  }
} catch (error) {
  console.error(`✗ ${error.message}`)
  process.exitCode = 1
}
