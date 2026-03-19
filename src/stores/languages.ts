import { defineStore } from 'pinia'
import localeCodes from 'locale-codes'

export interface LanguageOption {
  code: string
  name: string
}

const ALL_LANGUAGES: LanguageOption[] = localeCodes.all
  .map(locale => ({
    code: locale.tag,
    name: locale.location ? `${locale.name} (${locale.location})` : locale.name,
  }))
  .sort((a, b) => a.name.localeCompare(b.name))

const _displayNames = new Intl.DisplayNames(['en'], { type: 'language' })

function resolveDisplayName(code: string): string {
  try {
    return _displayNames.of(code) ?? code
  } catch {
    return code
  }
}

export const useLanguagesStore = defineStore('languages', () => {
  function search(query: string): LanguageOption[] {
    if (!query.trim()) return ALL_LANGUAGES
    const q = query.toLowerCase()
    return ALL_LANGUAGES.filter(
      l => l.name.toLowerCase().includes(q) || l.code.toLowerCase().includes(q),
    )
  }

  function getDisplayName(code: string): string {
    if (!code) return ''
    const found = ALL_LANGUAGES.find(l => l.code === code)
    return found?.name ?? resolveDisplayName(code)
  }

  return { search, getDisplayName }
})
