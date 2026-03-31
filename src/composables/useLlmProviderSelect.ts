import type { LlmSettings } from '@/api/types'

export function useLlmProviderSelect(
  getProviderId: () => string,
  setProviderId: (v: string) => void,
  getSettings: () => LlmSettings | null,
  setSettings: (v: LlmSettings | null) => void
) {
  function handleProviderChange(event: Event) {
    const newProviderId = (event.target as HTMLSelectElement).value

    if (!newProviderId) {
      setProviderId('')
      setSettings(null)
      return
    }

    if (getSettings() && newProviderId !== getProviderId()) {
      const confirmed = window.confirm(
        'Changing the LLM provider will reset the current LLM settings. Do you want to continue?'
      )
      if (!confirmed) return
      setSettings(null)
    }

    setProviderId(newProviderId)
  }

  return { handleProviderChange }
}
