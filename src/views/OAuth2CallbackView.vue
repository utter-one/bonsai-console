<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import apiClient from '@/api/client'
import logoUrl from '@/assets/logo.svg'

const route = useRoute()
const router = useRouter()

const status = ref<'loading' | 'success' | 'error'>('loading')
const message = ref('')

const code = computed(() => route.query.code as string)
const state = computed(() => route.query.state as string)
const errorParam = computed(() => route.query.error as string)

onMounted(async () => {
  if (errorParam.value) {
    status.value = 'error'
    message.value = errorParam.value === 'access_denied'
      ? 'You denied access. The provider configuration remains unchanged.'
      : `OAuth2 error: ${errorParam.value}`
    return
  }

  if (!code.value || !state.value) {
    status.value = 'error'
    message.value = 'Missing authorization code or state parameter. The OAuth2 flow may have been interrupted.'
    return
  }

  try {
    const res = await apiClient.emailSmtpImapOauth2CallbackList({
      code: code.value,
      state: state.value,
    })

    if (res.success) {
      status.value = 'success'
      message.value = res.message || 'OAuth2 authorization successful! Your email provider is now configured.'
    } else {
      status.value = 'error'
      message.value = res.message || 'OAuth2 callback failed. Please try again.'
    }
  } catch (err: any) {
    console.error('OAuth2 callback failed:', err)
    status.value = 'error'
    message.value = err.response?.data?.message || 'Failed to complete OAuth2 authorization. Please try again.'
  }
})

function handleClose() {
  if (window.opener) {
    window.close()
  } else {
    router.push({ name: 'administration.providers' })
  }
}
</script>

<template>
  <div class="auth-container">
    <div class="w-full max-w-md">
      <div class="auth-card text-center">
        <img :src="logoUrl" alt="Bonsai Console" class="mx-auto mb-4 h-16 w-16" />
        <h1 class="text-xl font-bold text-gray-900 dark:text-white mb-2">Email OAuth2</h1>

        <!-- Loading -->
        <div v-if="status === 'loading'" class="py-8">
          <div class="spinner mx-auto mb-4"></div>
          <p class="text-gray-600 dark:text-gray-400">Completing authorization...</p>
        </div>

        <!-- Success -->
        <div v-else-if="status === 'success'" class="py-6">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 mb-4">
            <svg class="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Authorization Successful</h2>
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-6">{{ message }}</p>
          <p class="text-xs text-gray-500 dark:text-gray-500">You can close this window and return to the provider settings.</p>
          <button @click="handleClose" class="btn-primary mt-4">
            Close
          </button>
        </div>

        <!-- Error -->
        <div v-else-if="status === 'error'" class="py-6">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900 mb-4">
            <svg class="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Authorization Failed</h2>
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-6">{{ message }}</p>
          <button @click="handleClose" class="btn-primary mt-4">
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
