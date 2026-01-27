<template>
  <div 
    v-if="admin"
    class="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-5"
    @click="$emit('close')"
  >
    <div class="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto" @click.stop>
      <h2 class="m-0 mb-5 text-xl font-semibold">Edit Administrator</h2>
      
      <form @submit.prevent="handleSubmit">
        <div class="mb-4">
          <label class="block mb-1.5 font-medium text-gray-900">Admin ID</label>
          <input
            :value="admin.id"
            type="text"
            disabled
            class="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm bg-gray-100 cursor-not-allowed font-mono"
          />
        </div>

        <div class="mb-4">
          <label class="block mb-1.5 font-medium text-gray-900">
            Display Name <span class="text-red-600">*</span>
          </label>
          <input
            v-model="form.displayName"
            type="text"
            required
            class="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-primary-500"
          />
        </div>

        <div class="mb-4">
          <label class="block mb-1.5 font-medium text-gray-900">
            Roles <span class="text-red-600">*</span>
          </label>
          <div class="flex flex-wrap gap-2 mt-2">
            <label
              v-for="role in availableRoles"
              :key="role"
              class="inline-flex items-center cursor-pointer"
              :class="{ 'opacity-50 cursor-not-allowed': isSuperAdminSelected && role !== 'super_admin' }"
            >
              <input
                type="checkbox"
                :checked="form.roles.includes(role)"
                :disabled="isSuperAdminSelected && role !== 'super_admin'"
                @change="toggleRole(role)"
                class="mr-2 w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-50"
              />
              <span class="text-sm text-gray-700">{{ formatRoleName(role) }}</span>
            </label>
          </div>
        </div>

        <div class="mb-4 p-3 bg-gray-50 rounded-md text-sm text-gray-600">
          <div class="flex justify-between">
            <span>Version: {{ admin.version }}</span>
            <span>Created: {{ formatDate(admin.createdAt) }}</span>
          </div>
        </div>

        <div class="flex gap-3 justify-end mt-6 pt-4 border-t border-gray-200">
          <button
            type="button"
            @click="$emit('close')"
            class="px-4 py-2 border border-gray-300 bg-white text-gray-900 rounded-md font-medium cursor-pointer transition-all hover:border-primary-500 hover:text-primary-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            class="px-5 py-2.5 border-none bg-primary-500 text-white rounded-md font-medium cursor-pointer transition-colors hover:bg-primary-600"
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { AdminResponse } from '@/types/api'

const props = defineProps<{
  admin: AdminResponse | null
  availableRoles: string[]
}>()

const emit = defineEmits<{
  close: []
  update: [data: { displayName: string; roles: string[]; metadata: any }]
}>()

const form = ref({
  displayName: '',
  roles: [] as string[],
  metadata: {}
})

// Initialize form when admin prop changes
watch(() => props.admin, (admin) => {
  if (admin) {
    form.value = {
      displayName: admin.displayName,
      roles: [...admin.roles],
      metadata: admin.metadata || {}
    }
  }
}, { immediate: true })

const isSuperAdminSelected = computed(() => form.value.roles.includes('super_admin'))

const toggleRole = (role: string) => {
  const index = form.value.roles.indexOf(role)
  
  // If selecting super_admin, clear all other roles
  if (role === 'super_admin' && index === -1) {
    form.value.roles = ['super_admin']
  }
  // If super_admin is already selected and trying to add another role, do nothing
  else if (form.value.roles.includes('super_admin') && role !== 'super_admin') {
    return
  }
  // If selecting another role while super_admin is not selected
  else if (index > -1) {
    form.value.roles.splice(index, 1)
  } else {
    form.value.roles.push(role)
  }
}

const formatDate = (date: string | null) => {
  if (!date) return 'N/A'
  return new Date(date).toLocaleString()
}

const formatRoleName = (role: string) => {
  return role.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
}

const handleSubmit = () => {
  emit('update', form.value)
}
</script>

<style scoped>
/* Modal styles are inherited from parent styles or can be added here if needed */
</style>
