import { ref } from 'vue'

export interface SpreadsheetBehaviorOptions {
  /** Total number of focusable columns (0-based). */
  columnCount: number
  /** Return the total number of visible rows at call-time. */
  getRowCount: () => number
  /** Called when Escape is pressed — close any open popovers/modals. */
  onEscape?: () => void
}

/**
 * Provides spreadsheet-like keyboard navigation and auto-save-on-row-blur behaviour
 * for any inline-editing table.
 *
 * Usage:
 *   const { activeRowIdx, onTableKeydown, buildRowHandlers } = useSpreadsheetBehavior({ ... })
 *
 *   <table @keydown="onTableKeydown">
 *     <tr v-for="(row, i) in rows"
 *         v-bind="buildRowHandlers(i, () => row.isDirty, () => saveRow(row))"
 *         :class="{ 'spreadsheet-row-active': activeRowIdx === i }">
 *       <td><input data-col="0" @focus="setActive(i, 0)" ... /></td>
 *       <td><div  data-col="1" tabindex="0" @focus="setActive(i, 1)" ... /></td>
 *     </tr>
 *   </table>
 *
 * Each interactive element inside a cell should carry a `data-col="N"` attribute so the
 * keyboard handler can locate the right element when programmatically moving focus.
 */
export function useSpreadsheetBehavior(options: SpreadsheetBehaviorOptions) {
  const { columnCount, getRowCount, onEscape } = options

  const activeRowIdx = ref<number | null>(null)
  const activeColIdx = ref<number | null>(null)

  function setActive(rowIdx: number, colIdx: number) {
    activeRowIdx.value = rowIdx
    activeColIdx.value = colIdx
  }

  function focusCell(rowIdx: number, colIdx: number, tableEl: HTMLElement | null) {
    if (!tableEl) return
    const rows = tableEl.querySelectorAll<HTMLElement>('tbody tr[data-row]')
    const targetRow = Array.from(rows).find(r => r.dataset.row === String(rowIdx))
    if (!targetRow) return
    const cell = targetRow.querySelector<HTMLElement>(`[data-col="${colIdx}"]`)
    if (cell) {
      cell.focus()
      setActive(rowIdx, colIdx)
    }
  }

  function onTableKeydown(e: KeyboardEvent) {
    const table = (e.currentTarget as HTMLElement)
    const rowCount = getRowCount()
    if (rowCount === 0) return

    const row = activeRowIdx.value ?? 0
    const col = activeColIdx.value ?? 0

    if (e.key === 'Escape') {
      onEscape?.()
      ;(e.target as HTMLElement)?.blur()
      activeRowIdx.value = null
      activeColIdx.value = null
      return
    }

    if (e.key === 'Tab') {
      e.preventDefault()
      const shift = e.shiftKey
      let nextRow = row
      let nextCol = col + (shift ? -1 : 1)
      if (nextCol >= columnCount) { nextCol = 0; nextRow = Math.min(row + 1, rowCount - 1) }
      if (nextCol < 0) { nextCol = columnCount - 1; nextRow = Math.max(row - 1, 0) }
      focusCell(nextRow, nextCol, table)
      return
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      focusCell(Math.min(row + 1, rowCount - 1), col, table)
      return
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault()
      focusCell(Math.max(row - 1, 0), col, table)
      return
    }

    // Enter on a non-input/textarea cell: treat as click (open popover/modal)
    if (e.key === 'Enter') {
      const target = e.target as HTMLElement
      const tag = target.tagName
      if (tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT') {
        e.preventDefault()
        target.click()
      }
    }
  }

  /**
   * Build the event handlers to spread onto a <tr> element for active-row tracking.
   */
  function buildRowHandlers(rowIdx: number): Record<string, unknown> {
    return {
      'onFocusin': () => { setActive(rowIdx, activeColIdx.value ?? 0) },
    }
  }

  return { activeRowIdx, activeColIdx, setActive, focusCell, onTableKeydown, buildRowHandlers }
}
