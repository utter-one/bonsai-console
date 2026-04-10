<script setup lang="ts">
import { computed } from 'vue'
import AsrAzureSettings from '@/components/asr/AsrAzureSettings.vue'
import AsrElevenLabsSettings from '@/components/asr/AsrElevenLabsSettings.vue'
import AsrDeepgramSettings from '@/components/asr/AsrDeepgramSettings.vue'
import AsrAssemblyAiSettings from '@/components/asr/AsrAssemblyAiSettings.vue'
import AsrSpeechmaticsSettings from '@/components/asr/AsrSpeechmaticsSettings.vue'

// The union members' audioFormat literals are incompatible so we keep the dispatcher
// model as an opaque record — type safety is enforced in each leaf component.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AsrSettingsRecord = Record<string, any>

const props = defineProps<{
  apiType: string
}>()

const settings = defineModel<AsrSettingsRecord>({ required: true })

const isAzure = computed(() => {
  const t = props.apiType?.toLowerCase()
  return t === 'azure-speech' || t === 'azure'
})

const isElevenLabs = computed(() => {
  const t = props.apiType?.toLowerCase()
  return t === 'elevenlabs-scribe' || t === 'elevenlabs'
})

const isDeepgram = computed(() => props.apiType?.toLowerCase() === 'deepgram')

const isAssemblyAi = computed(() => props.apiType?.toLowerCase() === 'assemblyai')

const isSpeechmatics = computed(() => props.apiType?.toLowerCase() === 'speechmatics')
</script>

<template>
  <AsrAzureSettings v-if="isAzure" v-model="settings" />
  <AsrElevenLabsSettings v-else-if="isElevenLabs" v-model="settings" />
  <AsrDeepgramSettings v-else-if="isDeepgram" v-model="settings" />
  <AsrAssemblyAiSettings v-else-if="isAssemblyAi" v-model="settings" />
  <AsrSpeechmaticsSettings v-else-if="isSpeechmatics" v-model="settings" />
</template>
