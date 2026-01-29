<template>
  <div v-if="admin" class="modal-overlay" @click="$emit('close')">
    <div class="modal-content" @click.stop>
      <h2 class="modal-header">Edit Administrator</h2>
      
      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label class="form-label">Admin ID</label>
          <input
            :value="admin.id"
            type="text"
            disabled
            class="form-input-disabled font-mono"
          />
        </div>

        <div class="form-group">
          <label class="form-label">
            Name <span class="required">*</span>
          </label>
          <input
            v-model="form.name"
            type="text"
            required
            class="form-input"
          />
        </div>

        <div class="form-group">
          <label class="form-label">
            Roles <span class="required">*</span>
          </label>
          <div class="flex-gap mt-2">
            <label
              v-for="role in availableRoles"
              :key="role"
              :class="isSuperAdminSelected && role !== 'super_admin' ? 'checkbox-label-disabled' : 'checkbox-label'"
            >
              <input
                type="checkbox"
                :checked="form.roles.includes(role)"
                :disabled="isSuperAdminSelected && role !== 'super_admin'"
                @change="toggleRole(role)"
                class="form-checkbox"
              />
              <span class="text-sm text-gray-700">{{ formatRoleName(role) }}</span>
            </label>
          </div>
        </div>

        <div class="card-info">
          <div class="flex-between">
            <span>Version: {{ admin.version }}</span>
            <span>Created: {{ formatDate(admin.createdAt) }}</span>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" @click="$emit('close')" class="btn-secondary">
            Cancel
          </button>
          <button type="submit" class="btn-primary">
            Save Changes
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { formatRoleName } from '@/composables'
import type { AdminResponse } from '@/types/api'

const props = defineProps<{
  admin: AdminResponse | null
  availableRoles: string[]
}>()

const emit = defineEmits<{
  close: []
  update: [data: { name: string; roles: string[]; metadata: any }]
}>()

const form = ref({
  name: '',
  roles: [] as string[],
  metadata: {}
})

// Initialize form when admin prop changes
watch(() => props.admin, (admin) => {
  if (admin) {
    form.value = {
      name: admin.name,
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

const handleSubmit = () => {
  emit('update', form.value)
}
</script>

<style scoped>
/* Modal styles are inherited from parent styles or can be added here if needed */
</style>
