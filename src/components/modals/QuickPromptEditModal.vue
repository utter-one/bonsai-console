<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import BaseModal from '@/components/BaseModal.vue'
import FormField from '@/components/FormField.vue'
import TagsEditor from '@/components/TagsEditor.vue'
import ErrorDisplay from '@/components/ErrorDisplay.vue'
import { useQuickPromptsStore } from '@/stores'
import type {
  QuickPromptResponse,
  QuickPromptCategory,
  QuickPromptCreateRequest,
  QuickPromptUpdateRequest,
} from '@/stores/quickPrompts'
import { QUICK_PROMPT_CATEGORIES, QUICK_PROMPT_CATEGORY_LABELS } from '@/stores/quickPrompts'
import { parseApiError } from '@/utils/errors'
import type { ParsedError, ApiErrorDetail } from '@/api/types'

const props = defineProps<{
  modelValue: boolean
  prompt?: QuickPromptResponse | null
  scope: 'global' | 'project'
  projectId: string
  defaultCategoryId?: string
  initialContent?: string
}>()

const emit = defineEmits<{
  close: []
  save: []
}>()

const store = useQuickPromptsStore()
const isEditMode = computed(() => !!props.prompt)
const isSystemPrompt = computed(() => props.prompt?.isSystem ?? false)
const isReadOnly = computed(() => isSystemPrompt.value)

const form = ref({
  name: '',
  description: '',
  categoryId: (props.defaultCategoryId as QuickPromptCategory) || 'summarization',
  content: '',
  tags: [] as string[],
  isPublic: false,
})

const validationError = ref<ParsedError | null>(null)
const isSubmitting = ref(false)

onMounted(() => {
  if (props.prompt) {
    form.value = {
      name: props.prompt.name,
      description: props.prompt.description || '',
      categoryId: props.prompt.categoryId,
      content: props.prompt.content,
      tags: props.prompt.tags || [],
      isPublic: props.prompt.isPublic,
    }
  } else {
    if (props.defaultCategoryId) {
      form.value.categoryId = props.defaultCategoryId as QuickPromptCategory
    }
    if (props.initialContent) {
      form.value.content = props.initialContent
    }
  }
})

async function handleSubmit() {
  validationError.value = null
  isSubmitting.value = true

  const details: ApiErrorDetail[] = []

  if (!form.value.name.trim()) {
    details.push({ path: ['name'], code: 'required', message: 'Name is required' })
  }
  if (!form.value.content.trim()) {
    details.push({ path: ['content'], code: 'required', message: 'Content is required' })
  }

  if (details.length > 0) {
    validationError.value = { message: 'Please fix the validation errors and try again.', details }
    isSubmitting.value = false
    return
  }

  try {
    if (isEditMode.value && props.prompt) {
      const updateData: QuickPromptUpdateRequest = {
        name: form.value.name,
        description: form.value.description || null,
        categoryId: form.value.categoryId,
        content: form.value.content,
        tags: form.value.tags,
        isPublic: form.value.isPublic,
      }

      if (props.scope === 'global') {
        await store.updateGlobal(props.prompt.id, props.prompt.version, updateData)
      } else {
        await store.updateProject(props.projectId, props.prompt.id, props.prompt.version, updateData)
      }
    } else {
      const createData: QuickPromptCreateRequest = {
        name: form.value.name,
        description: form.value.description || null,
        categoryId: form.value.categoryId,
        content: form.value.content,
        tags: form.value.tags,
        isPublic: form.value.isPublic,
      }

      if (props.scope === 'global') {
        await store.createGlobal(createData)
      } else {
        await store.createProject(props.projectId, createData)
      }
    }

    emit('save')
    emit('close')
  } catch (err) {
    validationError.value = parseApiError(err)
  } finally {
    isSubmitting.value = false
  }
}

function handleClose() {
  emit('close')
}
</script>

<template>
  <BaseModal :title="isEditMode ? 'Edit Quick Prompt' : 'Create Quick Prompt'" size="lg" @close="handleClose">
    <div v-if="isReadOnly" class="alert-warning mb-4">
      This is a system prompt and cannot be modified.
    </div>

    <form @submit.prevent="handleSubmit">
      <FormField label="Name" required :error="validationError" path="name" class="w-full" help="A descriptive name for this prompt">
        <input
          v-model="form.name"
          type="text"
          class="form-input"
          placeholder="Quick prompt name"
          :disabled="isSubmitting || isReadOnly"
        />
      </FormField>

      <FormField label="Description" :error="validationError" path="description" class="w-full" help="Optional description of what this prompt does">
        <textarea
          v-model="form.description"
          rows="2"
          class="form-textarea"
          placeholder="Brief description..."
          :disabled="isSubmitting || isReadOnly"
        ></textarea>
      </FormField>

      <FormField label="Category" :error="validationError" path="category" class="w-full" help="Category for organizing prompts">
        <select
          v-model="form.categoryId"
          class="form-select-auto"
          :disabled="isSubmitting || isReadOnly"
        >
          <option v-for="cat in QUICK_PROMPT_CATEGORIES" :key="cat" :value="cat">
            {{ QUICK_PROMPT_CATEGORY_LABELS[cat] }}
          </option>
        </select>
      </FormField>

      <FormField label="Content" required :error="validationError" path="content" class="w-full" help="The prompt content to insert">
        <textarea
          v-model="form.content"
          rows="8"
          class="form-textarea font-mono"
          placeholder="Enter prompt content..."
          :disabled="isSubmitting || isReadOnly"
        ></textarea>
      </FormField>

      <TagsEditor
        v-model="form.tags"
        :disabled="isSubmitting || isReadOnly"
        helpText="Optional tags for organizing prompts"
      />

      <div class="flex items-center gap-2 mb-4">
        <input
          v-model="form.isPublic"
          type="checkbox"
          class="form-checkbox"
          :disabled="isSubmitting || isReadOnly"
          id="quick-prompt-is-public"
        />
        <label for="quick-prompt-is-public" class="checkbox-label text-sm text-gray-700 dark:text-gray-300">
          Make public (visible to all operators in the organization)
        </label>
      </div>

      <ErrorDisplay :error="validationError" />

      <div class="modal-footer">
        <button type="button" @click="handleClose" class="btn-secondary" :disabled="isSubmitting">
          Cancel
        </button>
        <button
          type="submit"
          class="btn-primary"
          :disabled="isSubmitting || isReadOnly"
        >
          {{ isSubmitting ? 'Saving...' : (isEditMode ? 'Save Changes' : 'Create Prompt') }}
        </button>
      </div>
    </form>
  </BaseModal>
</template>
