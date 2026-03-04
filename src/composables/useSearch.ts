import { ref, computed, watch } from 'vue'

/**
 * Composable for search with debounce.
 *
 * Text search is handled entirely server-side via `textSearchQuery`.
 * `filteredItems` is a pass-through that returns all items unfiltered.
 *
 * Usage:
 *   const { searchQuery, textSearchQuery, filteredItems, clearSearch } = useSearch(
 *     () => store.items
 *   )
 */
export function useSearch<T>(
  getItems: () => T[],
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

  // Full query string to send to the backend as textSearch
  const textSearchQuery = computed(() => debouncedSearchQuery.value.trim())

  // Pass-through: all filtering is done server-side
  const filteredItems = computed(() => getItems())

  function clearSearch() {
    searchQuery.value = ''
    debouncedSearchQuery.value = ''
    if (searchTimeout) {
      clearTimeout(searchTimeout)
      searchTimeout = null
    }
  }

  return { searchQuery, debouncedSearchQuery, textSearchQuery, filteredItems, clearSearch }
}
