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
  callTools: Array<{ toolId: string; parameters: Record<string, any> }>
  changeVisibility: {
    enabled: boolean
    visibility: 'always' | 'stage' | 'never' | 'conditional'
    condition: string
  }
  banUser: { enabled: boolean; reason: string }
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
    callTools: [],
    changeVisibility: { enabled: false, visibility: 'always', condition: '' },
    banUser: { enabled: false, reason: '' },
  }
}

export function loadEffectsIntoOperations(effects: Effect[], operations: ActionOperations) {
  // Reset all single-instance effects
  operations.generateResponse.enabled = false
  operations.endConversation.enabled = false
  operations.abortConversation.enabled = false
  operations.goToStage.enabled = false
  operations.modifyUserInput.enabled = false
  operations.modifyVariables.enabled = false
  operations.modifyUserProfile.enabled = false
  operations.callTools = []
  operations.changeVisibility.enabled = false
  operations.banUser.enabled = false

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
        const callToolEntry: { toolId: string; parameters: Record<string, any> } = {
          toolId: 'toolId' in effect ? (effect.toolId || '') : '',
          parameters: 'parameters' in effect ? (effect.parameters || {}) : {},
        }
        operations.callTools.push(callToolEntry)
        break
      case 'change_visibility':
        operations.changeVisibility.enabled = true
        operations.changeVisibility.visibility = effect.visibility || 'always'
        operations.changeVisibility.condition = effect.condition || ''
        break
      case 'ban_user':
        operations.banUser.enabled = true
        operations.banUser.reason = ('reason' in effect ? effect.reason : '') || ''
        break
    }
  })
}

export function buildEffectsFromOperations(operations: ActionOperations): { effects: Effect[]; error: string | null } {
  const effectsArray: Effect[] = []

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

  if (operations.callTools && operations.callTools.length > 0) {
    for (const callTool of operations.callTools) {
      if (!callTool.toolId) continue

      const params: Record<string, any> = {}

      for (const [key, value] of Object.entries(callTool.parameters)) {
        if (value === null || value === undefined || value === '' || (typeof value === 'string' && value.trim() === '')) {
          continue
        }
        params[key] = value
      }

      effectsArray.push({
        type: 'call_tool',
        toolId: callTool.toolId,
        parameters: params
      })
    }
  }

  if (operations.changeVisibility.enabled) {
    const cvEffect: Record<string, any> = {
      type: 'change_visibility',
      visibility: operations.changeVisibility.visibility,
    }
    if (operations.changeVisibility.visibility === 'conditional') {
      cvEffect.condition = operations.changeVisibility.condition
    }
    effectsArray.push(cvEffect as Effect)
  }

  if (operations.banUser.enabled) {
    effectsArray.push({
      type: 'ban_user',
      reason: operations.banUser.reason || undefined
    } as Effect)
  }

  return { effects: effectsArray, error: null }
}
