<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useProvidersStore, useProjectsStore, useProjectSelectionStore } from '@/stores'
import {
  X,
  Brain,
  Mic,
  Volume2,
  Trash2,
  Check,
  ExternalLink,
  Sparkles,
  BriefcaseBusiness,
  PartyPopper,
  ArrowRight,
  BookOpen,
  AlertTriangle,
} from 'lucide-vue-next'

const emit = defineEmits<{
  close: []
  projectCreated: []
}>()

const router = useRouter()
const providersStore = useProvidersStore()
const projectsStore = useProjectsStore()
const projectSelectionStore = useProjectSelectionStore()

// Step management
type Step = 'providers' | 'project' | 'done'
const currentStep = ref<Step>('providers')
const steps: Step[] = ['providers', 'project', 'done']
const stepIndex = computed(() => steps.indexOf(currentStep.value))

function stepLabel(step: Step): string {
  switch (step) {
    case 'providers': return 'Providers'
    case 'project': return 'Project'
    case 'done': return 'Done'
  }
}

// Provider type
type ProviderType = 'llm' | 'asr' | 'tts'

// Brand definitions — apiType + credentials shape are fully described here

interface BrandDef {
  brandKey: string
  displayName: string
  apiType: string
  baseUrl?: string            // pre-set for OpenAI-compatible providers, not shown in form
  needsRegion: boolean        // show Region field
  needsSubscriptionKey: boolean  // Azure: use subscriptionKey instead of apiKey
  apiKeyUrl: string | null    // link to get the credential
  color: string               // accent color for the brand initial
}

const LLM_BRANDS: BrandDef[] = [
  { brandKey: 'openai',      displayName: 'OpenAI',       apiType: 'openai',     baseUrl: 'https://api.openai.com/v1',              needsRegion: false, needsSubscriptionKey: false, apiKeyUrl: 'https://platform.openai.com/api-keys',          color: '#10a37f' },
  { brandKey: 'anthropic',   displayName: 'Anthropic',    apiType: 'anthropic',                                                     needsRegion: false, needsSubscriptionKey: false, apiKeyUrl: 'https://console.anthropic.com/settings/keys',   color: '#d97706' },
  { brandKey: 'gemini',      displayName: 'Google Gemini',apiType: 'gemini',                                                        needsRegion: false, needsSubscriptionKey: false, apiKeyUrl: 'https://aistudio.google.com/app/apikey',        color: '#4285F4' },
  { brandKey: 'mistral',     displayName: 'Mistral AI',   apiType: 'openai',     baseUrl: 'https://api.mistral.ai/v1',              needsRegion: false, needsSubscriptionKey: false, apiKeyUrl: 'https://console.mistral.ai/api-keys',           color: '#f2773d' },
  { brandKey: 'groq',        displayName: 'Groq',         apiType: 'openai',     baseUrl: 'https://api.groq.com/openai/v1',         needsRegion: false, needsSubscriptionKey: false, apiKeyUrl: 'https://console.groq.com/keys',                 color: '#f55036' },
  { brandKey: 'deepseek',    displayName: 'DeepSeek',     apiType: 'openai',     baseUrl: 'https://api.deepseek.com/v1',            needsRegion: false, needsSubscriptionKey: false, apiKeyUrl: 'https://platform.deepseek.com/api_keys',        color: '#1a73e8' },
  { brandKey: 'xai',         displayName: 'xAI (Grok)',   apiType: 'openai',     baseUrl: 'https://api.x.ai/v1',                    needsRegion: false, needsSubscriptionKey: false, apiKeyUrl: 'https://console.x.ai',                         color: '#374151' },
  { brandKey: 'openrouter',  displayName: 'OpenRouter',   apiType: 'openai',     baseUrl: 'https://openrouter.ai/api/v1',           needsRegion: false, needsSubscriptionKey: false, apiKeyUrl: 'https://openrouter.ai/settings/keys',           color: '#8b5cf6' },
  { brandKey: 'together',    displayName: 'Together AI',  apiType: 'openai',     baseUrl: 'https://api.together.xyz/v1',            needsRegion: false, needsSubscriptionKey: false, apiKeyUrl: 'https://api.together.xyz/settings/api-keys',    color: '#6366f1' },
  { brandKey: 'fireworks',   displayName: 'Fireworks AI', apiType: 'openai',     baseUrl: 'https://api.fireworks.ai/inference/v1',  needsRegion: false, needsSubscriptionKey: false, apiKeyUrl: 'https://fireworks.ai/account/api-keys',         color: '#ff6b35' },
  { brandKey: 'perplexity',  displayName: 'Perplexity',   apiType: 'openai',     baseUrl: 'https://api.perplexity.ai',             needsRegion: false, needsSubscriptionKey: false, apiKeyUrl: 'https://perplexity.ai/settings/api',            color: '#20808d' },
  { brandKey: 'cohere',      displayName: 'Cohere',       apiType: 'openai',     baseUrl: 'https://api.cohere.ai/v1',               needsRegion: false, needsSubscriptionKey: false, apiKeyUrl: 'https://dashboard.cohere.com/api-keys',         color: '#d18ee2' },
]

const ASR_BRANDS: BrandDef[] = [
  { brandKey: 'deepgram',      displayName: 'Deepgram',      apiType: 'deepgram',      needsRegion: false, needsSubscriptionKey: false, apiKeyUrl: 'https://console.deepgram.com',                     color: '#00d3d0' },
  { brandKey: 'assemblyai',    displayName: 'AssemblyAI',    apiType: 'assemblyai',    needsRegion: true,  needsSubscriptionKey: false, apiKeyUrl: 'https://assemblyai.com/app',                       color: '#3d5afe' },
  { brandKey: 'speechmatics',  displayName: 'Speechmatics',  apiType: 'speechmatics',  needsRegion: true,  needsSubscriptionKey: false, apiKeyUrl: 'https://portal.speechmatics.com/api-keys',        color: '#00b09b' },
  { brandKey: 'elevenlabs-asr',displayName: 'ElevenLabs',    apiType: 'elevenlabs',    needsRegion: false, needsSubscriptionKey: false, apiKeyUrl: 'https://elevenlabs.io/app/settings/api-keys',     color: '#7c3aed' },
  { brandKey: 'azure-asr',     displayName: 'Azure Speech',  apiType: 'azure',         needsRegion: true,  needsSubscriptionKey: true,  apiKeyUrl: 'https://portal.azure.com',                        color: '#0078d4' },
]

const TTS_BRANDS: BrandDef[] = [
  { brandKey: 'elevenlabs',  displayName: 'ElevenLabs',   apiType: 'elevenlabs', needsRegion: false, needsSubscriptionKey: false, apiKeyUrl: 'https://elevenlabs.io/app/settings/api-keys', color: '#7c3aed' },
  { brandKey: 'cartesia',    displayName: 'Cartesia',     apiType: 'cartesia',   needsRegion: false, needsSubscriptionKey: false, apiKeyUrl: 'https://play.cartesia.ai/keys',               color: '#ec4899' },
  { brandKey: 'openai-tts',  displayName: 'OpenAI TTS',  apiType: 'openai',     baseUrl: 'https://api.openai.com/v1', needsRegion: false, needsSubscriptionKey: false, apiKeyUrl: 'https://platform.openai.com/api-keys', color: '#10a37f' },
  { brandKey: 'azure-tts',   displayName: 'Azure Speech', apiType: 'azure',     needsRegion: true,  needsSubscriptionKey: true,  apiKeyUrl: 'https://portal.azure.com',                   color: '#0078d4' },
]

const BRANDS_BY_TYPE: Record<ProviderType, BrandDef[]> = {
  llm: LLM_BRANDS,
  asr: ASR_BRANDS,
  tts: TTS_BRANDS,
}

const SECTION_META: Record<ProviderType, { icon: any; label: string; description: string; typeSuffix: string }> = {
  llm: { icon: Brain,   label: 'Language Model (LLM)',        description: 'Required — the AI brain powering conversations', typeSuffix: 'LLM' },
  asr: { icon: Mic,     label: 'Speech Recognition (ASR)',    description: 'Optional — enables voice input from users',      typeSuffix: 'ASR' },
  tts: { icon: Volume2, label: 'Text-to-Speech (TTS)',        description: 'Optional — enables spoken responses from agents', typeSuffix: 'TTS' },
}

// Added providers tracking
interface AddedProvider {
  id: string
  name: string
  apiType: string
  providerType: ProviderType
}

const addedProviders = ref<AddedProvider[]>([])

function addedByType(type: ProviderType) {
  return addedProviders.value.filter(p => p.providerType === type)
}

function removeProvider(providerId: string) {
  addedProviders.value = addedProviders.value.filter(p => p.id !== providerId)
}

// Active brand selection — one per section at a time (null = no form open for that section)
const activeBrand = ref<Partial<Record<ProviderType, string | null>>>({})

function activeFormBrand(type: ProviderType): BrandDef | null {
  const key = activeBrand.value[type]
  if (!key) return null
  return BRANDS_BY_TYPE[type].find(b => b.brandKey === key) ?? null
}

// Form state per section
interface SectionForm {
  name: string
  apiKey: string
  subscriptionKey: string
  region: string
}

function emptyForm(): SectionForm {
  return { name: '', apiKey: '', subscriptionKey: '', region: '' }
}

const sectionForms = ref<Record<ProviderType, SectionForm>>({
  llm: emptyForm(),
  asr: emptyForm(),
  tts: emptyForm(),
})

const sectionErrors = ref<Record<ProviderType, string | null>>({
  llm: null,
  asr: null,
  tts: null,
})

const isCreatingProvider = ref(false)

function selectBrand(type: ProviderType, brandKey: string) {
  if (activeBrand.value[type] === brandKey) {
    // Toggle off
    activeBrand.value = { ...activeBrand.value, [type]: null }
    sectionForms.value[type] = emptyForm()
    sectionErrors.value[type] = null
    return
  }
  activeBrand.value = { ...activeBrand.value, [type]: brandKey }
  const brand = BRANDS_BY_TYPE[type].find(b => b.brandKey === brandKey)
  sectionForms.value[type] = {
    ...emptyForm(),
    name: brand ? `${brand.displayName} ${SECTION_META[type].typeSuffix}` : '',
  }
  sectionErrors.value[type] = null
}

async function submitProvider(type: ProviderType) {
  const brand = activeFormBrand(type)
  if (!brand) return

  const form = sectionForms.value[type]
  sectionErrors.value[type] = null

  if (!form.name.trim()) {
    sectionErrors.value[type] = 'Name is required'
    return
  }

  let config: Record<string, string> = {}

  if (brand.needsSubscriptionKey) {
    if (!form.subscriptionKey.trim() || !form.region.trim()) {
      sectionErrors.value[type] = 'Region and Subscription Key are required'
      return
    }
    config = { region: form.region.trim(), subscriptionKey: form.subscriptionKey.trim() }
  } else {
    if (!form.apiKey.trim()) {
      sectionErrors.value[type] = 'API Key is required'
      return
    }
    config = { apiKey: form.apiKey.trim() }
    if (brand.needsRegion && form.region.trim()) {
      config.region = form.region.trim()
    }
    if (brand.baseUrl) {
      config.baseUrl = brand.baseUrl
    }
  }

  isCreatingProvider.value = true
  try {
    const created = await providersStore.create({
      name: form.name.trim(),
      providerType: type,
      apiType: brand.apiType,
      config: config as any,
    })

    addedProviders.value.push({
      id: created.id,
      name: created.name,
      apiType: created.apiType,
      providerType: created.providerType as ProviderType,
    })

    activeBrand.value = { ...activeBrand.value, [type]: null }
    sectionForms.value[type] = emptyForm()
  } catch (err: any) {
    sectionErrors.value[type] = err.response?.data?.message || 'Failed to create provider'
  } finally {
    isCreatingProvider.value = false
  }
}

const hasLlmProvider = computed(() => addedProviders.value.some(p => p.providerType === 'llm'))

// Project form
const projectForm = ref({ name: '', description: '' })
const projectError = ref<string | null>(null)
const isCreatingProject = ref(false)
const projectCreated = ref(false)

async function submitProject() {
  projectError.value = null
  if (!projectForm.value.name.trim()) {
    projectError.value = 'Project name is required'
    return
  }

  isCreatingProject.value = true
  try {
    const newProject = await projectsStore.create({
      name: projectForm.value.name.trim(),
      description: projectForm.value.description.trim() || undefined,
    })
    projectSelectionStore.setSelectedProjectId(newProject.id)
    projectCreated.value = true
    emit('projectCreated')
    currentStep.value = 'done'
  } catch (err: any) {
    projectError.value = err.response?.data?.message || 'Failed to create project'
  } finally {
    isCreatingProject.value = false
  }
}

function dismiss() {
  localStorage.setItem('bonsai_wizard_dismissed', 'true')
  emit('close')
}

function navigateAndDismiss(name: string) {
  dismiss()
  router.push({ name })
}
</script>

<template>
  <div class="modal-overlay" @click.self="dismiss">
    <div class="modal-content max-w-2xl w-full max-h-[90vh] flex flex-col">

      <!-- Header -->
      <div class="modal-header flex items-center justify-between">
        <div>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Sparkles class="text-primary-500" :size="20" />
            Setup Wizard
          </h2>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Let's get Bonsai up and running</p>
        </div>
        <button @click="dismiss" class="btn-icon" title="Close">
          <X :size="20" />
        </button>
      </div>

      <!-- Step indicator -->
      <div class="flex items-center px-6 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
        <template v-for="(step, idx) in steps" :key="step">
          <div class="flex items-center gap-2">
            <div
              :class="[
                'w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold transition-colors',
                stepIndex > idx
                  ? 'bg-green-500 text-white'
                  : stepIndex === idx
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400'
              ]"
            >
              <Check v-if="stepIndex > idx" :size="14" />
              <span v-else>{{ idx + 1 }}</span>
            </div>
            <span :class="['text-sm font-medium', stepIndex === idx ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500']">
              {{ stepLabel(step) }}
            </span>
          </div>
          <div v-if="idx < steps.length - 1" class="flex-1 h-px bg-gray-200 dark:bg-gray-700 mx-3 min-w-4" />
        </template>
      </div>

      <!-- Scrollable content -->
      <div class="flex-1 overflow-y-auto px-6 py-5">

        <!-- Step 1: Providers -->
        <div v-if="currentStep === 'providers'">
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-5">
            Connect the AI services that power your projects. At minimum, an LLM provider is needed to run conversations.
            <a href="/help/administration/providers" target="_blank" class="text-primary-600 hover:underline inline-flex items-center gap-1 ml-1">
              Providers docs <ExternalLink :size="12" />
            </a>
          </p>

          <!-- Provider sections -->
          <div class="flex flex-col gap-5">
            <div
              v-for="type in (['llm', 'asr', 'tts'] as ProviderType[])"
              :key="type"
              class="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
            >
              <!-- Section header -->
              <div
                :class="[
                  'flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700',
                  type === 'llm' ? 'bg-primary-50 dark:bg-primary-900/10' : 'bg-gray-50 dark:bg-gray-800/50'
                ]"
              >
                <component
                  :is="SECTION_META[type].icon"
                  :size="18"
                  :class="type === 'llm' ? 'text-primary-500' : type === 'asr' ? 'text-blue-500' : 'text-purple-500'"
                />
                <div class="flex-1 min-w-0">
                  <span class="font-semibold text-sm text-gray-900 dark:text-white">{{ SECTION_META[type].label }}</span>
                  <span class="text-xs text-gray-500 dark:text-gray-400 ml-2">{{ SECTION_META[type].description }}</span>
                </div>
                <div v-if="addedByType(type).length > 0" class="inline-flex items-center gap-1 text-xs font-medium text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded-full">
                  <Check :size="11" /> {{ addedByType(type).length }} added
                </div>
              </div>

              <div class="p-4 bg-white dark:bg-gray-800">
                <!-- Already added providers -->
                <div v-if="addedByType(type).length > 0" class="mb-4 flex flex-col gap-1.5">
                  <div
                    v-for="added in addedByType(type)"
                    :key="added.id"
                    class="flex items-center justify-between rounded border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 px-3 py-2"
                  >
                    <div class="flex items-center gap-2">
                      <Check :size="13" class="text-green-500 shrink-0" />
                      <span class="text-sm font-medium text-gray-900 dark:text-white">{{ added.name }}</span>
                      <span class="badge badge-secondary text-xs">{{ added.apiType }}</span>
                    </div>
                    <button type="button" class="btn-icon text-gray-400 hover:text-red-500" title="Remove" @click="removeProvider(added.id)">
                      <Trash2 :size="13" />
                    </button>
                  </div>
                </div>

                <!-- Brand grid -->
                <div class="flex flex-wrap gap-2 mb-3">
                  <button
                    v-for="brand in BRANDS_BY_TYPE[type]"
                    :key="brand.brandKey"
                    type="button"
                    :class="[
                      'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-sm font-medium transition-all',
                      activeBrand[type] === brand.brandKey
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 shadow-sm'
                        : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-650'
                    ]"
                    @click="selectBrand(type, brand.brandKey)"
                  >
                    <span
                      class="inline-flex items-center justify-center w-4 h-4 rounded text-white text-[9px] font-bold shrink-0"
                      :style="{ backgroundColor: brand.color }"
                    >{{ brand.displayName[0] }}</span>
                    {{ brand.displayName }}
                  </button>
                </div>

                <!-- Inline form for selected brand -->
                <Transition
                  enter-active-class="transition-all duration-150 ease-out"
                  enter-from-class="opacity-0 -translate-y-1"
                  enter-to-class="opacity-100 translate-y-0"
                  leave-active-class="transition-all duration-100 ease-in"
                  leave-from-class="opacity-100 translate-y-0"
                  leave-to-class="opacity-0 -translate-y-1"
                >
                  <div
                    v-if="activeFormBrand(type)"
                    class="mt-1 rounded-lg border border-primary-200 dark:border-primary-800/50 bg-primary-50/50 dark:bg-primary-900/10 p-4 flex flex-col gap-3"
                  >
                    <!-- Error -->
                    <div v-if="sectionErrors[type]" class="alert-error text-sm">{{ sectionErrors[type] }}</div>

                    <!-- Name -->
                    <div class="form-group mb-0">
                      <label class="form-label">Provider Name <span class="required">*</span></label>
                      <input
                        v-model="sectionForms[type].name"
                        type="text"
                        class="form-input"
                        :placeholder="`e.g. ${activeFormBrand(type)?.displayName} ${SECTION_META[type].typeSuffix}`"
                      />
                    </div>

                    <!-- API Key -->
                    <div v-if="!activeFormBrand(type)?.needsSubscriptionKey" class="form-group mb-0">
                      <label class="form-label flex items-center justify-between">
                        <span>API Key <span class="required">*</span></span>
                        <a
                          v-if="activeFormBrand(type)?.apiKeyUrl"
                          :href="activeFormBrand(type)!.apiKeyUrl!"
                          target="_blank"
                          rel="noopener noreferrer"
                          class="text-xs text-primary-600 dark:text-primary-400 hover:underline inline-flex items-center gap-1"
                        >
                          Get API key <ExternalLink :size="11" />
                        </a>
                      </label>
                      <input
                        v-model="sectionForms[type].apiKey"
                        type="password"
                        class="form-input font-mono"
                        placeholder="sk-…"
                        autocomplete="off"
                      />
                    </div>

                    <!-- Azure Subscription Key -->
                    <div v-if="activeFormBrand(type)?.needsSubscriptionKey" class="form-group mb-0">
                      <label class="form-label flex items-center justify-between">
                        <span>Subscription Key <span class="required">*</span></span>
                        <a
                          href="https://portal.azure.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          class="text-xs text-primary-600 dark:text-primary-400 hover:underline inline-flex items-center gap-1"
                        >
                          Azure Portal <ExternalLink :size="11" />
                        </a>
                      </label>
                      <input v-model="sectionForms[type].subscriptionKey" type="password" class="form-input font-mono" autocomplete="off" />
                    </div>

                    <!-- Region -->
                    <div v-if="activeFormBrand(type)?.needsRegion" class="form-group mb-0">
                      <label class="form-label">Region <span class="required">*</span></label>
                      <input
                        v-model="sectionForms[type].region"
                        type="text"
                        class="form-input"
                        placeholder="e.g. us, eu, eastus"
                      />
                    </div>

                    <!-- Actions -->
                    <div class="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        class="btn-primary py-1.5 px-4 text-sm inline-flex items-center gap-1.5"
                        :disabled="isCreatingProvider"
                        @click="submitProvider(type)"
                      >
                        <Check :size="14" />
                        {{ isCreatingProvider ? 'Adding…' : 'Add Provider' }}
                      </button>
                      <button
                        type="button"
                        class="btn-secondary py-1.5 px-3 text-sm"
                        @click="activeBrand[type] = null"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </Transition>
              </div>
            </div>
          </div>

          <!-- LLM advisory -->
          <div v-if="!hasLlmProvider" class="flex items-start gap-2 mt-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-sm text-amber-800 dark:text-amber-300">
            <AlertTriangle :size="16" class="shrink-0 mt-0.5" />
            <span>An LLM provider is required for conversations to work. You can add one now or skip and do it later.</span>
          </div>
        </div>

        <!-- Step 2: Project -->
        <div v-else-if="currentStep === 'project'">
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-5">
            Create your first project. Each project is an isolated AI experience with its own agents, stages, and configuration.
            <a href="/help/administration/projects" target="_blank" class="text-primary-600 hover:underline inline-flex items-center gap-1 ml-1">
              Projects docs <ExternalLink :size="12" />
            </a>
          </p>

          <div v-if="projectError" class="alert-error mb-4 text-sm">{{ projectError }}</div>

          <div class="form-group">
            <label class="form-label">Project Name <span class="required">*</span></label>
            <input
              v-model="projectForm.name"
              type="text"
              class="form-input"
              placeholder="e.g. Customer Support Bot"
              @keydown.enter="submitProject"
            />
          </div>

          <div class="form-group">
            <label class="form-label">Description <span class="text-gray-400 text-xs">(optional)</span></label>
            <textarea
              v-model="projectForm.description"
              rows="3"
              class="form-textarea"
              placeholder="A short description of this project…"
            />
          </div>
        </div>

        <!-- Step 3: Done -->
        <div v-else-if="currentStep === 'done'" class="text-center py-4">
          <div class="flex justify-center mb-4">
            <div class="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <PartyPopper class="text-green-500" :size="32" />
            </div>
          </div>
          <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">You're all set!</h3>
          <p class="text-gray-600 dark:text-gray-400 text-sm mb-6">
            {{ projectCreated ? 'Your providers and first project are ready.' : 'Setup wizard complete.' }}
            Start building your AI experience.
          </p>
          <div class="flex flex-col gap-3 items-center">
            <button
              v-if="projectCreated"
              class="btn-primary inline-flex items-center gap-2"
              @click="navigateAndDismiss('design.stages')"
            >
              Start designing <ArrowRight :size="16" />
            </button>
            <button v-else class="btn-primary inline-flex items-center gap-2" @click="dismiss">
              Go to Dashboard <ArrowRight :size="16" />
            </button>
            <a
              href="/help/guide/getting-started"
              target="_blank"
              class="inline-flex items-center gap-1.5 text-sm text-primary-600 dark:text-primary-400 hover:underline"
            >
              <BookOpen :size="15" />
              Read the Getting Started guide
            </a>
            <a
              v-if="addedProviders.length > 0"
              href="#"
              class="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:underline"
              @click.prevent="navigateAndDismiss('administration.providers')"
            >
              View configured providers
            </a>
          </div>
        </div>

      </div>

      <!-- Footer actions -->
      <div class="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-between gap-3">
        <div>
          <button
            v-if="currentStep === 'providers' || currentStep === 'project'"
            type="button"
            class="text-sm text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            @click="currentStep === 'providers' ? (currentStep = 'project') : (currentStep = 'done')"
          >
            Skip this step
          </button>
        </div>
        <div class="flex items-center gap-2">
          <button
            v-if="currentStep === 'providers'"
            class="btn-primary inline-flex items-center gap-2"
            @click="currentStep = 'project'"
          >
            Continue <ArrowRight :size="16" />
          </button>
          <button
            v-else-if="currentStep === 'project'"
            class="btn-primary inline-flex items-center gap-2"
            :disabled="isCreatingProject"
            @click="submitProject"
          >
            <BriefcaseBusiness :size="16" />
            {{ isCreatingProject ? 'Creating…' : 'Create Project' }}
          </button>
          <button
            v-else-if="currentStep === 'done'"
            class="btn-secondary"
            @click="dismiss"
          >
            Close
          </button>
        </div>
      </div>

    </div>
  </div>
</template>
