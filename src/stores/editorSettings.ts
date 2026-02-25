import { ref, watch } from 'vue'
import { defineStore } from 'pinia'

export const useEditorSettingsStore = defineStore('editorSettings', () => {
  const showBlockHighlight = ref(localStorage.getItem('editorBlockHighlight') !== 'false')

  function toggleBlockHighlight() {
    showBlockHighlight.value = !showBlockHighlight.value
  }

  watch(showBlockHighlight, (val) => {
    localStorage.setItem('editorBlockHighlight', val ? 'true' : 'false')
  })

  return {
    showBlockHighlight,
    toggleBlockHighlight,
  }
})
