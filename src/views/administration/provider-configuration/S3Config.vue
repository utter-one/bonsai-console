<script setup lang="ts">
import type { ProviderConfig } from './providerPresets'

const config = defineModel<ProviderConfig>('config', { required: true })
</script>

<template>
  <div>
    <h3 class="text-lg font-semibold text-gray-900 mb-4 dark:text-white">AWS S3 Configuration</h3>

    <div class="form-group">
      <label class="form-label">
        AWS Access Key ID <span class="required">*</span>
      </label>
      <input
        v-model="config.accessKeyId"
        type="text"
        required
        placeholder="AKIA..."
        class="form-input-mono"
      />
      <p class="form-help-text">Your AWS Access Key ID for S3 access</p>
    </div>

    <div class="form-group">
      <label class="form-label">
        AWS Secret Access Key <span class="required">*</span>
      </label>
      <input
        v-model="config.secretAccessKey"
        type="password"
        required
        placeholder="..."
        class="form-input-mono"
      />
      <p class="form-help-text">Your AWS Secret Access Key for S3 access</p>
    </div>

    <div class="form-group">
      <label class="form-label">
        AWS Region <span class="required">*</span>
      </label>
      <input
        v-model="config.region"
        type="text"
        required
        placeholder="us-east-1"
        class="form-input-mono"
      />
      <p class="form-help-text">AWS region for S3 (e.g., us-east-1, eu-west-1)</p>
    </div>

    <div class="form-group">
      <label class="form-label">
        Custom Endpoint <span class="text-gray-500">(optional)</span>
      </label>
      <input
        v-model="config.endpoint"
        type="url"
        placeholder="https://s3.example.com"
        class="form-input-mono"
      />
      <p class="form-help-text">Optional custom endpoint for S3-compatible services (e.g., MinIO)</p>
    </div>
  </div>
</template>
