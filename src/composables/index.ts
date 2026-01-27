import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores'

/**
 * Format role name to human-readable format
 * e.g., 'super_admin' -> 'Super Admin'
 */
export function formatRoleName(role: string): string {
  return role.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
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
 * Composable for pagination
 */
export function usePagination(initialPage = 1, initialLimit = 10) {
  const page = ref(initialPage)
  const limit = ref(initialLimit)
  const total = ref(0)
  const totalPages = computed(() => Math.ceil(total.value / limit.value))

  const hasNextPage = computed(() => page.value < totalPages.value)
  const hasPrevPage = computed(() => page.value > 1)

  function nextPage() {
    if (hasNextPage.value) {
      page.value++
    }
  }

  function prevPage() {
    if (hasPrevPage.value) {
      page.value--
    }
  }

  function goToPage(pageNumber: number) {
    if (pageNumber >= 1 && pageNumber <= totalPages.value) {
      page.value = pageNumber
    }
  }

  function setTotal(newTotal: number) {
    total.value = newTotal
  }

  function reset() {
    page.value = initialPage
    limit.value = initialLimit
    total.value = 0
  }

  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage,
    hasPrevPage,
    nextPage,
    prevPage,
    goToPage,
    setTotal,
    reset,
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
