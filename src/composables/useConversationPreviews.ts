import { ref } from 'vue'
import { useIssuesStore } from '@/stores'
import type { CreateIssueRequest, UpdateIssueRequest, ParsedError } from '@/api/types'
import { parseApiError } from '@/utils/errors'

export interface BugReportPrefill {
  projectId?: string
  sessionId?: string
  eventIndex?: number
  stageId?: string
}

export function useConversationPreviews() {
  const issuesStore = useIssuesStore()

  const showPromptPreviewModal = ref(false)
  const selectedPrompt = ref('')

  const showFillerPromptPreviewModal = ref(false)
  const selectedFillerPrompt = ref('')

  const showRawResponsePreviewModal = ref(false)
  const selectedRawResponse = ref('')

  const showVariablesPreviewModal = ref(false)
  const selectedVariables = ref<Record<string, any>>({})

  const showBugReportModal = ref(false)
  const bugReportPrefillData = ref<BugReportPrefill | undefined>(undefined)
  const bugReportError = ref<ParsedError | null>(null)

  function openPromptPreview(prompt: string) {
    selectedPrompt.value = prompt
    showPromptPreviewModal.value = true
  }

  function openFillerPromptPreview(prompt: string) {
    selectedFillerPrompt.value = prompt
    showFillerPromptPreviewModal.value = true
  }

  function openRawResponsePreview(rawResponse: string) {
    selectedRawResponse.value = rawResponse
    showRawResponsePreviewModal.value = true
  }

  function openVariablesPreview(variables: Record<string, any>) {
    selectedVariables.value = variables
    showVariablesPreviewModal.value = true
  }

  function openBugReport(prefill: BugReportPrefill) {
    bugReportPrefillData.value = prefill
    bugReportError.value = null
    showBugReportModal.value = true
  }

  function closeBugReportModal() {
    showBugReportModal.value = false
    bugReportPrefillData.value = undefined
  }

  async function handleBugReportSave(data: CreateIssueRequest | UpdateIssueRequest) {
    try {
      await issuesStore.create(data as CreateIssueRequest)
      closeBugReportModal()
    } catch (err) {
      bugReportError.value = parseApiError(err)
    }
  }

  return {
    showPromptPreviewModal,
    selectedPrompt,
    showFillerPromptPreviewModal,
    selectedFillerPrompt,
    showRawResponsePreviewModal,
    selectedRawResponse,
    showVariablesPreviewModal,
    selectedVariables,
    showBugReportModal,
    bugReportPrefillData,
    bugReportError,
    openPromptPreview,
    openFillerPromptPreview,
    openRawResponsePreview,
    openVariablesPreview,
    openBugReport,
    closeBugReportModal,
    handleBugReportSave,
  }
}
