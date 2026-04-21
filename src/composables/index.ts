import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores'
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-vue-next'
import { formatDistanceToNow } from 'date-fns'

export * from './useActionForm'
export * from './useTabNavigation'
export * from './useLlmProviderSelect'
export * from './useClickOutside'
export * from './useContextualHelp'
export * from './useCopyPaste'
export * from './useMediaUpload'
export * from './useSearch'
export * from './useSpreadsheetBehavior'
export * from './useWebSocketClient'
export * from './useAudioPlayback'
export * from './useAudioRecording'
export * from './useAudioDevices'
export * from './useConversationPreviews'

/**
 * Format role name to human-readable format
 * e.g., 'super_admin' -> 'Super Admin'
 */
export function formatEnum(enumId: string): string {
  return enumId.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return 'N/A'
  return new Date(date).toLocaleString()
}

export function formatRelativeTime(date: string | null | undefined): string {
  if (!date) return 'N/A'
  return formatDistanceToNow(new Date(date), { addSuffix: true }).replace('about ', '').replace('less than a minute ago', 'just now')
}

/**
 * Composable for handling API operations with loading and error states
 */
export function useApiOperation<T = any>() {
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const data = ref<T | null>(null)

  const hasError = computed(() => !!error.value)
  const hasData = computed(() => !!data.value)

  async function execute(operation: () => Promise<T>) {
    isLoading.value = true
    error.value = null
    data.value = null

    try {
      data.value = await operation()
      return data.value
    } catch (err: any) {
      error.value = err.response?.data?.message || err.message || 'An error occurred'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  function reset() {
    isLoading.value = false
    error.value = null
    data.value = null
  }

  return {
    isLoading,
    error,
    data,
    hasError,
    hasData,
    execute,
    reset,
  }
}

/**
 * Composable for protected routes that require authentication
 */
export function useAuth() {
  const authStore = useAuthStore()

  const isAuthenticated = computed(() => authStore.isAuthenticated)
  const currentUser = computed(() => authStore.currentOperator)

  async function requireAuth() {
    if (!isAuthenticated.value) {
      throw new Error('Authentication required')
    }
  }

  return {
    isAuthenticated,
    currentUser,
    requireAuth,
    login: authStore.login,
    logout: authStore.logout,
  }
}

/**
 * Composable for pagination with resource stores
 * 
 * @example
 * const pagination = usePagination({
 *   store: adminsStore,
 *   pageSize: 20,
 *   onPageChange: loadData
 * })
 * 
 * // In loadData:
 * await store.fetchAll(pagination.getParams())
 */
export function usePagination<T extends { pagination: { total: number } }>(options: {
  store: T
  pageSize?: number
  onPageChange?: () => Promise<void> | void
} = {} as any) {
  const { store, pageSize: initialPageSize = 20, onPageChange } = options

  const currentPage = ref(1)
  const pageSize = ref(initialPageSize)

  const offset = computed(() => (currentPage.value - 1) * pageSize.value)
  const total = computed(() => store?.pagination?.total ?? 0)
  const totalPages = computed(() => Math.ceil(total.value / pageSize.value))
  const hasNextPage = computed(() => currentPage.value < totalPages.value)
  const hasPrevPage = computed(() => currentPage.value > 1)

  async function nextPage() {
    if (!hasNextPage.value) return
    currentPage.value++
    if (onPageChange) await onPageChange()
  }

  async function prevPage() {
    if (!hasPrevPage.value) return
    currentPage.value--
    if (onPageChange) await onPageChange()
  }

  async function goToPage(page: number) {
    if (page < 1 || page > totalPages.value) return
    currentPage.value = page
    if (onPageChange) await onPageChange()
  }

  async function reset() {
    currentPage.value = 1
    if (onPageChange) await onPageChange()
  }

  function getParams(additionalParams = {}) {
    return {
      offset: offset.value,
      limit: pageSize.value,
      ...additionalParams
    }
  }

  return {
    currentPage,
    pageSize,
    offset,
    total,
    totalPages,
    hasNextPage,
    hasPrevPage,
    nextPage,
    prevPage,
    goToPage,
    reset,
    getParams
  }
}

/**
 * Composable for confirmation dialogs
 */
export function useConfirm() {
  async function confirm(message: string): Promise<boolean> {
    return window.confirm(message)
  }

  async function confirmDelete(itemName?: string): Promise<boolean> {
    const message = itemName
      ? `Are you sure you want to delete "${itemName}"?`
      : 'Are you sure you want to delete this item?'
    return confirm(message)
  }

  return {
    confirm,
    confirmDelete,
  }
}

/**
 * Composable for table sorting with localStorage persistence
 * 
 * @param storageKey - Unique key for localStorage (e.g., 'sort-admins')
 * 
 * @example
 * const { sortKey, sortOrder, toggleSort, getOrderBy, getSortIcon } = useTableSort('sort-admins')
 * 
 * // In template:
 * <th @click="toggleSort('name')">
 *   <div class="flex items-center gap-1">
 *     Name
 *     <component :is="getSortIcon('name')" class="w-4 h-4" />
 *   </div>
 * </th>
 * 
 * // In loadData:
 * await store.fetchAll(pagination.getParams({ orderBy: getOrderBy() }))
 */
export function useTableSort(storageKey: string) {
  // Load initial state from localStorage
  const loadFromStorage = () => {
    try {
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (err) {
      console.error('Failed to load sort state from localStorage:', err)
    }
    return { sortKey: null, sortOrder: null }
  }

  const initialState = loadFromStorage()
  const sortKey = ref<string | null>(initialState.sortKey)
  const sortOrder = ref<'asc' | 'desc' | null>(initialState.sortOrder)

  // Save to localStorage whenever state changes
  const saveToStorage = () => {
    try {
      if (sortKey.value && sortOrder.value) {
        localStorage.setItem(storageKey, JSON.stringify({
          sortKey: sortKey.value,
          sortOrder: sortOrder.value
        }))
      } else {
        localStorage.removeItem(storageKey)
      }
    } catch (err) {
      console.error('Failed to save sort state to localStorage:', err)
    }
  }

  /**
   * Toggle sorting for a field
   * - Same field: cycle through asc → desc → none
   * - Different field: reset previous and set new to asc
   */
  function toggleSort(field: string) {
    if (sortKey.value === field) {
      // Cycle through states
      if (sortOrder.value === 'asc') {
        sortOrder.value = 'desc'
      } else if (sortOrder.value === 'desc') {
        sortKey.value = null
        sortOrder.value = null
      } else {
        sortOrder.value = 'asc'
      }
    } else {
      // New field - start with ascending
      sortKey.value = field
      sortOrder.value = 'asc'
    }
    saveToStorage()
  }

  /**
   * Get the orderBy parameter for API calls
   * Returns: null (no sort), "field" (asc), or "-field" (desc)
   */
  function getOrderBy(): string | null {
    if (!sortKey.value || !sortOrder.value) return null
    return sortOrder.value === 'asc' ? sortKey.value : `-${sortKey.value}`
  }

  /**
   * Get the appropriate icon component for a field
   * Returns: ArrowUpDown (inactive), ArrowUp (asc), or ArrowDown (desc)
   */
  function getSortIcon(field: string) {
    if (sortKey.value !== field) return ArrowUpDown
    return sortOrder.value === 'asc' ? ArrowUp : ArrowDown
  }

  return {
    sortKey,
    sortOrder,
    toggleSort,
    getOrderBy,
    getSortIcon
  }
}
