import type { Effect, ParsedError, ApiErrorDetail } from '@/api/types'

export interface ActionOperations {
  generateResponse: {
    enabled: boolean
    responseMode: 'generated' | 'prescripted'
    prescriptedSelectionStrategy: 'random' | 'round_robin'
    prescriptedResponses: string[]
    priority?: number
  }
  endConversation: { enabled: boolean; reason: string; priority?: number }
  abortConversation: { enabled: boolean; reason: string; priority?: number }
  goToStage: { enabled: boolean; stageId: string; priority?: number }
  modifyUserInput: { enabled: boolean; template: string; priority?: number }
  modifyVariables: {
    enabled: boolean
    modifications: Array<{ variableName?: string; operation: 'set' | 'reset' | 'add' | 'remove'; value?: any }>
    priority?: number
  }
  modifyUserProfile: {
    enabled: boolean
    modifications: Array<{ fieldName?: string; operation: 'set' | 'reset' | 'add' | 'remove'; value?: any }>
    priority?: number
  }
  callTools: Array<{ toolId: string; parameters: Record<string, any>; asynchronous: boolean; priority?: number }>
  changeVisibility: {
    enabled: boolean
    visibility: 'always' | 'stage' | 'never' | 'conditional'
    condition: string
    priority?: number
  }
  banUser: { enabled: boolean; reason: string; priority?: number }
  saveArtifact: { enabled: boolean; data: any; dataEncoding: 'raw' | 'base64'; fileName: string; mimeType: string; variableName: string; priority?: number }
  attachFile: { enabled: boolean; artifactId: string; fileName: string; mimeType: string; priority?: number }
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
    saveArtifact: { enabled: false, data: '', dataEncoding: 'raw', fileName: '', mimeType: '', variableName: '' },
    attachFile: { enabled: false, artifactId: '', fileName: '', mimeType: '' },
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
  operations.saveArtifact.enabled = false
  operations.saveArtifact.data = ''
  operations.saveArtifact.dataEncoding = 'raw'
  operations.saveArtifact.fileName = ''
  operations.saveArtifact.mimeType = ''
  operations.saveArtifact.variableName = ''
  operations.attachFile.enabled = false
  operations.attachFile.artifactId = ''
  operations.attachFile.fileName = ''
  operations.attachFile.mimeType = ''

  // Load existing effects
  effects.forEach(effect => {
    switch (effect.type) {
      case 'generate_response':
        operations.generateResponse.enabled = true
        operations.generateResponse.responseMode = (effect as any).responseMode || 'generated'
        operations.generateResponse.prescriptedSelectionStrategy = (effect as any).prescriptedSelectionStrategy || 'random'
        operations.generateResponse.prescriptedResponses = (effect as any).prescriptedResponses || []
        if ((effect as any).priority !== undefined && (effect as any).priority !== null) operations.generateResponse.priority = (effect as any).priority
        break
      case 'end_conversation':
        operations.endConversation.enabled = true
        operations.endConversation.reason = effect.reason || ''
        if ((effect as any).priority !== undefined && (effect as any).priority !== null) operations.endConversation.priority = (effect as any).priority
        break
      case 'abort_conversation':
        operations.abortConversation.enabled = true
        operations.abortConversation.reason = effect.reason || ''
        if ((effect as any).priority !== undefined && (effect as any).priority !== null) operations.abortConversation.priority = (effect as any).priority
        break
      case 'go_to_stage':
        operations.goToStage.enabled = true
        if ('stageId' in effect) {
          operations.goToStage.stageId = effect.stageId || ''
        }
        if ((effect as any).priority !== undefined && (effect as any).priority !== null) operations.goToStage.priority = (effect as any).priority
        break
      case 'modify_user_input':
        operations.modifyUserInput.enabled = true
        operations.modifyUserInput.template = effect.template || ''
        if ((effect as any).priority !== undefined && (effect as any).priority !== null) operations.modifyUserInput.priority = (effect as any).priority
        break
      case 'modify_variables':
        operations.modifyVariables.enabled = true
        operations.modifyVariables.modifications = effect.modifications || []
        if ((effect as any).priority !== undefined && (effect as any).priority !== null) operations.modifyVariables.priority = (effect as any).priority
        break
      case 'modify_user_profile':
        operations.modifyUserProfile.enabled = true
        operations.modifyUserProfile.modifications = effect.modifications || []
        if ((effect as any).priority !== undefined && (effect as any).priority !== null) operations.modifyUserProfile.priority = (effect as any).priority
        break
      case 'call_tool':
        const callToolEntry: { toolId: string; parameters: Record<string, any>; asynchronous: boolean; priority?: number } = {
          toolId: 'toolId' in effect ? (effect.toolId || '') : '',
          parameters: 'parameters' in effect ? (effect.parameters || {}) : {},
          asynchronous: !!(effect as any).asynchronous,
        }
        if ((effect as any).priority !== undefined && (effect as any).priority !== null) callToolEntry.priority = (effect as any).priority
        operations.callTools.push(callToolEntry)
        break
      case 'change_visibility':
        operations.changeVisibility.enabled = true
        operations.changeVisibility.visibility = effect.visibility || 'always'
        operations.changeVisibility.condition = effect.condition || ''
        if ((effect as any).priority !== undefined && (effect as any).priority !== null) operations.changeVisibility.priority = (effect as any).priority
        break
      case 'ban_user':
        operations.banUser.enabled = true
        operations.banUser.reason = ('reason' in effect ? effect.reason : '') || ''
        if ((effect as any).priority !== undefined && (effect as any).priority !== null) operations.banUser.priority = (effect as any).priority
        break
      case 'save_artifact':
        operations.saveArtifact.enabled = true
        operations.saveArtifact.data = (effect as any).data ?? ''
        operations.saveArtifact.dataEncoding = (effect as any).dataEncoding || 'raw'
        operations.saveArtifact.fileName = (effect as any).fileName || ''
        operations.saveArtifact.mimeType = (effect as any).mimeType || ''
        operations.saveArtifact.variableName = (effect as any).variableName || ''
        if ((effect as any).priority !== undefined && (effect as any).priority !== null) operations.saveArtifact.priority = (effect as any).priority
        break
      case 'attach_file':
        operations.attachFile.enabled = true
        operations.attachFile.artifactId = (effect as any).artifactId || ''
        operations.attachFile.fileName = (effect as any).fileName || ''
        operations.attachFile.mimeType = (effect as any).mimeType || ''
        if ((effect as any).priority !== undefined && (effect as any).priority !== null) operations.attachFile.priority = (effect as any).priority
        break
    }
  })
}

export function buildEffectsFromOperations(operations: ActionOperations): { effects: Effect[]; error: string | null } {
  const effectsArray: Effect[] = []

  const buildCallToolEffect = (callTool: { toolId: string; parameters: Record<string, any>; asynchronous: boolean; priority?: number }) => {
    const params: Record<string, any> = {}
    for (const [key, value] of Object.entries(callTool.parameters)) {
      if (value === null || value === undefined || value === '' || (typeof value === 'string' && value.trim() === '')) {
        continue
      }
      params[key] = value
    }
    const effect: Record<string, any> = {
      type: 'call_tool',
      toolId: callTool.toolId,
      parameters: params,
      asynchronous: callTool.asynchronous,
    }
    if (callTool.priority !== undefined && callTool.priority !== null) effect.priority = callTool.priority
    return effect as Effect
  }

  if (operations.callTools && operations.callTools.length > 0) {
    for (const callTool of operations.callTools) {
      if (!callTool.toolId) continue
      effectsArray.push(buildCallToolEffect(callTool))
    }
  }

  if (operations.modifyVariables.enabled) {
    const mods = operations.modifyVariables.modifications
      .filter(m => m.variableName)
      .map(m => ({
        variableName: m.variableName!,
        operation: m.operation as 'set' | 'reset' | 'add' | 'remove',
        value: m.value
      }))
    const mvEffect: Record<string, any> = {
      type: 'modify_variables',
      modifications: mods
    }
    if (operations.modifyVariables.priority !== undefined && operations.modifyVariables.priority !== null) mvEffect.priority = operations.modifyVariables.priority
    effectsArray.push(mvEffect as Effect)
  }

  if (operations.modifyUserProfile.enabled) {
    const mods = operations.modifyUserProfile.modifications
      .filter(m => m.fieldName)
      .map(m => ({
        fieldName: m.fieldName!,
        operation: m.operation as 'set' | 'reset' | 'add' | 'remove',
        value: m.value
      }))
    const mupEffect: Record<string, any> = {
      type: 'modify_user_profile',
      modifications: mods
    }
    if (operations.modifyUserProfile.priority !== undefined && operations.modifyUserProfile.priority !== null) mupEffect.priority = operations.modifyUserProfile.priority
    effectsArray.push(mupEffect as Effect)
  }

  if (operations.saveArtifact.enabled) {
    const saEffect: Record<string, any> = {
      type: 'save_artifact',
      fileName: operations.saveArtifact.fileName,
      variableName: operations.saveArtifact.variableName,
    }
    if (operations.saveArtifact.data !== undefined && operations.saveArtifact.data !== '') saEffect.data = operations.saveArtifact.data
    if (operations.saveArtifact.mimeType) saEffect.mimeType = operations.saveArtifact.mimeType
    if (operations.saveArtifact.dataEncoding && operations.saveArtifact.dataEncoding !== 'raw') saEffect.dataEncoding = operations.saveArtifact.dataEncoding
    if (operations.saveArtifact.priority !== undefined && operations.saveArtifact.priority !== null) saEffect.priority = operations.saveArtifact.priority
    effectsArray.push(saEffect as Effect)
  }

  if (operations.modifyUserInput.enabled) {
    const miEffect: Record<string, any> = {
      type: 'modify_user_input',
      template: operations.modifyUserInput.template
    }
    if (operations.modifyUserInput.priority !== undefined && operations.modifyUserInput.priority !== null) miEffect.priority = operations.modifyUserInput.priority
    effectsArray.push(miEffect as Effect)
  }

  if (operations.attachFile.enabled) {
    const attachEffect: Record<string, any> = {
      type: 'attach_file',
      artifactId: operations.attachFile.artifactId,
    }
    if (operations.attachFile.fileName) attachEffect.fileName = operations.attachFile.fileName
    if (operations.attachFile.mimeType) attachEffect.mimeType = operations.attachFile.mimeType
    if (operations.attachFile.priority !== undefined && operations.attachFile.priority !== null) attachEffect.priority = operations.attachFile.priority
    effectsArray.push(attachEffect as Effect)
  }

  if (operations.banUser.enabled) {
    const buEffect: Record<string, any> = {
      type: 'ban_user',
      reason: operations.banUser.reason || undefined
    }
    if (operations.banUser.priority !== undefined && operations.banUser.priority !== null) buEffect.priority = operations.banUser.priority
    effectsArray.push(buEffect as Effect)
  }

  if (operations.changeVisibility.enabled) {
    const cvEffect: Record<string, any> = {
      type: 'change_visibility',
      visibility: operations.changeVisibility.visibility,
    }
    if (operations.changeVisibility.visibility === 'conditional') {
      cvEffect.condition = operations.changeVisibility.condition
    }
    if (operations.changeVisibility.priority !== undefined && operations.changeVisibility.priority !== null) cvEffect.priority = operations.changeVisibility.priority
    effectsArray.push(cvEffect as Effect)
  }

  if (operations.generateResponse.enabled) {
    const generateEffect: Record<string, any> = {
      type: 'generate_response',
      responseMode: operations.generateResponse.responseMode,
    }
    if (operations.generateResponse.responseMode === 'prescripted') {
      generateEffect.prescriptedSelectionStrategy = operations.generateResponse.prescriptedSelectionStrategy
      generateEffect.prescriptedResponses = operations.generateResponse.prescriptedResponses.filter(r => r.trim())
    }
    if (operations.generateResponse.priority !== undefined && operations.generateResponse.priority !== null) generateEffect.priority = operations.generateResponse.priority
    effectsArray.push(generateEffect as Effect)
  }

  if (operations.endConversation.enabled) {
    const ecEffect: Record<string, any> = {
      type: 'end_conversation',
      reason: operations.endConversation.reason || undefined
    }
    if (operations.endConversation.priority !== undefined && operations.endConversation.priority !== null) ecEffect.priority = operations.endConversation.priority
    effectsArray.push(ecEffect as Effect)
  }

  if (operations.abortConversation.enabled) {
    const acEffect: Record<string, any> = {
      type: 'abort_conversation',
      reason: operations.abortConversation.reason || undefined
    }
    if (operations.abortConversation.priority !== undefined && operations.abortConversation.priority !== null) acEffect.priority = operations.abortConversation.priority
    effectsArray.push(acEffect as Effect)
  }

  if (operations.goToStage.enabled) {
    const gsEffect: Record<string, any> = {
      type: 'go_to_stage',
      stageId: operations.goToStage.stageId
    }
    if (operations.goToStage.priority !== undefined && operations.goToStage.priority !== null) gsEffect.priority = operations.goToStage.priority
    effectsArray.push(gsEffect as Effect)
  }

  return { effects: effectsArray, error: null }
}

export function validateEffects(operations: ActionOperations): ParsedError | null {
  const details: ApiErrorDetail[] = []

  function getCallToolCount(): number {
    let count = 0
    for (const ct of operations.callTools) {
      if (ct.toolId) count++
    }
    return count
  }

  if (operations.modifyUserInput.enabled) {
    let effectIdx = getCallToolCount()
    if (operations.modifyVariables.enabled) effectIdx++
    if (operations.modifyUserProfile.enabled) effectIdx++
    if (operations.saveArtifact.enabled) effectIdx++
    if (!operations.modifyUserInput.template?.trim()) {
      details.push({ path: ['effects', effectIdx, 'template'], message: 'Template is required.', code: 'required' })
    }
  }

  if (operations.modifyVariables.enabled) {
    const effectIdx = getCallToolCount()
    const mods = operations.modifyVariables.modifications
    if (mods.length === 0) {
      details.push({ path: ['effects', effectIdx], message: 'Add at least one variable modification.', code: 'too_small' })
    } else {
      for (let i = 0; i < mods.length; i++) {
        if (!mods[i]!.variableName?.trim()) {
          details.push({ path: ['effects', effectIdx, 'modifications', i, 'variableName'], message: 'Variable name is required.', code: 'required' })
        }
      }
    }
  }

  if (operations.modifyUserProfile.enabled) {
    let effectIdx = getCallToolCount()
    if (operations.modifyVariables.enabled) effectIdx++
    const mods = operations.modifyUserProfile.modifications
    if (mods.length === 0) {
      details.push({ path: ['effects', effectIdx], message: 'Add at least one profile modification.', code: 'too_small' })
    } else {
      for (let i = 0; i < mods.length; i++) {
        if (!mods[i]!.fieldName?.trim()) {
          details.push({ path: ['effects', effectIdx, 'modifications', i, 'fieldName'], message: 'Field name is required.', code: 'required' })
        }
      }
    }
  }

  if (operations.saveArtifact.enabled) {
    let effectIdx = getCallToolCount()
    if (operations.modifyVariables.enabled) effectIdx++
    if (operations.modifyUserProfile.enabled) effectIdx++
    if (!operations.saveArtifact.fileName?.trim()) {
      details.push({ path: ['effects', effectIdx, 'fileName'], message: 'File name is required.', code: 'required' })
    }
    if (!operations.saveArtifact.variableName?.trim()) {
      details.push({ path: ['effects', effectIdx, 'variableName'], message: 'Variable name is required.', code: 'required' })
    }
  }

  if (operations.attachFile.enabled) {
    let effectIdx = getCallToolCount()
    if (operations.modifyVariables.enabled) effectIdx++
    if (operations.modifyUserProfile.enabled) effectIdx++
    if (operations.saveArtifact.enabled) effectIdx++
    if (operations.modifyUserInput.enabled) effectIdx++
    if (!operations.attachFile.artifactId?.trim()) {
      details.push({ path: ['effects', effectIdx, 'artifactId'], message: 'Artifact ID is required.', code: 'required' })
    }
  }

  if (operations.goToStage.enabled) {
    let effectIdx = getCallToolCount()
    if (operations.modifyVariables.enabled) effectIdx++
    if (operations.modifyUserProfile.enabled) effectIdx++
    if (operations.saveArtifact.enabled) effectIdx++
    if (operations.modifyUserInput.enabled) effectIdx++
    if (operations.attachFile.enabled) effectIdx++
    if (operations.banUser.enabled) effectIdx++
    if (operations.changeVisibility.enabled) effectIdx++
    if (operations.generateResponse.enabled) effectIdx++
    if (operations.endConversation.enabled) effectIdx++
    if (operations.abortConversation.enabled) effectIdx++
    if (!operations.goToStage.stageId) {
      details.push({ path: ['effects', effectIdx, 'stageId'], message: 'Target stage is required.', code: 'required' })
    }
  }

  return details.length > 0 ? { message: 'Please fill in all required fields', details } : null
}
