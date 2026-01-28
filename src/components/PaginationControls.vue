<script setup lang="ts">
import { type Ref } from 'vue'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'

const props = defineProps<{
  pagination: {
    currentPage: Ref<number>
    totalPages: Ref<number>
    hasNextPage: Ref<boolean>
    hasPrevPage: Ref<boolean>
    total: Ref<number>
    nextPage: () => Promise<void>
    prevPage: () => Promise<void>
    goToPage: (page: number) => Promise<void>
  }
  displayedCount: number
  resourceName: string
}>()

function generatePageNumbers() {
  const pages: (number | string)[] = []
  const maxVisible = 7 // Maximum number of page buttons to show
  const totalPages = props.pagination.totalPages.value
  const currentPage = props.pagination.currentPage.value

  if (totalPages <= maxVisible) {
    // Show all pages
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i)
    }
  } else {
    // Always show first page
    pages.push(1)

    if (currentPage <= 3) {
      // Near the beginning
      pages.push(2, 3, 4, '...', totalPages)
    } else if (currentPage >= totalPages - 2) {
      // Near the end
      pages.push('...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages)
    } else {
      // In the middle
      pages.push('...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages)
    }
  }

  return pages
}
</script>

<template>
  <div class="table-footer">
    <div class="flex-between">
      <!-- Count on the left -->
      <span class="text-sm text-gray-600">
        Showing {{ displayedCount }} of {{ pagination.total.value }} {{ resourceName }}
      </span>

      <!-- Pagination controls on the right -->
      <div v-if="pagination.totalPages.value > 0" class="pagination">
        <button
          @click="pagination.prevPage"
          :disabled="!pagination.hasPrevPage.value"
          class="pagination-btn"
          :class="{ 'pagination-btn-disabled': !pagination.hasPrevPage.value }"
        >
          <ChevronLeft class="w-4 h-4" />
          <span class="sr-only">Previous</span>
        </button>

        <div class="pagination-numbers">
          <template v-for="page in generatePageNumbers()" :key="page">
            <button
              v-if="typeof page === 'number'"
              @click="pagination.goToPage(page)"
              class="pagination-btn"
              :class="{ 'pagination-btn-active': page === pagination.currentPage.value }"
            >
              {{ page }}
            </button>
            <span v-else class="pagination-ellipsis">{{ page }}</span>
          </template>
        </div>

        <button
          @click="pagination.nextPage"
          :disabled="!pagination.hasNextPage.value"
          class="pagination-btn"
          :class="{ 'pagination-btn-disabled': !pagination.hasNextPage.value }"
        >
          <ChevronRight class="w-4 h-4" />
          <span class="sr-only">Next</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
</style>
