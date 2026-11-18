import { onPageLoad } from '../../lib/runtime'

/**
 * Copy-to-clipboard buttons.
 *
 * A `CopyButton` carries its payload in `data-copy-text`, so the clipboard gets an explicit string
 * instead of a DOM selection: selecting rendered blocks adds line breaks where the markup has block
 * boundaries, which duplicates the intended line breaks. The payload may itself contain newlines;
 * `writeText` copies them exactly.
 *
 * Labels and feedback come from the button's data attributes, so one setup serves every instance
 * and survives `<ClientRouter />` navigations. Setup is idempotent: rendered buttons are marked and
 * bound only once.
 */

const RESET_DELAY_MS = 2000
const resetTimers = new WeakMap<HTMLButtonElement, number>()

export function setupCopyButtons(): void {
  onPageLoad(() => {
    for (const button of document.querySelectorAll<HTMLButtonElement>('[data-copy-button]')) {
      if (button.dataset.copyReady === 'true') continue
      button.dataset.copyReady = 'true'
      button.addEventListener('click', () => void copyButtonText(button))
    }
  })
}

async function copyButtonText(button: HTMLButtonElement): Promise<void> {
  const text = button.dataset.copyText
  const label = button.querySelector<HTMLElement>('[data-copy-label]')
  if (!text || !label) return

  const defaultLabel = button.dataset.defaultLabel ?? label.textContent ?? ''
  button.dataset.defaultLabel = defaultLabel

  let copied = false
  try {
    await writeClipboard(text)
    copied = true
  } catch {
    copied = false
  }

  // The label is the feedback, so aria-live on it announces the result to screen readers.
  label.textContent =
    (copied ? button.dataset.copiedLabel : button.dataset.failedLabel) ?? defaultLabel
  button.dataset.copied = String(copied)

  const previous = resetTimers.get(button)
  if (previous) window.clearTimeout(previous)

  resetTimers.set(
    button,
    window.setTimeout(() => {
      label.textContent = button.dataset.defaultLabel ?? defaultLabel
      delete button.dataset.copied
      resetTimers.delete(button)
    }, RESET_DELAY_MS),
  )
}

/** Clipboard API where available; a hidden textarea keeps older or insecure contexts working. */
async function writeClipboard(text: string): Promise<void> {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text)
    return
  }

  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'fixed'
  textarea.style.top = '-1000px'
  document.body.append(textarea)
  textarea.select()
  const copied = document.execCommand('copy')
  textarea.remove()
  if (!copied) throw new Error('Clipboard copy failed.')
}
