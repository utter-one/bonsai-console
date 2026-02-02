import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores'

export * from './useActionForm'

/**
 * Format role name to human-readable format
 * e.g., 'super_admin' -> 'Super Admin'
 */
export function formatEnum(enumId: string): string {
  return enumId.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
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
  const currentUser = computed(() => authStore.currentAdmin)

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
