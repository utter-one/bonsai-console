<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores'
import { Rocket } from 'lucide-vue-next'

const router = useRouter()
const authStore = useAuthStore()

const setupForm = ref({
  id: '',
  displayName: '',
  password: '',
  confirmPassword: '',
})

const isLoading = ref(false)
const errorMessage = ref('')
const isChecking = ref(true)

onMounted(async () => {
  // Check if setup is already complete
  try {
    const status = await authStore.checkSetupStatus()
    if (status.isSetup) {
      router.push({ name: 'login' })
      return
    }
  } catch (error) {
    errorMessage.value = 'Failed to check setup status'
  } finally {
    isChecking.value = false
  }
})

async function handleSetup() {
  errorMessage.value = ''

  // Validate passwords match
  if (setupForm.value.password !== setupForm.value.confirmPassword) {
    errorMessage.value = 'Passwords do not match'
    return
  }

  if (setupForm.value.password.length < 8) {
    errorMessage.value = 'Password must be at least 8 characters'
    return
  }

  isLoading.value = true

  try {
    await authStore.createInitialAdmin({
      id: setupForm.value.id,
      displayName: setupForm.value.displayName,
      password: setupForm.value.password,
    })

    router.push({ name: 'dashboard' })
  } catch (error: any) {
    errorMessage.value = error.response?.data?.message || 'Setup failed. Please try again.'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-gradient-from to-gradient-to p-5">
    <div class="w-full max-w-[520px]">
      <div v-if="isChecking" class="bg-white rounded-xl py-16 px-10 shadow-2xl text-center">
        <div class="w-10 h-10 border-4 border-gray-200 border-t-gradient-from rounded-full animate-spin mx-auto mb-5"></div>
        <p class="text-gray-700">Checking system status...</p>
      </div>

      <div v-else class="bg-white rounded-xl p-10 shadow-2xl">
        <div class="text-center mb-8">
          <div class="flex justify-center text-gradient-from mb-4">
            <Rocket :size="40" />
          </div>
          <h1 class="m-0 mb-2 text-3xl font-bold text-gray-900">Welcome to Nexus Admin</h1>
          <p class="m-0 text-sm text-gray-600">Let's set up your initial administrator account</p>
        </div>

        <form @submit.prevent="handleSetup" class="flex flex-col gap-5">
          <div v-if="errorMessage" class="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
            {{ errorMessage }}
          </div>

          <div class="flex flex-col gap-2">
            <label for="displayName" class="text-sm font-medium text-gray-900">Display Name</label>
            <input
              id="displayName"
              v-model="setupForm.displayName"
              type="text"
              required
              placeholder="John Doe"
              :disabled="isLoading"
              class="px-3 py-3 border border-gray-300 rounded-md text-sm transition-colors focus:outline-none focus:border-gradient-from disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          <div class="flex flex-col gap-2">
            <label for="id" class="text-sm font-medium text-gray-900">Admin ID / Email</label>
            <input
              id="id"
              v-model="setupForm.id"
              type="text"
              required
              placeholder="admin@example.com or admin-user"
              :disabled="isLoading"
              class="px-3 py-3 border border-gray-300 rounded-md text-sm transition-colors focus:outline-none focus:border-gradient-from disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          <div class="flex flex-col gap-2">
            <label for="password" class="text-sm font-medium text-gray-900">Password</label>
            <input
              id="password"
              v-model="setupForm.password"
              type="password"
              required
              placeholder="Minimum 8 characters"
              :disabled="isLoading"
              class="px-3 py-3 border border-gray-300 rounded-md text-sm transition-colors focus:outline-none focus:border-gradient-from disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          <div class="flex flex-col gap-2">
            <label for="confirmPassword" class="text-sm font-medium text-gray-900">Confirm Password</label>
            <input
              id="confirmPassword"
              v-model="setupForm.confirmPassword"
              type="password"
              required
              placeholder="Re-enter password"
              :disabled="isLoading"
              class="px-3 py-3 border border-gray-300 rounded-md text-sm transition-colors focus:outline-none focus:border-gradient-from disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          <button 
            type="submit" 
            :disabled="isLoading"
            class="px-4 py-3.5 border-none rounded-md bg-gradient-from text-white text-base font-semibold cursor-pointer transition-all mt-2 hover:bg-[#5568d3] hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(102,126,234,0.4)] disabled:bg-gray-400 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
          >
            {{ isLoading ? 'Creating Account...' : 'Complete Setup' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>
