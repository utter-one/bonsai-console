function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

type StringOp = { type: 'same' | 'remove' | 'add'; value: string }

// Uses a flat Int32Array for the DP table to avoid nested index access issues.
// Row-major layout: dp[i * (n+1) + j]
function lcsOps(a: string[], b: string[]): StringOp[] {
  const m = a.length
  const n = b.length

  if (m * n > 250_000) {
    const result: StringOp[] = []
    for (const v of a) result.push({ type: 'remove', value: v })
    for (const v of b) result.push({ type: 'add', value: v })
    return result
  }

  const w = n + 1
  const dp = new Int32Array((m + 1) * w)

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const aVal = a[i - 1] as string
      const bVal = b[j - 1] as string
      dp[i * w + j] = aVal === bVal
        ? (dp[(i - 1) * w + (j - 1)] as number) + 1
        : Math.max(dp[(i - 1) * w + j] as number, dp[i * w + (j - 1)] as number)
    }
  }

  const result: StringOp[] = []
  let i = m
  let j = n
  while (i > 0 || j > 0) {
    const aVal = i > 0 ? (a[i - 1] as string) : ''
    const bVal = j > 0 ? (b[j - 1] as string) : ''
    if (i > 0 && j > 0 && aVal === bVal) {
      result.unshift({ type: 'same', value: aVal })
      i--; j--
    } else if (j > 0 && (i === 0 || (dp[i * w + (j - 1)] as number) >= (dp[(i - 1) * w + j] as number))) {
      result.unshift({ type: 'add', value: bVal })
      j--
    } else {
      result.unshift({ type: 'remove', value: aVal })
      i--
    }
  }
  return result
}

export interface StringDiffClasses {
  /** Class(es) applied to the span wrapping a removed line */
  lineRemove?: string
  /** Class(es) applied to the span wrapping an added line */
  lineAdd?: string
  /** Class(es) applied to the span wrapping a modified line */
  lineModified?: string
  /** Class(es) applied to the <mark> for removed words/chars */
  markRemove?: string
  /** Class(es) applied to the <mark> for added words/chars */
  markAdd?: string
}

type ResolvedClasses = Required<StringDiffClasses>

const DEFAULT_CLASSES: ResolvedClasses = {
  lineRemove: '',
  lineAdd: '',
  lineModified: '',
  markRemove: '',
  markAdd: '',
}

function resolveClasses(overrides?: StringDiffClasses): ResolvedClasses {
  return { ...DEFAULT_CLASSES, ...overrides }
}

// Tokenize into alternating word/non-word tokens so LCS can operate at word granularity.
function wordTokenize(s: string): string[] {
  const tokens: string[] = []
  const re = /\w+|\W+/g
  let m: RegExpExecArray | null
  while ((m = re.exec(s)) !== null) tokens.push(m[0])
  return tokens
}

// Apply prefix/suffix char diff within a single changed group (small strings only).
function charDiffGroup(left: string, right: string, cls: ResolvedClasses): { lHtml: string; rHtml: string } {
  const lChars = [...left]
  const rChars = [...right]
  const minLen = Math.min(lChars.length, rChars.length)

  let pre = 0
  while (pre < minLen && lChars[pre] === rChars[pre]) pre++

  let suf = 0
  while (suf < lChars.length - pre && suf < rChars.length - pre &&
    lChars[lChars.length - 1 - suf] === rChars[rChars.length - 1 - suf]) suf++

  const prefix = escapeHtml(lChars.slice(0, pre).join(''))
  const suffix = escapeHtml(lChars.slice(lChars.length - suf).join(''))
  const lMid = lChars.slice(pre, suf > 0 ? -suf : undefined).join('')
  const rMid = rChars.slice(pre, suf > 0 ? -suf : undefined).join('')

  const markL = lMid ? mark(escapeHtml(lMid), cls.markRemove, 'rgba(239,68,68,0.4)') : ''
  const markR = rMid ? mark(escapeHtml(rMid), cls.markAdd, 'rgba(34,197,94,0.45)') : ''

  return { lHtml: prefix + markL + suffix, rHtml: prefix + markR + suffix }
}

// Word-level LCS intra-line diff. Changed word groups are highlighted, with
// sub-word char diffing applied when both sides have content.
function intraLineDiff(left: string, right: string, cls: ResolvedClasses): { leftHtml: string; rightHtml: string } {
  const lTokens = wordTokenize(left)
  const rTokens = wordTokenize(right)
  const ops = lcsOps(lTokens, rTokens)

  let lHtml = ''
  let rHtml = ''
  let i = 0

  while (i < ops.length) {
    const op = ops[i] as StringOp
    if (op.type === 'same') {
      const esc = escapeHtml(op.value)
      lHtml += esc
      rHtml += esc
      i++
    } else {
      const removes: string[] = []
      const adds: string[] = []
      while (i < ops.length && (ops[i] as StringOp).type !== 'same') {
        const cur = ops[i] as StringOp
        if (cur.type === 'remove') removes.push(cur.value)
        else adds.push(cur.value)
        i++
      }
      const lGroup = removes.join('')
      const rGroup = adds.join('')

      if (lGroup && rGroup) {
        const { lHtml: lc, rHtml: rc } = charDiffGroup(lGroup, rGroup, cls)
        lHtml += lc
        rHtml += rc
      } else if (lGroup) {
        lHtml += mark(escapeHtml(lGroup), cls.markRemove, 'rgba(239,68,68,0.4)')
      } else if (rGroup) {
        rHtml += mark(escapeHtml(rGroup), cls.markAdd, 'rgba(34,197,94,0.45)')
      }
    }
  }

  return { leftHtml: lHtml, rightHtml: rHtml }
}

type LinePair =
  | { type: 'same'; line: string }
  | { type: 'remove'; line: string }
  | { type: 'add'; line: string }
  | { type: 'modified'; left: string; right: string }

function groupPairs(ops: StringOp[]): LinePair[] {
  const pairs: LinePair[] = []
  let i = 0
  while (i < ops.length) {
    const op = ops[i] as StringOp
    if (op.type === 'same') {
      pairs.push({ type: 'same', line: op.value })
      i++
    } else {
      const removes: string[] = []
      const adds: string[] = []
      while (i < ops.length && (ops[i] as StringOp).type !== 'same') {
        const cur = ops[i] as StringOp
        if (cur.type === 'remove') removes.push(cur.value)
        else adds.push(cur.value)
        i++
      }
      const paired = Math.min(removes.length, adds.length)
      for (let k = 0; k < paired; k++) {
        pairs.push({ type: 'modified', left: removes[k] as string, right: adds[k] as string })
      }
      for (let k = paired; k < removes.length; k++) {
        pairs.push({ type: 'remove', line: removes[k] as string })
      }
      for (let k = paired; k < adds.length; k++) {
        pairs.push({ type: 'add', line: adds[k] as string })
      }
    }
  }
  return pairs
}

const BASE = 'display:block;white-space:pre-wrap;word-break:break-all;min-height:1.25em;padding:0 2px;'
const BG_MODIFIED = 'rgba(234,179,8,0.1)'
const BG_REMOVE = 'rgba(239,68,68,0.08)'
const BG_ADD = 'rgba(34,197,94,0.08)'
const GHOST = `<span style="${BASE}opacity:0"> </span>`

function lineSpan(content: string, cls: string, fallbackBg: string, isActive = false, changedLineIdx?: number): string {
  let style = cls ? BASE : (fallbackBg ? `${BASE}background:${fallbackBg};` : BASE)
  if (isActive) style += 'outline: 1.5px solid rgba(96,165,250,0.8); outline-offset: -1px; border-radius: 2px;'
  const classAttr = cls ? ` class="${cls}"` : ''
  const lineAttr = changedLineIdx !== undefined ? ` data-sdiff-line="${changedLineIdx}"` : ''
  return `<span style="${style}"${classAttr}${lineAttr}>${content}</span>`
}

function mark(content: string, cls: string, fallbackBg: string): string {
  const style = cls ? 'border-radius:2px;padding:0;color:inherit;' : `background:${fallbackBg};border-radius:2px;padding:0;color:inherit;`
  const classAttr = cls ? ` class="${cls}"` : ''
  return `<mark style="${style}"${classAttr}>${content}</mark>`
}

function normalizeLineEndings(s: string): string {
  return s.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
}

/**
 * Computes a side-by-side HTML diff for two string values.
 * Handles multiline strings with line-level LCS diff and char-level highlighting
 * within modified lines. Single-line strings receive char-level highlighting only.
 *
 * Returns HTML strings suitable for v-html rendering (uses inline styles,
 * no Tailwind classes, safe for scoped component use).
 */
export function computeStringDiff(left: string, right: string, classes?: StringDiffClasses, activeChangedLineIdx?: number): { leftHtml: string; rightHtml: string } {
  const cls = resolveClasses(classes)
  const leftLines = normalizeLineEndings(left).split('\n')
  const rightLines = normalizeLineEndings(right).split('\n')

  const ops = lcsOps(leftLines, rightLines)
  const pairs = groupPairs(ops)

  let leftHtml = ''
  let rightHtml = ''
  let changedLineCount = 0

  for (const pair of pairs) {
    if (pair.type === 'same') {
      const esc = escapeHtml(pair.line)
      leftHtml += lineSpan(esc, '', '')
      rightHtml += lineSpan(esc, '', '')
    } else if (pair.type === 'remove') {
      const isActive = activeChangedLineIdx !== undefined && changedLineCount === activeChangedLineIdx
      leftHtml += lineSpan(escapeHtml(pair.line), cls.lineRemove, BG_REMOVE, isActive, changedLineCount)
      rightHtml += GHOST
      changedLineCount++
    } else if (pair.type === 'add') {
      const isActive = activeChangedLineIdx !== undefined && changedLineCount === activeChangedLineIdx
      leftHtml += GHOST
      rightHtml += lineSpan(escapeHtml(pair.line), cls.lineAdd, BG_ADD, isActive, changedLineCount)
      changedLineCount++
    } else {
      const isActive = activeChangedLineIdx !== undefined && changedLineCount === activeChangedLineIdx
      const { leftHtml: lc, rightHtml: rc } = intraLineDiff(pair.left, pair.right, cls)
      leftHtml += lineSpan(lc, cls.lineModified, BG_MODIFIED, isActive, changedLineCount)
      rightHtml += lineSpan(rc, cls.lineModified, BG_MODIFIED, isActive, changedLineCount)
      changedLineCount++
    }
  }

  return { leftHtml, rightHtml }
}

export function countStringDiffChanges(left: string, right: string): number {
  const leftLines = normalizeLineEndings(left).split('\n')
  const rightLines = normalizeLineEndings(right).split('\n')
  const ops = lcsOps(leftLines, rightLines)
  const pairs = groupPairs(ops)
  return pairs.filter(p => p.type !== 'same').length
}
