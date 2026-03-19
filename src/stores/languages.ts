import { defineStore } from 'pinia'
import availableLocales from 'cldr-core/availableLocales.json'

/**
 * Expand a bare 2-letter language code (e.g. "pl") to its most-likely regional
 * form (e.g. "pl-PL") using Unicode's likely-subtags algorithm via Intl.Locale.maximize().
 * 3-letter codes (minority / extinct languages) and codes that already carry any
 * subtag (region, script, …) are returned unchanged — maximize() gives unreliable
 * regional assignments for those.
 */
function expandToRegional(code: string): string {
  if (code.includes('-')) return code       // already has a subtag
  if (code.length !== 2) return code        // 3-letter or special — skip
  try {
    const locale = new Intl.Locale(code).maximize()
    if (locale.region) return `${locale.language}-${locale.region}`
  } catch {
    // unrecognised code — keep as-is
  }
  return code
}

/**
 * Full list of BCP 47 language tags sourced from Unicode CLDR (cldr-core package),
 * with bare language codes expanded to their most-likely xx-YY regional form so
 * that ASR/TTS systems that require a region subtag work out of the box.
 * Display names are resolved via the browser's Intl.DisplayNames API (always in English).
 */
const LANGUAGE_CODES: readonly string[] = [
  ...new Set(availableLocales.availableLocales.full.map(expandToRegional)),
]

export interface LanguageOption {
  code: string
  name: string
}

// Resolve display names once at module load time using the browser Intl API
const _displayNames = new Intl.DisplayNames(['en'], { type: 'language' })

function resolveDisplayName(code: string): string {
  try {
    return _displayNames.of(code) ?? code
  } catch {
    return code
  }
}

const ALL_LANGUAGES: LanguageOption[] = LANGUAGE_CODES.map(code => ({
  code,
  name: resolveDisplayName(code),
})).sort((a, b) => a.name.localeCompare(b.name))

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
