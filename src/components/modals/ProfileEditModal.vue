<template>
  <div class="modal-overlay" @click="$emit('close')">
    <div class="modal-content" @click.stop>
      <h2 class="modal-header">Edit Profile</h2>
      
      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label class="form-label">
            Display Name <span class="required">*</span>
          </label>
          <input
            v-model="form.displayName"
            type="text"
            required
            class="form-input"
            placeholder="Enter display name"
          />
        </div>

        <div class="h-px bg-gray-300 my-4"></div>

        <div class="form-group">
          <label class="form-label">
            Change Password (optional)
          </label>
          <p class="text-sm text-gray-600 mb-2">Leave fields empty to keep current password</p>
        </div>

        <div class="form-group">
          <label class="form-label">Current Password</label>
          <input
            v-model="form.oldPassword"
            type="password"
            class="form-input"
            placeholder="Enter current password"
            :required="!!form.newPassword"
          />
        </div>

        <div class="form-group">
          <label class="form-label">New Password</label>
          <input
            v-model="form.newPassword"
            type="password"
            class="form-input"
            placeholder="Enter new password"
            :required="!!form.oldPassword"
          />
        </div>

        <div class="form-group">
          <label class="form-label">Confirm New Password</label>
          <input
            v-model="form.confirmPassword"
            type="password"
            class="form-input"
            placeholder="Confirm new password"
            :required="!!form.newPassword"
          />
        </div>

        <div v-if="validationError" class="p-3 rounded-md bg-red-50 border border-red-200 text-red-800 text-sm mb-4">
          {{ validationError }}
        </div>

        <div v-if="authStore.error" class="p-3 rounded-md bg-red-50 border border-red-200 text-red-800 text-sm mb-4">
          {{ authStore.error }}
        </div>

        <div class="modal-footer">
          <button type="button" @click="$emit('close')" class="btn-secondary">
            Cancel
          </button>
          <button type="submit" :disabled="authStore.isLoading" class="btn-primary">
            {{ authStore.isLoading ? 'Saving...' : 'Save Changes' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores'

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
    if (authStore.currentAdmin) {
      form.value.displayName = authStore.currentAdmin.displayName
    }
  } catch (err) {
    // Error is handled in the store
  }
})

const form = ref({
  displayName: '',
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
})

const validationError = ref<string | null>(null)

const handleSubmit = async () => {
  validationError.value = null
  
  // Validate password change if attempting to change password
  if (form.value.oldPassword || form.value.newPassword || form.value.confirmPassword) {
    if (!form.value.oldPassword) {
      validationError.value = 'Current password is required to change password'
      return
    }
    if (!form.value.newPassword) {
      validationError.value = 'New password is required'
      return
    }
    if (form.value.newPassword !== form.value.confirmPassword) {
      validationError.value = 'New passwords do not match'
      return
    }
    if (form.value.newPassword.length < 1) {
      validationError.value = 'New password must be at least 1 character'
      return
    }
  }

  // Check if anything has changed
  const hasDisplayNameChange = form.value.displayName !== authStore.currentAdmin?.displayName
  const hasPasswordChange = form.value.oldPassword && form.value.newPassword

  if (!hasDisplayNameChange && !hasPasswordChange) {
    validationError.value = 'No changes to save'
    return
  }

  try {
    const updateData: { displayName?: string; oldPassword?: string; newPassword?: string } = {}
    
    if (hasDisplayNameChange) {
      updateData.displayName = form.value.displayName
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
