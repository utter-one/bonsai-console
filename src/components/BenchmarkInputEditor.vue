<script setup lang="ts">
import { watch, computed } from 'vue'
import { Plus, Trash2 } from 'lucide-vue-next'
import FileFormField from '@/components/FileFormField.vue'

const props = defineProps<{
  modelValue: Record<string, any>
  inputType: 'messages' | 'text' | 'audio'
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: Record<string, any>]
}>()

const audioFile = computed({
  get: () => props.modelValue.audioBase64
    ? { base64: props.modelValue.audioBase64, mimeType: props.modelValue.mimeType ?? '', fileName: props.modelValue.fileName ?? 'unknown' }
    : null,
  set: (val) => {
    if (val) {
      emit('update:modelValue', { audioBase64: val.base64, mimeType: val.mimeType, fileName: val.fileName })
    } else {
      emit('update:modelValue', { audioBase64: '', mimeType: '', fileName: '' })
    }
  },
})

const allMessages = computed(
  () => (props.modelValue.messages ?? []) as { role: string; content: string }[]
)

const systemContent = computed({
  get: () => {
    const first = allMessages.value[0]
    return first?.role === 'system' ? first.content : ''
  },
  set: (val: string) => {
    const rest = allMessages.value.filter(m => m.role !== 'system')
    emit('update:modelValue', { messages: [{ role: 'system', content: val }, ...rest] })
  },
})

const conversationMessages = computed(
  () => allMessages.value.filter(m => m.role !== 'system')
)

function emitWithConversation(conv: { role: string; content: string }[]) {
  emit('update:modelValue', {
    messages: [{ role: 'system', content: systemContent.value }, ...conv],
  })
}

const textContent = computed({
  get: () => (props.modelValue.text ?? '') as string,
  set: (val) => emit('update:modelValue', { text: val }),
})

function addMessage() {
  emitWithConversation([...conversationMessages.value, { role: 'user', content: '' }])
}

function removeMessage(index: number) {
  const updated = [...conversationMessages.value]
  updated.splice(index, 1)
  emitWithConversation(updated)
}

function updateMessageRole(index: number, role: string) {
  const updated = conversationMessages.value.map((m, i) => (i === index ? { ...m, role } : m))
  emitWithConversation(updated)
}

function updateMessageContent(index: number, content: string) {
  const updated = conversationMessages.value.map((m, i) => (i === index ? { ...m, content } : m))
  emitWithConversation(updated)
}

watch(() => props.inputType, () => {
  if (props.inputType === 'audio') {
    emit('update:modelValue', { audioBase64: '', mimeType: '', fileName: '' })
  }
})
</script>

<template>
  <!-- Messages mode -->
  <div v-if="inputType === 'messages'" class="flex flex-col gap-2">
    <!-- System message (fixed, always first) -->
    <div class="flex flex-row gap-2 items-start p-3 bg-gray-50 dark:bg-gray-900 rounded-md border border-gray-200 dark:border-gray-700">
      <span class="text-xs font-semibold text-gray-500 dark:text-gray-400 pt-2 w-18 shrink-0">system</span>
      <textarea
        :value="systemContent"
        :disabled="disabled"
        rows="2"
        placeholder="System prompt..."
        class="form-textarea flex-1 text-sm"
        @input="systemContent = ($event.target as HTMLTextAreaElement).value"
      />
    </div>

    <!-- Conversation messages -->
    <div
      v-for="(msg, index) in conversationMessages"
      :key="index"
      class="flex flex-row gap-2 items-start p-3 bg-gray-50 dark:bg-gray-900 rounded-md border border-gray-200 dark:border-gray-700"
    >
      <div>
        <select
          :value="msg.role"
          :disabled="disabled"
          class="form-select text-sm"
          @change="updateMessageRole(index, ($event.target as HTMLSelectElement).value)"
        >
          <option value="user">user</option>
          <option value="assistant">assistant</option>
        </select>
      </div>

      <textarea
        :value="msg.content"
        :disabled="disabled"
        rows="2"
        placeholder="Message content..."
        class="form-textarea flex-1 text-sm"
        @input="updateMessageContent(index, ($event.target as HTMLTextAreaElement).value)"
      />
      <button
        type="button"
        :disabled="disabled"
        class="btn-icon text-red-500 hover:text-red-700 shrink-0 mt-0.5"
        @click="removeMessage(index)"
      >
        <Trash2 class="w-4 h-4" />
      </button>
    </div>
    <button
      type="button"
      :disabled="disabled"
      class="btn-secondary self-start"
      @click="addMessage"
    >
      <Plus class="w-4 h-4 mr-1 inline-block" />
      Add Message
    </button>
  </div>

  <!-- Text mode -->
  <div v-else-if="inputType === 'text'">
    <textarea
      :value="textContent"
      :disabled="disabled"
      rows="4"
      placeholder="Enter the text to synthesize..."
      class="form-textarea w-full"
      @input="textContent = ($event.target as HTMLTextAreaElement).value"
    />
  </div>

  <!-- Audio mode -->
  <div v-else-if="inputType === 'audio'">
    <FileFormField
      v-model="audioFile"
      accept="audio/*"
      :disabled="disabled"
      placeholder="No audio file selected"
    />
  </div>
</template>
