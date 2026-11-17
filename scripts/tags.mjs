/**
 * Tag registry: validation, persistence and the generated TypeScript module.
 *
 * `src/content/tags.json` is the only source of truth. The site consumes
 * `src/lib/tags.generated.ts`, which this module derives; edit the JSON, not the generated file.
 */
import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const LANGUAGES = ['zh', 'en']

export const TAG_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const ROOT = fileURLToPath(new URL('..', import.meta.url))
export const TAGS_FILE = join(ROOT, 'src', 'content', 'tags.json')
export const GENERATED_FILE = join(ROOT, 'src', 'lib', 'tags.generated.ts')

function fail(message) {
  throw new Error(message)
}

async function formatSource(source, parser, file) {
  const { format, resolveConfig } = await import('prettier')
  const config = (await resolveConfig(file)) ?? {}
  return format(source, { ...config, parser })
}

function serializeTags(tags) {
  const objects = tags.map(
    (tag) =>
      `  { "id": ${JSON.stringify(tag.id)}, "label": { "zh": ${JSON.stringify(tag.label.zh)}, "en": ${JSON.stringify(tag.label.en)} } }`,
  )
  return `[\n${objects.join(',\n')}\n]\n`
}

function tsString(value) {
  return `'${value
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\r/g, '\\r')
    .replace(/\n/g, '\\n')}'`
}

/** Read and validate the tag registry. */
export async function readTags() {
  let source
  try {
    source = await readFile(TAGS_FILE, 'utf8')
  } catch (error) {
    fail(`无法读取标签文件 ${TAGS_FILE}：${error.message}`)
  }

  let parsed
  try {
    parsed = JSON.parse(source)
  } catch (error) {
    fail(`标签文件不是合法 JSON：${error.message}`)
  }

  if (!Array.isArray(parsed) || parsed.length === 0) {
    fail('标签文件必须是非空数组。')
  }

  const seen = new Set()

  return parsed.map((entry, index) => {
    const position = `第 ${index + 1} 个标签`

    if (!entry || typeof entry !== 'object') fail(`${position}必须是对象。`)

    const { id, label } = entry
    if (typeof id !== 'string' || !TAG_ID_PATTERN.test(id)) {
      fail(`${position}的 id 无效：只能使用小写英文字母、数字和连字符。`)
    }
    if (seen.has(id)) fail(`标签 id 重复：${id}`)
    seen.add(id)

    if (!label || typeof label !== 'object') fail(`标签 "${id}" 缺少 label。`)

    const labels = {}
    for (const lang of LANGUAGES) {
      const value = label[lang]
      if (typeof value !== 'string' || value.trim() === '') {
        fail(`标签 "${id}" 缺少 ${lang} 名称。`)
      }
      labels[lang] = value.trim()
    }

    return { id, label: labels }
  })
}

/** Persist the tag registry, keeping the JSON stable and Prettier-compatible. */
export async function writeTags(tags) {
  await writeFile(TAGS_FILE, await formatSource(serializeTags(tags), 'json', TAGS_FILE), 'utf8')
}

async function renderTagsModule(tags) {
  const definitions = tags.map(
    (tag) =>
      `  { id: ${tsString(tag.id)}, label: { zh: ${tsString(tag.label.zh)}, en: ${tsString(tag.label.en)} } },`,
  )
  const source = [
    '// Generated from src/content/tags.json by scripts/generate-tags.mjs.',
    '// Do not edit by hand: change the JSON and run `pnpm tags:generate`.',
    '',
    `export const TAG_IDS = [${tags.map((tag) => tsString(tag.id)).join(', ')}] as const`,
    '',
    'export type TagId = (typeof TAG_IDS)[number]',
    '',
    'export const TAG_DEFINITIONS = [',
    ...definitions,
    '] as const',
    '',
  ].join('\n')

  return formatSource(source, 'typescript', GENERATED_FILE)
}

/**
 * Regenerate `src/lib/tags.generated.ts` from the JSON registry. With `check`, verify that the
 * committed module is current instead of writing it.
 */
export async function generateTags({ check = false } = {}) {
  const tags = await readTags()
  const source = await renderTagsModule(tags)
  const current = await readFile(GENERATED_FILE, 'utf8').catch(() => '')
  const changed = current !== source

  if (check && changed) {
    fail(`标签类型文件已过期：${GENERATED_FILE}。运行 pnpm tags:generate 重新生成。`)
  }
  if (!check && changed) {
    await writeFile(GENERATED_FILE, source, 'utf8')
  }

  return { tags, changed }
}
