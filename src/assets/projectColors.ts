export interface ProjectColor {
  key: string
  hex: string
  shade: number
}

export interface ProjectColorFamily {
  name: string
  colors: ProjectColor[]
}

export const PROJECT_COLOR_FAMILIES: ProjectColorFamily[] = [
  { name: 'Red',     colors: [{ key: 'red-300',     hex: '#fca5a5', shade: 300 }, { key: 'red-600',     hex: '#dc2626', shade: 600 }, { key: 'red-900',     hex: '#7f1d1d', shade: 900 }] },
  { name: 'Orange',  colors: [{ key: 'orange-300',  hex: '#fdba74', shade: 300 }, { key: 'orange-600',  hex: '#ea580c', shade: 600 }, { key: 'orange-900',  hex: '#7c2d12', shade: 900 }] },
  { name: 'Amber',   colors: [{ key: 'amber-300',   hex: '#fcd34d', shade: 300 }, { key: 'amber-600',   hex: '#d97706', shade: 600 }, { key: 'amber-900',   hex: '#78350f', shade: 900 }] },
  { name: 'Yellow',  colors: [{ key: 'yellow-300',  hex: '#fde047', shade: 300 }, { key: 'yellow-600',  hex: '#ca8a04', shade: 600 }, { key: 'yellow-900',  hex: '#713f12', shade: 900 }] },
  { name: 'Lime',    colors: [{ key: 'lime-300',    hex: '#bef264', shade: 300 }, { key: 'lime-600',    hex: '#65a30d', shade: 600 }, { key: 'lime-900',    hex: '#365314', shade: 900 }] },
  { name: 'Green',   colors: [{ key: 'green-300',   hex: '#86efac', shade: 300 }, { key: 'green-600',   hex: '#16a34a', shade: 600 }, { key: 'green-900',   hex: '#14532d', shade: 900 }] },
  { name: 'Emerald', colors: [{ key: 'emerald-300', hex: '#6ee7b7', shade: 300 }, { key: 'emerald-600', hex: '#059669', shade: 600 }, { key: 'emerald-900', hex: '#064e3b', shade: 900 }] },
  { name: 'Teal',    colors: [{ key: 'teal-300',    hex: '#5eead4', shade: 300 }, { key: 'teal-600',    hex: '#0d9488', shade: 600 }, { key: 'teal-900',    hex: '#134e4a', shade: 900 }] },
  { name: 'Cyan',    colors: [{ key: 'cyan-300',    hex: '#67e8f9', shade: 300 }, { key: 'cyan-600',    hex: '#0891b2', shade: 600 }, { key: 'cyan-900',    hex: '#164e63', shade: 900 }] },
  { name: 'Sky',     colors: [{ key: 'sky-300',     hex: '#7dd3fc', shade: 300 }, { key: 'sky-600',     hex: '#0284c7', shade: 600 }, { key: 'sky-900',     hex: '#0c4a6e', shade: 900 }] },
  { name: 'Blue',    colors: [{ key: 'blue-300',    hex: '#93c5fd', shade: 300 }, { key: 'blue-600',    hex: '#2563eb', shade: 600 }, { key: 'blue-900',    hex: '#1e3a8a', shade: 900 }] },
  { name: 'Indigo',  colors: [{ key: 'indigo-300',  hex: '#a5b4fc', shade: 300 }, { key: 'indigo-600',  hex: '#4f46e5', shade: 600 }, { key: 'indigo-900',  hex: '#312e81', shade: 900 }] },
  { name: 'Violet',  colors: [{ key: 'violet-300',  hex: '#c4b5fd', shade: 300 }, { key: 'violet-600',  hex: '#7c3aed', shade: 600 }, { key: 'violet-900',  hex: '#4c1d95', shade: 900 }] },
  { name: 'Purple',  colors: [{ key: 'purple-300',  hex: '#d8b4fe', shade: 300 }, { key: 'purple-600',  hex: '#9333ea', shade: 600 }, { key: 'purple-900',  hex: '#581c87', shade: 900 }] },
  { name: 'Fuchsia', colors: [{ key: 'fuchsia-300', hex: '#f0abfc', shade: 300 }, { key: 'fuchsia-600', hex: '#c026d3', shade: 600 }, { key: 'fuchsia-900', hex: '#701a75', shade: 900 }] },
  { name: 'Pink',    colors: [{ key: 'pink-300',    hex: '#f9a8d4', shade: 300 }, { key: 'pink-600',    hex: '#db2777', shade: 600 }, { key: 'pink-900',    hex: '#831843', shade: 900 }] },
  { name: 'Rose',    colors: [{ key: 'rose-300',    hex: '#fda4af', shade: 300 }, { key: 'rose-600',    hex: '#e11d48', shade: 600 }, { key: 'rose-900',    hex: '#881337', shade: 900 }] },
]

const COLOR_MAP = new Map<string, string>()
PROJECT_COLOR_FAMILIES.forEach(family => {
  family.colors.forEach(color => COLOR_MAP.set(color.key, color.hex))
})

export function getProjectColorHex(key: string | null | undefined): string | null {
  if (!key) return null
  return COLOR_MAP.get(key) ?? null
}

export function isLightProjectColor(key: string | null | undefined): boolean {
  if (!key) return true
  const shade = parseInt(key.split('-')[1] ?? '0', 10)
  return shade < 500
}
