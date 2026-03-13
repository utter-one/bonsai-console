import { defineStore } from 'pinia'
import { ref } from 'vue'

export const usePlaygroundStore = defineStore('playground', () => {
  const isConversationActive = ref(false)

  function setConversationActive(active: boolean) {
    isConversationActive.value = active
  }

  return {
    isConversationActive,
    setConversationActive,
  }
})
