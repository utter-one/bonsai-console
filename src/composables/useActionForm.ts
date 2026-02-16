import type { Effect } from '@/api/types'

export interface ActionOperations {
  generateResponse: { enabled: boolean }
  endConversation: { enabled: boolean; reason: string }
  abortConversation: { enabled: boolean; reason: string }
  goToStage: { enabled: boolean; stageId: string }
  runScript: { enabled: boolean; code: string }
  modifyUserInput: { enabled: boolean; template: string }
  modifyVariables: {
    enabled: boolean
    modifications: Array<{ variableName?: string; operation: 'set' | 'reset' | 'add' | 'remove'; value?: any }>
  }
  modifyUserProfile: {
    enabled: boolean
    modifications: Array<{ fieldName?: string; operation: 'set' | 'reset' | 'add' | 'remove'; value?: any }>
  }
  callTool: { enabled: boolean; toolId: string; parameters: Record<string, any> }
  callWebhook: {
    enabled: boolean
    url: string
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
    headers: string
    body: string
    resultKey: string
  }
}

export function createDefaultOperations(): ActionOperations {
  return {
    generateResponse: { enabled: true },
    endConversation: { enabled: false, reason: '' },
    abortConversation: { enabled: false, reason: '' },
    goToStage: { enabled: false, stageId: '' },
    runScript: { enabled: false, code: '' },
    modifyUserInput: { enabled: false, template: '' },
    modifyVariables: { enabled: false, modifications: [] },
    modifyUserProfile: { enabled: false, modifications: [] },
    callTool: { enabled: false, toolId: '', parameters: {} },
    callWebhook: { enabled: false, url: '', method: 'POST', headers: '', body: '', resultKey: '' }
  }
}

export function loadEffectsIntoOperations(effects: Effect[], operations: ActionOperations) {
  // Reset all effects
  Object.keys(operations).forEach(key => {
    operations[key as keyof ActionOperations].enabled = false
  })

  // Load existing effects
  effects.forEach(effect => {
    switch (effect.type) {
      case 'generate_response':
        operations.generateResponse.enabled = true
        break
      case 'end_conversation':
        operations.endConversation.enabled = true
        operations.endConversation.reason = effect.reason || ''
        break
      case 'abort_conversation':
        operations.abortConversation.enabled = true
        operations.abortConversation.reason = effect.reason || ''
        break
      case 'go_to_stage':
        operations.goToStage.enabled = true
        if ('stageId' in effect) {
          operations.goToStage.stageId = effect.stageId || ''
        }
        break
      case 'run_script':
        operations.runScript.enabled = true
        if ('code' in effect) {
          operations.runScript.code = effect.code || ''
        }
        break
      case 'modify_user_input':
        operations.modifyUserInput.enabled = true
        operations.modifyUserInput.template = effect.template || ''
        break
      case 'modify_variables':
        operations.modifyVariables.enabled = true
        operations.modifyVariables.modifications = effect.modifications || []
        break
      case 'modify_user_profile':
        operations.modifyUserProfile.enabled = true
        operations.modifyUserProfile.modifications = effect.modifications || []
        break
      case 'call_tool':
        operations.callTool.enabled = true
        if ('toolId' in effect) {
          operations.callTool.toolId = effect.toolId || ''
        }
        if ('parameters' in effect) {
          operations.callTool.parameters = effect.parameters || {}
        }
        break
      case 'call_webhook':
        operations.callWebhook.enabled = true
        operations.callWebhook.url = effect.url || ''
        operations.callWebhook.method = effect.method || 'POST'
        operations.callWebhook.headers = effect.headers ? JSON.stringify(effect.headers, null, 2) : ''
        operations.callWebhook.body = effect.body ? JSON.stringify(effect.body, null, 2) : ''
        operations.callWebhook.resultKey = effect.resultKey || ''
        break
    }
  })
}

export function buildEffectsFromOperations(operations: ActionOperations): { effects: Effect[]; error: string | null } {
  const effectsArray: Effect[] = []
  let error: string | null = null

  if (operations.generateResponse.enabled) {
    effectsArray.push({
      type: 'generate_response'
    })
  }

  if (operations.endConversation.enabled) {
    effectsArray.push({
      type: 'end_conversation',
      reason: operations.endConversation.reason || undefined
    })
  }

  if (operations.abortConversation.enabled) {
    effectsArray.push({
      type: 'abort_conversation',
      reason: operations.abortConversation.reason || undefined
    })
  }

  if (operations.goToStage.enabled) {
    effectsArray.push({
      type: 'go_to_stage',
      stageId: operations.goToStage.stageId
    })
  }

  if (operations.runScript.enabled) {
    effectsArray.push({
      type: 'run_script',
      code: operations.runScript.code
    })
  }

  if (operations.modifyUserInput.enabled) {
    effectsArray.push({
      type: 'modify_user_input',
      template: operations.modifyUserInput.template
    })
  }

  if (operations.modifyVariables.enabled) {
    const mods = operations.modifyVariables.modifications
      .filter(m => m.variableName)
      .map(m => ({
        variableName: m.variableName!,
        operation: m.operation as 'set' | 'reset' | 'add' | 'remove',
        value: m.value
      }))
    effectsArray.push({
      type: 'modify_variables',
      modifications: mods
    })
  }

  if (operations.modifyUserProfile.enabled) {
    const mods = operations.modifyUserProfile.modifications
      .filter(m => m.fieldName)
      .map(m => ({
        fieldName: m.fieldName!,
        operation: m.operation as 'set' | 'reset' | 'add' | 'remove',
        value: m.value
      }))
    effectsArray.push({
      type: 'modify_user_profile',
      modifications: mods
    })
  }

  if (operations.callTool.enabled) {
    // Validate and prepare parameters
    const params: Record<string, any> = {}
    
    // Build parameters object, handling JSON strings for object types
    for (const [key, value] of Object.entries(operations.callTool.parameters)) {
      // Skip null or undefined values
      if (value === null || value === undefined) {
        continue
      }
      
      // Skip empty strings, but allow empty objects/arrays
      if (value === '' || (typeof value === 'string' && value.trim() === '')) {
        continue
      }
      
      // Handle arrays (for array types like string[], object[], etc.)
      if (Array.isArray(value)) {
        // For arrays, parse any JSON strings within them
        const parsedArray = value.map(item => {
          if (typeof item === 'string' && (item.trim().startsWith('{') || item.trim().startsWith('['))) {
            try {
              return JSON.parse(item)
            } catch (e) {
              error = `Invalid JSON for parameter "${key}" in array item`
              return null
            }
          }
          return item
        })
        
        // Check if any parsing failed
        if (parsedArray.includes(null) && error) {
          return { effects: [], error }
        }
        
        params[key] = parsedArray
      }
      // If it's a string that looks like JSON (object or array), try to parse it
      else if (typeof value === 'string' && (value.trim().startsWith('{') || value.trim().startsWith('['))) {
        try {
          params[key] = JSON.parse(value)
        } catch (e) {
          error = `Invalid JSON for parameter "${key}"`
          return { effects: [], error }
        }
      } else if (typeof value === 'object') {
        // If it's already an object (but not an array), keep it as is
        params[key] = value
      } else {
        // For other types (string, number, boolean), use as is
        params[key] = value
      }
    }

    effectsArray.push({
      type: 'call_tool',
      toolId: operations.callTool.toolId,
      parameters: params
    })
  }

  if (operations.callWebhook.enabled) {
    let headers: Record<string, string> | undefined
    let body: any | undefined

    if (operations.callWebhook.headers) {
      try {
        headers = JSON.parse(operations.callWebhook.headers)
      } catch (e) {
        error = 'Invalid JSON in webhook headers'
        return { effects: [], error }
      }
    }

    if (operations.callWebhook.body) {
      try {
        body = JSON.parse(operations.callWebhook.body)
      } catch (e) {
        error = 'Invalid JSON in webhook body'
        return { effects: [], error }
      }
    }

    effectsArray.push({
      type: 'call_webhook',
      url: operations.callWebhook.url,
      method: operations.callWebhook.method as 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
      headers,
      body,
      resultKey: operations.callWebhook.resultKey
    })
  }

  return { effects: effectsArray, error: null }
}
