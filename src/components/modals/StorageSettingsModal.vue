<template>
  <BaseModal title="Storage Settings" size="lg" @close="$emit('close')">
      
      <form @submit.prevent="handleSubmit">
        <div v-if="!selectedProvider" class="alert-error mb-4">
          Please select a storage provider first
        </div>

        <template v-else>
          <!-- S3 Storage Settings -->
          <template v-if="selectedProvider.apiType === 's3'">
            <FormField label="Bucket Name" required :error="validationError" path="bucket" class="w-full" help="S3 bucket name where files will be stored">
              <input
                v-model="form.bucket"
                type="text"
                class="form-input"
                placeholder="my-bucket"
              />
            </FormField>

            <FormField label="Key Prefix" class="w-full" help='Prefix for all object keys (e.g., "projects/123/")'>
              <input
                v-model="form.prefix"
                type="text"
                class="form-input"
                placeholder="projects/123/"
              />
            </FormField>

            <FormField label="Access Control List (ACL)" class="w-full" help="Access control for uploaded objects">
              <select v-model="form.acl" class="form-select">
                <option :value="null">Default</option>
                <option value="private">Private</option>
                <option value="public-read">Public Read</option>
                <option value="public-read-write">Public Read/Write</option>
                <option value="authenticated-read">Authenticated Read</option>
              </select>
            </FormField>

            <FormField label="Server-Side Encryption" class="w-full" help="Encryption method for stored objects">
              <select v-model="form.serverSideEncryption" class="form-select">
                <option :value="null">None</option>
                <option value="AES256">AES256</option>
                <option value="aws:kms">AWS KMS</option>
              </select>
            </FormField>
          </template>

          <!-- Azure Blob Storage Settings -->
          <template v-if="selectedProvider.apiType === 'azure-blob'">
            <FormField label="Container Name" required :error="validationError" path="containerName" class="w-full" help="Azure Blob Storage container name">
              <input
                v-model="form.containerName"
                type="text"
                class="form-input"
                placeholder="my-container"
              />
            </FormField>

            <FormField label="Blob Prefix" class="w-full" help='Prefix for all blob names (e.g., "projects/123/")'>
              <input
                v-model="form.prefix"
                type="text"
                class="form-input"
                placeholder="projects/123/"
              />
            </FormField>

            <FormField label="Access Tier" class="w-full" help="Storage tier for uploaded blobs">
              <select v-model="form.tier" class="form-select">
                <option :value="null">Default</option>
                <option value="Hot">Hot - Frequently accessed</option>
                <option value="Cool">Cool - Infrequently accessed</option>
                <option value="Archive">Archive - Rarely accessed</option>
              </select>
            </FormField>
          </template>

          <!-- Google Cloud Storage Settings -->
          <template v-if="selectedProvider.apiType === 'gcs'">
            <FormField label="Bucket Name" required :error="validationError" path="bucketName" class="w-full" help="Google Cloud Storage bucket name">
              <input
                v-model="form.bucketName"
                type="text"
                class="form-input"
                placeholder="my-bucket"
              />
            </FormField>

            <FormField label="Object Prefix" class="w-full" help='Prefix for all object names (e.g., "projects/123/")'>
              <input
                v-model="form.prefix"
                type="text"
                class="form-input"
                placeholder="projects/123/"
              />
            </FormField>

            <FormField label="Storage Class" class="w-full" help="Storage class for uploaded objects">
              <select v-model="form.storageClass" class="form-select">
                <option :value="null">Default</option>
                <option value="STANDARD">Standard - Frequently accessed</option>
                <option value="NEARLINE">Nearline - Accessed ~once/month</option>
                <option value="COLDLINE">Coldline - Accessed ~once/year</option>
                <option value="ARCHIVE">Archive - Long-term storage</option>
              </select>
            </FormField>
          </template>

          <!-- Local Storage Settings -->
          <template v-if="selectedProvider.apiType === 'local'">
            <FormField label="Subdirectory" class="w-full" help="Subdirectory within the base path for this project's files">
              <input
                v-model="form.subPath"
                type="text"
                class="form-input"
                placeholder="project-123"
              />
            </FormField>
          </template>
        </template>

        <!-- Validation Error -->
        <ErrorDisplay :error="validationError" />

        <!-- Actions -->
        <div class="modal-footer">
          <button type="button" @click="$emit('close')" class="btn-secondary">
            Cancel
          </button>
          <button type="submit" class="btn-primary" :disabled="!selectedProvider">
            Save Settings
          </button>
        </div>
      </form>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import BaseModal from '@/components/BaseModal.vue'
import FormField from '@/components/FormField.vue'
import ErrorDisplay from '@/components/ErrorDisplay.vue'
import type { ProviderResponse, ParsedError } from '@/api/types'

interface StorageSettings {
  // S3
  bucket?: string
  prefix?: string
  acl?: 'private' | 'public-read' | 'public-read-write' | 'authenticated-read' | null
  serverSideEncryption?: 'AES256' | 'aws:kms' | null
  // Azure Blob
  containerName?: string
  tier?: 'Hot' | 'Cool' | 'Archive' | null
  // GCS
  bucketName?: string
  storageClass?: 'STANDARD' | 'NEARLINE' | 'COLDLINE' | 'ARCHIVE' | null
  // Local
  subPath?: string
}

interface Props {
  selectedProvider: ProviderResponse | null
  settings?: StorageSettings | null
}

const props = withDefaults(defineProps<Props>(), {
  settings: null
})

const emit = defineEmits<{
  close: []
  save: [settings: StorageSettings]
}>()

const validationError = ref<ParsedError | null>(null)

const form = ref<{
  bucket: string
  containerName: string
  bucketName: string
  prefix: string
  subPath: string
  acl: 'private' | 'public-read' | 'public-read-write' | 'authenticated-read' | null
  serverSideEncryption: 'AES256' | 'aws:kms' | null
  tier: 'Hot' | 'Cool' | 'Archive' | null
  storageClass: 'STANDARD' | 'NEARLINE' | 'COLDLINE' | 'ARCHIVE' | null
}>({
  bucket: '',
  containerName: '',
  bucketName: '',
  prefix: '',
  subPath: '',
  acl: null,
  serverSideEncryption: null,
  tier: null,
  storageClass: null
})

// Watch for settings changes to initialize form
watch(() => props.settings, (settings) => {
  if (settings) {
    form.value = {
      bucket: settings.bucket || '',
      containerName: settings.containerName || '',
      bucketName: settings.bucketName || '',
      prefix: settings.prefix || '',
      subPath: settings.subPath || '',
      acl: settings.acl || null,
      serverSideEncryption: settings.serverSideEncryption || null,
      tier: settings.tier || null,
      storageClass: settings.storageClass || null
    }
  } else {
    form.value = {
      bucket: '',
      containerName: '',
      bucketName: '',
      prefix: '',
      subPath: '',
      acl: null,
      serverSideEncryption: null,
      tier: null,
      storageClass: null
    }
  }
}, { immediate: true })

const handleSubmit = () => {
  validationError.value = null
  
  if (!props.selectedProvider) {
    validationError.value = { message: 'No storage provider selected' }
    return
  }

  // Build settings object based on provider type
  const settings: StorageSettings = {}

  if (props.selectedProvider.apiType === 's3') {
    if (!form.value.bucket) {
      validationError.value = { message: 'Bucket name is required', details: [{ path: ['bucket'], message: 'Bucket name is required', code: 'REQUIRED' }] }
      return
    }
    settings.bucket = form.value.bucket
    if (form.value.prefix) settings.prefix = form.value.prefix
    if (form.value.acl) settings.acl = form.value.acl
    if (form.value.serverSideEncryption) settings.serverSideEncryption = form.value.serverSideEncryption
  } else if (props.selectedProvider.apiType === 'azure-blob') {
    if (!form.value.containerName) {
      validationError.value = { message: 'Container name is required', details: [{ path: ['containerName'], message: 'Container name is required', code: 'REQUIRED' }] }
      return
    }
    settings.containerName = form.value.containerName
    if (form.value.prefix) settings.prefix = form.value.prefix
    if (form.value.tier) settings.tier = form.value.tier
  } else if (props.selectedProvider.apiType === 'gcs') {
    if (!form.value.bucketName) {
      validationError.value = { message: 'Bucket name is required', details: [{ path: ['bucketName'], message: 'Bucket name is required', code: 'REQUIRED' }] }
      return
    }
    settings.bucketName = form.value.bucketName
    if (form.value.prefix) settings.prefix = form.value.prefix
    if (form.value.storageClass) settings.storageClass = form.value.storageClass
  } else if (props.selectedProvider.apiType === 'local') {
    if (form.value.subPath) settings.subPath = form.value.subPath
  } else {
    validationError.value = { message: 'Unsupported storage provider type' }
    return
  }

  emit('save', settings)
}
</script>

<style scoped>
.required {
  color: #ef4444;
}
</style>
