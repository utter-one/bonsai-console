import { ref, computed, watch } from 'vue'

/**
 * Composable for search with debounce and tag: prefix filtering.
 *
 * Items must have an optional `tags?: string[]` field.
 * The `textMatch` callback handles plain-text tokens (no tag: prefix).
 *
 * Usage:
 *   const { searchQuery, filteredItems, clearSearch } = useSearch(
 *     () => store.items,
 *     (item, query) => item.name.toLowerCase().includes(query)
 *   )
 *
 * In the search box the user can type:
 *   - plain text   → matched via textMatch callback
 *   - tag:welcome  → item must have a tag containing "welcome"
 *   - multiple tokens are ANDed together
 */
export function useSearch<T extends { tags?: string[] }>(
  getItems: () => T[],
  textMatch: (item: T, query: string) => boolean,
  debounceDelay = 300
) {
  const searchQuery = ref('')
  const debouncedSearchQuery = ref('')
  let searchTimeout: ReturnType<typeof setTimeout> | null = null

  watch(searchQuery, (newValue) => {
    if (searchTimeout) clearTimeout(searchTimeout)
    searchTimeout = setTimeout(() => {
      debouncedSearchQuery.value = newValue
    }, debounceDelay)
  })

  const filteredItems = computed(() => {
    const raw = debouncedSearchQuery.value.trim()
    if (!raw) return getItems()

    const tokens = raw.toLowerCase().split(/\s+/)
    const tagTerms = tokens.filter(t => t.startsWith('tag:')).map(t => t.slice(4)).filter(Boolean)
    const textTerms = tokens.filter(t => !t.startsWith('tag:'))

    return getItems().filter(item => {
      const tagsMatch = tagTerms.every(tag =>
        item.tags?.some(t => t.toLowerCase().includes(tag))
      )
      const textMatches = textTerms.length === 0 || textTerms.every(term => textMatch(item, term))
      return tagsMatch && textMatches
    })
  })

  function clearSearch() {
    searchQuery.value = ''
    debouncedSearchQuery.value = ''
    if (searchTimeout) {
      clearTimeout(searchTimeout)
      searchTimeout = null
    }
  }

  return { searchQuery, filteredItems, clearSearch }
}
