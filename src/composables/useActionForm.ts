import type { Effect } from '@/api/types'

export interface ActionOperations {
  generateResponse: {
    enabled: boolean
    responseMode: 'generated' | 'prescripted'
    prescriptedSelectionStrategy: 'random' | 'round_robin'
    prescriptedResponses: string[]
  }
  endConversation: { enabled: boolean; reason: string }
  abortConversation: { enabled: boolean; reason: string }
  goToStage: { enabled: boolean; stageId: string }
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
}

export function createDefaultOperations(): ActionOperations {
  return {
    generateResponse: { enabled: true, responseMode: 'generated', prescriptedSelectionStrategy: 'random', prescriptedResponses: [] },
    endConversation: { enabled: false, reason: '' },
    abortConversation: { enabled: false, reason: '' },
    goToStage: { enabled: false, stageId: '' },
    modifyUserInput: { enabled: false, template: '' },
    modifyVariables: { enabled: false, modifications: [] },
    modifyUserProfile: { enabled: false, modifications: [] },
    callTool: { enabled: false, toolId: '', parameters: {} }
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
        operations.generateResponse.responseMode = (effect as any).responseMode || 'generated'
        operations.generateResponse.prescriptedSelectionStrategy = (effect as any).prescriptedSelectionStrategy || 'random'
        operations.generateResponse.prescriptedResponses = (effect as any).prescriptedResponses || []
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
    }
  })
}

export function buildEffectsFromOperations(operations: ActionOperations): { effects: Effect[]; error: string | null } {
  const effectsArray: Effect[] = []
  let error: string | null = null

  if (operations.generateResponse.enabled) {
    const generateEffect: Record<string, any> = {
      type: 'generate_response',
      responseMode: operations.generateResponse.responseMode,
    }
    if (operations.generateResponse.responseMode === 'prescripted') {
      generateEffect.prescriptedSelectionStrategy = operations.generateResponse.prescriptedSelectionStrategy
      generateEffect.prescriptedResponses = operations.generateResponse.prescriptedResponses.filter(r => r.trim())
    }
    effectsArray.push(generateEffect as Effect)
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
    // Build parameters object, accepting all values as-is
    const params: Record<string, any> = {}
    
    for (const [key, value] of Object.entries(operations.callTool.parameters)) {
      // Skip null, undefined, or empty string values
      if (value === null || value === undefined || value === '' || (typeof value === 'string' && value.trim() === '')) {
        continue
      }
      
      // Accept all values as-is without validation or parsing
      params[key] = value
    }

    effectsArray.push({
      type: 'call_tool',
      toolId: operations.callTool.toolId,
      parameters: params
    })
  }

  return { effects: effectsArray, error: null }
}
