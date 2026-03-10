<template>
  <div class="modal-overlay">
    <div class="modal-content" @click.stop>
      <h2 class="modal-header">Storage Settings</h2>
      
      <form @submit.prevent="handleSubmit">
        <div v-if="!selectedProvider" class="alert-error mb-4">
          Please select a storage provider first
        </div>

        <template v-else>
          <!-- S3 Storage Settings -->
          <template v-if="selectedProvider.apiType === 's3'">
            <div class="form-group">
              <label class="form-label">
                Bucket Name <span class="required">*</span>
              </label>
              <input
                v-model="form.bucket"
                type="text"
                required
                class="form-input"
                placeholder="my-bucket"
              />
              <p class="form-help-text">
                S3 bucket name where files will be stored
              </p>
            </div>

            <div class="form-group">
              <label class="form-label">
                Key Prefix <span class="text-gray-500">(optional)</span>
              </label>
              <input
                v-model="form.prefix"
                type="text"
                class="form-input"
                placeholder="projects/123/"
              />
              <p class="form-help-text">
                Prefix for all object keys (e.g., "projects/123/")
              </p>
            </div>

            <div class="form-group">
              <label class="form-label">
                Access Control List (ACL) <span class="text-gray-500">(optional)</span>
              </label>
              <select v-model="form.acl" class="form-select">
                <option :value="null">Default</option>
                <option value="private">Private</option>
                <option value="public-read">Public Read</option>
                <option value="public-read-write">Public Read/Write</option>
                <option value="authenticated-read">Authenticated Read</option>
              </select>
              <p class="form-help-text">
                Access control for uploaded objects
              </p>
            </div>

            <div class="form-group">
              <label class="form-label">
                Server-Side Encryption <span class="text-gray-500">(optional)</span>
              </label>
              <select v-model="form.serverSideEncryption" class="form-select">
                <option :value="null">None</option>
                <option value="AES256">AES256</option>
                <option value="aws:kms">AWS KMS</option>
              </select>
              <p class="form-help-text">
                Encryption method for stored objects
              </p>
            </div>
          </template>

          <!-- Azure Blob Storage Settings -->
          <template v-if="selectedProvider.apiType === 'azure-blob'">
            <div class="form-group">
              <label class="form-label">
                Container Name <span class="required">*</span>
              </label>
              <input
                v-model="form.containerName"
                type="text"
                required
                class="form-input"
                placeholder="my-container"
              />
              <p class="form-help-text">
                Azure Blob Storage container name
              </p>
            </div>

            <div class="form-group">
              <label class="form-label">
                Blob Prefix <span class="text-gray-500">(optional)</span>
              </label>
              <input
                v-model="form.prefix"
                type="text"
                class="form-input"
                placeholder="projects/123/"
              />
              <p class="form-help-text">
                Prefix for all blob names (e.g., "projects/123/")
              </p>
            </div>

            <div class="form-group">
              <label class="form-label">
                Access Tier <span class="text-gray-500">(optional)</span>
              </label>
              <select v-model="form.tier" class="form-select">
                <option :value="null">Default</option>
                <option value="Hot">Hot - Frequently accessed</option>
                <option value="Cool">Cool - Infrequently accessed</option>
                <option value="Archive">Archive - Rarely accessed</option>
              </select>
              <p class="form-help-text">
                Storage tier for uploaded blobs
              </p>
            </div>
          </template>

          <!-- Google Cloud Storage Settings -->
          <template v-if="selectedProvider.apiType === 'gcs'">
            <div class="form-group">
              <label class="form-label">
                Bucket Name <span class="required">*</span>
              </label>
              <input
                v-model="form.bucketName"
                type="text"
                required
                class="form-input"
                placeholder="my-bucket"
              />
              <p class="form-help-text">
                Google Cloud Storage bucket name
              </p>
            </div>

            <div class="form-group">
              <label class="form-label">
                Object Prefix <span class="text-gray-500">(optional)</span>
              </label>
              <input
                v-model="form.prefix"
                type="text"
                class="form-input"
                placeholder="projects/123/"
              />
              <p class="form-help-text">
                Prefix for all object names (e.g., "projects/123/")
              </p>
            </div>

            <div class="form-group">
              <label class="form-label">
                Storage Class <span class="text-gray-500">(optional)</span>
              </label>
              <select v-model="form.storageClass" class="form-select">
                <option :value="null">Default</option>
                <option value="STANDARD">Standard - Frequently accessed</option>
                <option value="NEARLINE">Nearline - Accessed ~once/month</option>
                <option value="COLDLINE">Coldline - Accessed ~once/year</option>
                <option value="ARCHIVE">Archive - Long-term storage</option>
              </select>
              <p class="form-help-text">
                Storage class for uploaded objects
              </p>
            </div>
          </template>

          <!-- Local Storage Settings -->
          <template v-if="selectedProvider.apiType === 'local'">
            <div class="form-group">
              <label class="form-label">
                Subdirectory <span class="text-gray-500">(optional)</span>
              </label>
              <input
                v-model="form.subPath"
                type="text"
                class="form-input"
                placeholder="project-123"
              />
              <p class="form-help-text">
                Subdirectory within the base path for this project's files
              </p>
            </div>
          </template>
        </template>

        <!-- Validation Error -->
        <div v-if="validationError" class="alert-error">
          {{ validationError }}
        </div>

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
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { ProviderResponse } from '@/api/types'

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

const validationError = ref<string | null>(null)

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
    validationError.value = 'No storage provider selected'
    return
  }

  // Build settings object based on provider type
  const settings: StorageSettings = {}

  if (props.selectedProvider.apiType === 's3') {
    if (!form.value.bucket) {
      validationError.value = 'Bucket name is required for S3 storage'
      return
    }
    settings.bucket = form.value.bucket
    if (form.value.prefix) settings.prefix = form.value.prefix
    if (form.value.acl) settings.acl = form.value.acl
    if (form.value.serverSideEncryption) settings.serverSideEncryption = form.value.serverSideEncryption
  } else if (props.selectedProvider.apiType === 'azure-blob') {
    if (!form.value.containerName) {
      validationError.value = 'Container name is required for Azure Blob storage'
      return
    }
    settings.containerName = form.value.containerName
    if (form.value.prefix) settings.prefix = form.value.prefix
    if (form.value.tier) settings.tier = form.value.tier
  } else if (props.selectedProvider.apiType === 'gcs') {
    if (!form.value.bucketName) {
      validationError.value = 'Bucket name is required for Google Cloud Storage'
      return
    }
    settings.bucketName = form.value.bucketName
    if (form.value.prefix) settings.prefix = form.value.prefix
    if (form.value.storageClass) settings.storageClass = form.value.storageClass
  } else if (props.selectedProvider.apiType === 'local') {
    if (form.value.subPath) settings.subPath = form.value.subPath
  } else {
    validationError.value = 'Unsupported storage provider type'
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
