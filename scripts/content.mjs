#!/usr/bin/env node
/**
 * Content CLI.
 *
 * Creates and edits content under `src/content/` from the terminal. It runs on plain Node,
 * outside Vite: shared paths and the moment filename format come from dependency-free TypeScript
 * modules, while tags are read from and written to `src/content/tags.json`.
 */
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, relative } from 'node:path'
import process from 'node:process'
import { createInterface } from 'node:readline/promises'
import { fileURLToPath } from 'node:url'
import {
  BLOG_CONTENT_DIR,
  LINKS_CONTENT_DIR,
  MOMENTS_CONTENT_DIR,
} from '../src/lib/content-paths.ts'
import { momentIdFromDate } from '../src/lib/moment-id.ts'
import {
  generateTags,
  GENERATED_FILE,
  readTags,
  TAG_ID_PATTERN,
  TAGS_FILE,
  writeTags,
} from './tags.mjs'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const LANGS = ['zh', 'en']
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const HOSTNAME_PATTERN =
  /^(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}|localhost|(?:\d{1,3}\.){3}\d{1,3}|\[[0-9a-f:]+\])$/i

async function usageText() {
  const tags = await loadTags()

  return `用法：pnpm content <command> [options]

命令：
  moment add [内容...] [--tag <id>]... [--lang zh|en]
      发布一条动态。不带内容时：管道输入会作为正文，终端中会打开 $EDITOR。
  blog new [slug] [--title <标题>] [--description <摘要>] [--tag <id>]... [--lang zh|en]
           [--no-edit]
      创建草稿文章（元数据 + draft: true），随后在 $EDITOR 中写正文。
  blog publish <slug>
      把文章目录下所有语言版本的 draft 设为 false。
  link add <url> [--name <中文名>] [--name-en <英文名>] [--slug <id>]
           [--description <中文介绍>] [--description-en <英文介绍>] [--tag <id>]
      添加一个链接（友链、工具、常逛的站点等）。
  tag add <id> [--zh <中文名>] [--en <英文名>]
      添加标签，并重新生成标签类型。
  tag list
      列出全部标签。
  tag remove <id>
      删除未被内容引用的标签。

可用标签：${tags.map((tag) => tag.id).join(', ')}
动态文件名：YYYY-MM-DDTHH-mm-ss+HHMM.md（本地时间，自动生成）
`
}

class CliError extends Error {}

let promptInterface

function fail(message) {
  throw new CliError(message)
}

async function loadTags() {
  try {
    return await readTags()
  } catch (error) {
    fail(error.message)
  }
}

function log(message) {
  console.log(message)
}

function relativeToRoot(file) {
  return relative(ROOT, file)
}

function pad(value) {
  return String(value).padStart(2, '0')
}

function yaml(value) {
  return JSON.stringify(value)
}

function today() {
  const date = new Date()
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function isInteractive() {
  return Boolean(process.stdin.isTTY)
}

function parseArgs(argv, spec) {
  const positionals = []
  const values = new Map()
  const flags = new Set()

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]

    if (argument === '--') {
      positionals.push(...argv.slice(index + 1))
      break
    }

    if (!argument.startsWith('--')) {
      if (argument.startsWith('-') && argument !== '-') {
        fail(`未知选项：${argument}`)
      }
      positionals.push(argument)
      continue
    }

    const rawName = argument.slice(2)
    const equals = rawName.indexOf('=')
    const name = equals === -1 ? rawName : rawName.slice(0, equals)

    if (spec.booleans.includes(name)) {
      if (equals !== -1) fail(`选项 --${name} 不接受值。`)
      flags.add(name)
      continue
    }

    if (!spec.values.includes(name)) {
      fail(`未知选项：--${name}`)
    }

    const inline = equals === -1 ? undefined : rawName.slice(equals + 1)
    const value = inline ?? argv[index + 1]

    if (value === undefined || (inline === undefined && value.startsWith('--'))) {
      fail(`选项 --${name} 需要一个值。`)
    }
    if (value === '') {
      fail(`选项 --${name} 不能为空。`)
    }

    const entries = values.get(name)
    if (entries) {
      entries.push(value)
    } else {
      values.set(name, [value])
    }
    if (inline === undefined) index += 1
  }

  return { positionals, values, flags }
}

function getValue(values, name) {
  const entries = values.get(name)
  return entries?.[entries.length - 1]
}

let tagIdsPromise

function tagIds() {
  tagIdsPromise ??= loadTags().then((tags) => tags.map((tag) => tag.id))
  return tagIdsPromise
}

async function validateTags(tags) {
  const ids = await tagIds()
  const unique = [...new Set(tags)]

  for (const tag of unique) {
    if (!ids.includes(tag)) {
      fail(`未知标签 "${tag}"。可用标签：${ids.join(', ')}。`)
    }
  }

  return unique
}

async function tagsFromValues(values) {
  return validateTags(values.get('tag') ?? [])
}

async function parseTagAnswer(answer) {
  return validateTags(
    answer
      .split(/[,，\s]+/)
      .map((tag) => tag.trim())
      .filter(Boolean),
  )
}

function slugify(text) {
  return text
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function assertSlug(slug) {
  if (!SLUG_PATTERN.test(slug)) {
    fail(`无效的 slug "${slug}"：只能使用小写英文字母、数字和连字符。`)
  }
}

function validateLang(values) {
  const lang = getValue(values, 'lang') ?? 'zh'
  if (!LANGS.includes(lang)) {
    fail(`无效的语言 "${lang}"：可选 ${LANGS.join('、')}。`)
  }
  return lang
}

function prompt() {
  promptInterface ??= createInterface({ input: process.stdin, output: process.stdout })
  return promptInterface
}

function closePrompt() {
  promptInterface?.close()
  promptInterface = undefined
}

async function ask(question, { defaultValue = '', optional = false } = {}) {
  const suffix = defaultValue ? `（${defaultValue}）` : ''
  const answer = (await prompt().question(`${question}${suffix}：`)).trim()

  if (answer) return answer
  if (defaultValue) return defaultValue
  if (optional) return ''
  return ask(question, { defaultValue, optional })
}

function editorCommand() {
  const configured = (process.env.VISUAL || process.env.EDITOR || '').trim()
  if (configured) return configured.split(/\s+/)

  return [process.platform === 'win32' ? 'notepad' : 'vi']
}

function openEditor(file) {
  const [command, ...args] = editorCommand()
  const result = spawnSync(command, [...args, file], { stdio: 'inherit' })

  if (result.error) {
    fail(`无法启动编辑器 "${command}"：${result.error.message}。请设置 $EDITOR 后重试。`)
  }
  if (result.status !== 0) {
    fail(`编辑器 "${command}" 退出码为 ${result.status}，已取消。`)
  }
}

async function readStdin() {
  process.stdin.setEncoding('utf8')

  let input = ''
  for await (const chunk of process.stdin) input += chunk
  return input.trim()
}

async function editMomentBody() {
  const directory = await mkdtemp(join(tmpdir(), 'snowiest-moment-'))
  const file = join(directory, 'moment.md')

  try {
    await writeFile(file, '', 'utf8')
    log('在编辑器中写下这条动态，保存并关闭后发布。')
    openEditor(file)

    const body = (await readFile(file, 'utf8')).trim()
    if (!body) fail('没有写入内容，已取消。')
    return body
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
}

function uniqueTimestamp(directory) {
  let date = new Date()
  let timestamp = momentIdFromDate(date)

  while (
    existsSync(join(directory, `${timestamp}.md`)) ||
    existsSync(join(directory, `${timestamp}.mdx`))
  ) {
    date = new Date(date.getTime() + 1000)
    timestamp = momentIdFromDate(date)
  }

  return timestamp
}

function momentFileContents({ body, tags, lang }) {
  const metadata = []

  if (tags.length > 0) {
    metadata.push('tags:', ...tags.map((tag) => `  - ${tag}`))
  }
  if (lang !== 'zh') metadata.push(`lang: ${lang}`)

  const frontmatter = metadata.length > 0 ? `---\n${metadata.join('\n')}\n---\n\n` : ''
  return `${frontmatter}${body.trim()}\n`
}

function blogFileContents({ title, description, tags, lang }) {
  const lines = [
    '---',
    `title: ${yaml(title)}`,
    `description: ${yaml(description)}`,
    `pubDate: ${yaml(today())}`,
  ]

  if (tags.length > 0) {
    lines.push('tags:')
    for (const tag of tags) lines.push(`  - ${tag}`)
  }

  lines.push('draft: true', `lang: ${lang}`, '---', '')
  return `${lines.join('\n')}\n`
}

function linkFileContents({ slug, names, url, description, descriptionEn, tag }) {
  const lines = ['---', `slug: ${slug}`, 'names:']

  if (names.zh) lines.push(`  zh: ${yaml(names.zh)}`)
  if (names.en) lines.push(`  en: ${yaml(names.en)}`)

  lines.push(`url: ${yaml(url)}`)

  const descriptions = []
  if (description) descriptions.push(`  zh: ${yaml(description)}`)
  if (descriptionEn) descriptions.push(`  en: ${yaml(descriptionEn)}`)
  if (descriptions.length > 0) lines.push('description:', ...descriptions)
  if (tag) lines.push(`tag: ${tag}`)

  lines.push('---', '')
  return `${lines.join('\n')}\n`
}

function splitFrontmatter(source, file) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---[ \t]*\r?\n?/.exec(source)
  if (!match) fail(`文件缺少有效的 frontmatter：${relativeToRoot(file)}`)

  return {
    frontmatter: match[1],
    body: source
      .slice(match[0].length)
      .replace(/^\r?\n+/, '')
      .trimEnd(),
  }
}

function warnIfFuturePubDate(frontmatter, file) {
  const match = /^pubDate:[ \t]*['"]?(\d{4}-\d{2}-\d{2})/m.exec(frontmatter)
  if (!match) return

  const pubDate = new Date(`${match[1]}T00:00:00`)
  if (Number.isNaN(pubDate.getTime()) || pubDate.getTime() <= Date.now()) return

  log(
    `注意：${relativeToRoot(file)} 的 pubDate 是 ${match[1]}（未来日期），构建会在该日期之后才展示。`,
  )
}

async function momentAdd(argv) {
  const { positionals, values } = parseArgs(argv, {
    values: ['tag', 'lang'],
    booleans: [],
  })
  const tags = await tagsFromValues(values)
  const lang = validateLang(values)

  let body = positionals.join(' ').trim()
  if (!body) {
    body = isInteractive() ? await editMomentBody() : await readStdin()
    if (!body) {
      fail(
        '没有收到动态内容。可以运行 `pnpm content moment add 今天……`，或在终端中直接运行 `pnpm content moment add` 打开编辑器。',
      )
    }
  }

  const directory = join(ROOT, MOMENTS_CONTENT_DIR)
  await mkdir(directory, { recursive: true })

  const timestamp = uniqueTimestamp(directory)
  const file = join(directory, `${timestamp}.md`)
  await writeFile(file, momentFileContents({ body, tags, lang }), 'utf8')

  log(`已发布动态 → ${relativeToRoot(file)}`)
}

async function blogNew(argv) {
  const { positionals, values, flags } = parseArgs(argv, {
    values: ['title', 'description', 'tag', 'lang'],
    booleans: ['no-edit'],
  })

  if (positionals.length > 1) fail('blog new 只接受一个 slug 位置参数。')

  const lang = validateLang(values)
  let title = getValue(values, 'title')

  if (!title) {
    if (!isInteractive()) fail('缺少 --title（标题）。')
    title = await ask('标题')
  }

  let slug = positionals[0] ?? slugify(title)

  if (!slug) {
    if (!isInteractive()) {
      fail('无法从标题推导 slug（标题不是纯英文）。请用 --slug 指定一个小写英文 id。')
    }
    slug = await ask('slug（URL 片段，小写字母、数字与连字符）')
  }

  assertSlug(slug)

  const directory = join(ROOT, BLOG_CONTENT_DIR, slug)
  if (existsSync(directory)) fail(`文章目录已存在：${relativeToRoot(directory)}`)

  let description = getValue(values, 'description')
  if (!description) {
    if (!isInteractive()) fail('缺少 --description（摘要）。')
    description = await ask('摘要（一两句话，用于列表与 SEO）')
  }

  let tags = await tagsFromValues(values)
  if (tags.length === 0 && isInteractive() && !values.has('tag')) {
    const answer = await ask('标签（逗号分隔，可留空）', { optional: true })
    tags = await parseTagAnswer(answer)
  }

  await mkdir(directory, { recursive: true })
  const file = join(directory, `${lang}.md`)
  await writeFile(file, blogFileContents({ title, description, tags, lang }), 'utf8')

  log(`已创建草稿 → ${relativeToRoot(file)}`)

  if (isInteractive() && !flags.has('no-edit')) {
    closePrompt()
    openEditor(file)
  }

  log(`写完后发布：pnpm content blog publish ${slug}`)
}

async function blogPublish(argv) {
  const { positionals } = parseArgs(argv, { values: [], booleans: [] })

  if (positionals.length === 0) fail('用法：pnpm content blog publish <slug>')
  if (positionals.length > 1) fail('blog publish 只接受一个 slug。')

  const slug = positionals[0]
  assertSlug(slug)

  const directory = join(ROOT, BLOG_CONTENT_DIR, slug)
  if (!existsSync(directory)) fail(`找不到文章目录：${relativeToRoot(directory)}`)

  const files = (await readdir(directory))
    .filter((name) => name.endsWith('.md') || name.endsWith('.mdx'))
    .sort()

  if (files.length === 0) fail(`文章目录里没有 Markdown 文件：${relativeToRoot(directory)}`)

  let published = 0

  for (const name of files) {
    const file = join(directory, name)
    const source = await readFile(file, 'utf8')
    const { frontmatter, body } = splitFrontmatter(source, file)
    const nextFrontmatter = frontmatter.replace(/^draft:[ \t]*true[ \t]*$/m, 'draft: false')

    warnIfFuturePubDate(frontmatter, file)

    if (nextFrontmatter === frontmatter) {
      log(`已是发布状态 → ${relativeToRoot(file)}`)
      continue
    }

    const nextBody = body ? `${body}\n` : ''
    await writeFile(file, `---\n${nextFrontmatter.trimEnd()}\n---\n\n${nextBody}`, 'utf8')
    log(`已发布 → ${relativeToRoot(file)}`)
    published += 1
  }

  log(`共发布 ${published} 个文件。`)
}

function normalizeUrl(input) {
  const withProtocol = /^[a-z][a-z\d+.-]*:/i.test(input) ? input : `https://${input}`

  let url
  try {
    url = new URL(withProtocol)
  } catch {
    fail(`无效的 URL：${input}`)
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    fail(`只支持 http(s) 链接：${input}`)
  }
  if (!HOSTNAME_PATTERN.test(url.hostname)) {
    fail(`URL 主机名无效：${input}`)
  }

  return url
}

async function linkAdd(argv) {
  const { positionals, values } = parseArgs(argv, {
    values: ['name', 'name-en', 'slug', 'description', 'description-en', 'tag'],
    booleans: [],
  })

  if (positionals.length === 0) fail('用法：pnpm content link add <url>')
  if (positionals.length > 1) fail('link add 只接受一个 URL 位置参数。')

  const url = normalizeUrl(positionals[0])
  const hostname = url.hostname.replace(/^www\./, '')

  let name = getValue(values, 'name')
  if (name === undefined && isInteractive()) {
    name = await ask('中文名称', { defaultValue: hostname })
  }
  name ??= hostname

  let nameEn = getValue(values, 'name-en')
  if (nameEn === undefined && isInteractive()) {
    nameEn = await ask('English name（可留空）', { optional: true })
  }

  let description = getValue(values, 'description')
  if (description === undefined && isInteractive()) {
    description = await ask('一句话介绍（中文，可留空）', { optional: true })
  }

  let descriptionEn = getValue(values, 'description-en')
  if (descriptionEn === undefined && isInteractive()) {
    descriptionEn = await ask('English description（可留空）', { optional: true })
  }

  const tags = await tagsFromValues(values)
  if (tags.length > 1) fail('链接目前只支持一个标签。')

  let tag = tags[0]
  if (!tag && isInteractive() && !values.has('tag')) {
    const ids = await tagIds()
    const answer = await ask(`标签（可选：${ids.join(', ')}；留空表示无标签）`, {
      optional: true,
    })
    if (answer) {
      const parsed = await parseTagAnswer(answer)
      if (parsed.length > 1) fail('链接目前只支持一个标签。')
      tag = parsed[0]
    }
  }

  let slug = getValue(values, 'slug')
  if (!slug) slug = slugify(nameEn ?? '') || slugify(name) || slugify(hostname)
  if (!slug) fail('无法推导 slug，请用 --slug 指定。')
  assertSlug(slug)

  const directory = join(ROOT, LINKS_CONTENT_DIR)
  const file = join(directory, `${slug}.md`)
  if (existsSync(file)) fail(`链接已存在：${relativeToRoot(file)}`)

  await mkdir(directory, { recursive: true })
  await writeFile(
    file,
    linkFileContents({
      slug,
      names: { zh: name, en: nameEn || undefined },
      url: url.href,
      description,
      descriptionEn,
      tag,
    }),
    'utf8',
  )

  log(`已添加链接 → ${relativeToRoot(file)}`)
}

async function listMarkdownFiles(directory) {
  if (!existsSync(directory)) return []

  const files = []
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = join(directory, entry.name)
    if (entry.isDirectory()) {
      files.push(...(await listMarkdownFiles(file)))
    } else if (entry.name.endsWith('.md') || entry.name.endsWith('.mdx')) {
      files.push(file)
    }
  }

  return files
}

/** Tag ids referenced by a content file's frontmatter, without a full YAML parser. */
function frontmatterTags(source) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/.exec(source)
  if (!match) return []

  const frontmatter = match[1]
  const tags = []

  const block = /^tags:[ \t]*\r?\n((?:[ \t]*-[ \t]*.*(?:\r?\n|$))*)/m.exec(frontmatter)
  if (block) {
    for (const line of block[1].split(/\r?\n/)) {
      const item = /^[ \t]*-[ \t]*['"]?([^'"\s]+)['"]?[ \t]*$/.exec(line)
      if (item) tags.push(item[1])
    }
  }

  const inline = /^tags:[ \t]*\[(.*?)\]/m.exec(frontmatter)
  if (inline) {
    for (const raw of inline[1].split(',')) {
      const value = raw.trim().replace(/^['"]|['"]$/g, '')
      if (value) tags.push(value)
    }
  }

  const single = /^tag:[ \t]*(.*)$/m.exec(frontmatter)
  if (single) {
    const value = single[1].trim().replace(/^['"]|['"]$/g, '')
    if (value) tags.push(value)
  }

  return tags
}

async function findTagReferences(id) {
  const references = []

  for (const directory of [BLOG_CONTENT_DIR, LINKS_CONTENT_DIR, MOMENTS_CONTENT_DIR]) {
    for (const file of await listMarkdownFiles(join(ROOT, directory))) {
      const source = await readFile(file, 'utf8')
      if (frontmatterTags(source).includes(id)) references.push(relativeToRoot(file))
    }
  }

  return references
}

async function tagAdd(argv) {
  const { positionals, values } = parseArgs(argv, {
    values: ['zh', 'en'],
    booleans: [],
  })

  if (positionals.length !== 1) {
    fail('用法：pnpm content tag add <id> [--zh <中文名>] [--en <英文名>]')
  }

  const id = positionals[0]
  if (!TAG_ID_PATTERN.test(id)) {
    fail(`无效的标签 id "${id}"：只能使用小写英文字母、数字和连字符。`)
  }

  const tags = await loadTags()
  if (tags.some((tag) => tag.id === id)) fail(`标签已存在：${id}`)

  let zh = getValue(values, 'zh')
  if (!zh && isInteractive()) zh = await ask('中文名称')
  zh = zh?.trim()
  if (!zh) fail('缺少 --zh（中文名称）。')

  let en = getValue(values, 'en')
  if (!en && isInteractive()) en = await ask('English name')
  en = en?.trim()
  if (!en) fail('缺少 --en（英文名称）。')

  tags.push({ id, label: { zh, en } })
  await writeTags(tags)
  await generateTags()

  log(`已添加标签 ${id}（${zh} / ${en}）→ ${relativeToRoot(TAGS_FILE)}`)
  log(`已更新标签类型 → ${relativeToRoot(GENERATED_FILE)}`)
}

async function tagList(argv) {
  const { positionals } = parseArgs(argv, { values: [], booleans: [] })
  if (positionals.length > 0) fail('tag list 不接受参数。')

  for (const tag of await loadTags()) {
    log(`${tag.id.padEnd(14)} ${tag.label.zh} / ${tag.label.en}`)
  }
}

async function tagRemove(argv) {
  const { positionals } = parseArgs(argv, { values: [], booleans: [] })

  if (positionals.length !== 1) fail('用法：pnpm content tag remove <id>')

  const id = positionals[0]
  const tags = await loadTags()
  if (!tags.some((tag) => tag.id === id)) fail(`标签不存在：${id}`)

  const references = await findTagReferences(id)
  if (references.length > 0) {
    fail(
      `标签 "${id}" 仍被以下内容引用，请先移除引用：\n${references
        .map((file) => `  - ${file}`)
        .join('\n')}`,
    )
  }

  await writeTags(tags.filter((tag) => tag.id !== id))
  await generateTags()

  log(`已删除标签 ${id} → ${relativeToRoot(TAGS_FILE)}`)
  log(`已更新标签类型 → ${relativeToRoot(GENERATED_FILE)}`)
}

async function main(argv) {
  if (argv.length === 0 || argv.includes('--help') || argv.includes('-h')) {
    log(await usageText())
    return
  }

  const [command, subcommand, ...rest] = argv

  if (command === 'help') {
    log(await usageText())
    return
  }

  if (command === 'moment') {
    if (subcommand !== 'add') fail(`未知的 moment 子命令：${subcommand ?? ''}`)
    return momentAdd(rest)
  }

  if (command === 'blog') {
    if (subcommand === 'new') return blogNew(rest)
    if (subcommand === 'publish') return blogPublish(rest)
    fail(`未知的 blog 子命令：${subcommand ?? ''}`)
  }

  if (command === 'link') {
    if (subcommand !== 'add') fail(`未知的 link 子命令：${subcommand ?? ''}`)
    return linkAdd(rest)
  }

  if (command === 'tag') {
    if (subcommand === 'add') return tagAdd(rest)
    if (subcommand === 'list') return tagList(rest)
    if (subcommand === 'remove') return tagRemove(rest)
    fail(`未知的 tag 子命令：${subcommand ?? ''}`)
  }

  fail(`未知命令：${command}`)
}

try {
  await main(process.argv.slice(2))
} catch (error) {
  if (error instanceof CliError) {
    console.error(`✗ ${error.message}`)
    process.exitCode = 1
  } else {
    throw error
  }
} finally {
  closePrompt()
}
