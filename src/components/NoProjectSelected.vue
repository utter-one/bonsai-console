<script setup lang="ts">
import { useRouter } from 'vue-router'
import { BriefcaseBusiness } from 'lucide-vue-next'

withDefaults(defineProps<{
  description?: string
}>(), {
  description: 'Please select a project from the dropdown in the top navigation bar to continue.',
})

const router = useRouter()

function goToProjects() {
  router.push({ name: 'administration.projects' })
}
</script>

<template>
  <div class="flex items-center justify-center min-h-[60vh]">
    <div class="text-center max-w-md">
      <BriefcaseBusiness class="mx-auto mb-4 text-gray-400 dark:text-gray-500" :size="64" />
      <h2 class="text-2xl font-semibold text-gray-900 dark:text-white mb-2">No Project Selected</h2>
      <p class="text-gray-600 dark:text-gray-400 mb-6">{{ description }}</p>
      <button
        @click="goToProjects"
        class="btn-primary mx-auto"
      >
        View All Projects
      </button>
    </div>
  </div>
</template>
