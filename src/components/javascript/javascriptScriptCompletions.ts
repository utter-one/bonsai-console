import type { Completion, CompletionContext, CompletionResult } from '@codemirror/autocomplete'
import type { FieldDescriptor } from '@/api/generated/data-contracts'
import {
  bonsaiDefaultGlobalVariables,
  bonsaiDefaultFunctions,
  type GlobalVariable,
  type ToolbarFunction,
} from './bonsaiScriptContext'

export interface CompletionContextData {
  stageVariables?: FieldDescriptor[]
  globalVariables?: GlobalVariable[]
  functionList?: ToolbarFunction[]
  projectConstants?: Record<string, any>
}

function variableCompletions(context: CompletionContext, data: CompletionContextData): CompletionResult | null {
  const word = context.matchBefore(/\w+[\w.]*$/)
  if (!word || (word.from === word.to && !context.explicit)) return null

  const before = word.text
  const options: Completion[] = []

  const globals = data.globalVariables ?? bonsaiDefaultGlobalVariables
  globals.forEach(g => {
    const label = g.path
    if (label.startsWith(before)) {
      options.push({ label, type: 'variable', info: g.detail } as Completion)
    }
  })

  // Project constants: expand consts.KEY
  if (data.projectConstants && Object.keys(data.projectConstants).length > 0 && before.startsWith('consts')) {
    const parts = before.split('.')
    if (parts.length === 1) {
      options.push({ label: 'consts', type: 'variable', info: 'Project constants (object)' } as Completion)
      for (const key of Object.keys(data.projectConstants)) {
        options.push({ label: `consts.${key}`, type: 'variable', info: `Project constant` } as Completion)
      }
    } else {
      const keyPrefix = parts[parts.length - 1] || ''
      for (const key of Object.keys(data.projectConstants)) {
        if (key.startsWith(keyPrefix)) {
          options.push({ label: `consts.${key}`, type: 'variable', info: `Project constant` } as Completion)
        }
      }
    }
  }

  // Stage variables: expand vars.x (and nested vars.x.y if objectSchema present)
  if (data.stageVariables && before.startsWith('vars')) {
    const parts = before.split('.')
    if (parts.length === 1) {
      data.stageVariables.forEach(v => {
        options.push({ label: `vars.${v.name}`, type: 'variable', info: `Stage variable (${v.type})` })
      })
    } else {
      const prefix = parts.slice(1, -1).join('.')
      const last = parts[parts.length - 1] || ''
      data.stageVariables.forEach(v => {
        if (v.name === prefix && v.objectSchema) {
          v.objectSchema.forEach(child => {
            if (child.name.startsWith(last)) {
              options.push({
                label: `vars.${prefix}.${child.name}`,
                type: 'variable',
                info: `Stage variable (${child.type})`,
              })
            }
          })
        }
      })
    }
  }

  const funcs = data.functionList ?? bonsaiDefaultFunctions
  funcs.forEach(f => {
    if (f.label.startsWith(before)) {
      options.push({ label: f.label, type: 'function', info: f.info } as Completion)
    }
  })

  if (options.length) {
    return { from: word.from, options }
  }
  return null
}

export function createJavaScriptCompletionSource(data: CompletionContextData = {}) {
  return (context: CompletionContext) => variableCompletions(context, data)
}
