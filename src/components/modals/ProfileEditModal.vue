<template>
  <BaseModal title="Edit Profile" size="lg" @close="$emit('close')">
      
      <form @submit.prevent="handleSubmit">
        <FormField label="Name" required :error="validationError" path="name" class="w-full">
          <input
            v-model="form.name"
            type="text"
            class="form-input"
            placeholder="Enter display name"
          />
        </FormField>

        <div class="h-px bg-gray-300 my-4"></div>

        <p class="text-sm text-gray-600 mb-4">Leave password fields empty to keep current password</p>

        <FormField label="Current Password" :error="validationError" path="oldPassword" class="w-full">
          <input
            v-model="form.oldPassword"
            type="password"
            class="form-input"
            placeholder="Enter current password"
          />
        </FormField>

        <FormField label="New Password" :error="validationError" path="newPassword" class="w-full">
          <input
            v-model="form.newPassword"
            type="password"
            class="form-input"
            placeholder="Enter new password"
          />
        </FormField>

        <FormField label="Confirm New Password" :error="validationError" path="confirmPassword" class="w-full">
          <input
            v-model="form.confirmPassword"
            type="password"
            class="form-input"
            placeholder="Confirm new password"
          />
        </FormField>

        <ErrorDisplay :error="validationError" />
        <ErrorDisplay :error="authStore.error ? { message: authStore.error } : null" />

        <div class="modal-footer">
          <button type="button" @click="$emit('close')" class="btn-secondary">
            Cancel
          </button>
          <button type="submit" :disabled="authStore.isLoading" class="btn-primary">
            {{ authStore.isLoading ? 'Saving...' : 'Save Changes' }}
          </button>
        </div>
      </form>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import BaseModal from '@/components/BaseModal.vue'
import FormField from '@/components/FormField.vue'
import ErrorDisplay from '@/components/ErrorDisplay.vue'
import { useAuthStore } from '@/stores'
import type { ParsedError, ApiErrorDetail } from '@/api/types'

const emit = defineEmits<{
  close: []
  saved: []
}>()

const authStore = useAuthStore()

// Fetch latest profile data when modal opens
onMounted(async () => {
  try {
    await authStore.fetchProfile()
    // Pre-populate form with current display name
    if (authStore.currentOperator) {
      form.value.name = authStore.currentOperator.name
    }
  } catch (err) {
    // Error is handled in the store
  }
})

const form = ref({
  name: '',
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
})

const validationError = ref<ParsedError | null>(null)

const handleSubmit = async () => {
  validationError.value = null

  const details: ApiErrorDetail[] = []

  if (!form.value.name.trim()) {
    details.push({ path: ['name'], code: 'required', message: 'Name is required' })
  }

  const isChangingPassword = form.value.oldPassword || form.value.newPassword || form.value.confirmPassword

  if (isChangingPassword) {
    if (!form.value.oldPassword) {
      details.push({ path: ['oldPassword'], code: 'required', message: 'Current password is required to change password' })
    }
    if (!form.value.newPassword) {
      details.push({ path: ['newPassword'], code: 'required', message: 'New password is required' })
    } else if (form.value.newPassword !== form.value.confirmPassword) {
      details.push({ path: ['confirmPassword'], code: 'invalid', message: 'Passwords do not match' })
    }
  }

  if (details.length > 0) {
    validationError.value = { message: 'Please fix the validation errors and try again.', details }
    return
  }

  // Check if anything has changed
  const hasDisplayNameChange = form.value.name !== authStore.currentOperator?.name
  const hasPasswordChange = !!form.value.oldPassword && !!form.value.newPassword

  if (!hasDisplayNameChange && !hasPasswordChange) {
    validationError.value = { message: 'No changes to save' }
    return
  }

  try {
    const updateData: { name?: string; oldPassword?: string; newPassword?: string } = {}
    
    if (hasDisplayNameChange) {
      updateData.name = form.value.name
    }
    
    if (hasPasswordChange) {
      updateData.oldPassword = form.value.oldPassword
      updateData.newPassword = form.value.newPassword
    }

    await authStore.updateProfile(updateData)
    emit('saved')
    emit('close')
  } catch (err) {
    // Error is already set in the store
  }
}
</script>
