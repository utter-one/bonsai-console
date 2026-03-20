<template>
  <!-- No Project Selected State -->
  <NoProjectSelected
    v-if="!hasProject"
    description="Please select a project from the dropdown in the top navigation bar to use the Playground."
  />

  <!-- No Active API Keys State -->
  <div v-else-if="hasProject && !apiKeysLoading && activeApiKeys.length === 0"
    class="flex items-center justify-center bg-gray-50 dark:bg-gray-900 h-[calc(100vh-7rem)] overflow-hidden">
    <div class="text-center max-w-md">
      <AlertCircle class="mx-auto mb-4 text-gray-400 dark:text-gray-500" :size="64" />
      <h2 class="text-2xl font-semibold text-gray-900 mb-2 dark:text-white">No Active API Keys</h2>
      <p class="text-gray-600 mb-6 dark:text-gray-400">
        This project doesn't have any active API keys. Please create an API key to use the Playground.
      </p>
      <button @click="goToApiKeys"
        class="px-5 py-2.5 border-none bg-primary-500 text-white rounded-md font-medium cursor-pointer transition-colors hover:bg-primary-600">
        Manage API Keys
      </button>
    </div>
  </div>

  <!-- Main Playground UI -->
  <div v-else-if="hasProject && (apiKeysLoading || activeApiKeys.length > 0)"
    class="flex flex-col bg-gray-50 dark:bg-gray-900 overflow-hidden h-[calc(100vh-7rem)]">
    <!-- Header -->
    <div class="flex-shrink-0">
      <div class="flex md:flex-row flex-col md:items-center justify-between">
        <div>
          <div class="flex items-center">
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Playground</h1>
            <div class="ml-2 w-3 h-3 rounded-full"
              :class="wsIsConnected ? 'bg-green-500' : 'bg-gray-400 dark:bg-gray-600'"></div>
            <div class="text-gray-900 text-sm dark:text-gray-500 ml-2">{{ wsIsConnected ? 'Connected' : 'Disconnected' }}</div>
          </div>
          <p class="text-sm text-gray-600 mt-1 dark:text-gray-400">Test and debug conversation flows in real-time</p>
        </div>

        <!-- Controls -->
        <div class="flex flex-row items-center gap-2 w-full md:w-auto mt-3 md:mt-0">
          <!-- Settings Dropdown (API Key + Timezone) -->
          <div class="relative inline-flex">
            <button class="btn-secondary flex items-center gap-2"
              @click="showSettingsMenu = !showSettingsMenu"
              :disabled="wsIsConnected || apiKeysLoading"
              title="Connection settings">
              <Settings :size="18" />
              <ChevronDown :size="14" class="text-gray-500" />
            </button>

            <div v-if="showSettingsMenu"
              class="absolute top-full mt-1 right-0 z-20 bg-white border border-gray-200 rounded-lg shadow-lg w-64 p-3 space-y-3 dark:bg-gray-800 dark:border-gray-700"
              @click.stop>
              <!-- API Key -->
              <div>
                <div class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                  <Key :size="12" />API Key
                </div>
                <select v-model="selectedApiKeyId" class="form-select w-full text-sm" :disabled="wsIsConnected || apiKeysLoading">
                  <option :value="null">Select API Key...</option>
                  <option v-for="key in activeApiKeys" :key="key.id" :value="key.id">{{ key.name }}</option>
                </select>
              </div>
              <!-- Timezone -->
              <div>
                <div class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
                  Timezone
                </div>
                <TimezoneSelector
                  v-model="selectedTimezone"
                  placeholder="Project Default"
                  :show-icon="true"
                  :disabled="wsIsConnected"
                  :width="'full'"
                />
              </div>
            </div>
          </div>

          <div class="h-8 border-l border-gray-300 dark:border-gray-600 hidden md:block"></div>

          <!-- Conversation Controls -->
          <div v-if="!isConversationActive" class="relative inline-flex">
            <!-- Main Action Button -->
            <button class="btn-primary-hardright flex items-center gap-2 whitespace-nowrap rounded-r-none"
              @click="startConversation" :disabled="!canStartConversation">
              <Play :size="18" />
              <span class="hidden md:inline">{{ isConversationStarting ? 'Starting...' : 'Start Conversation' }}</span>
            </button>

            <!-- Dropdown Toggle -->
            <button @click="showPresetMenu = !showPresetMenu" class="btn-primary-hardleft border-primary-600"
              :disabled="!canStartConversation"
              :title="`Current mode: ${conversationPresets.find(p => p.id === selectedConversationMode)?.name || 'Unknown'}`">
              <ChevronDown :size="18" />
            </button>

            <!-- Dropdown Menu -->
            <div v-if="showPresetMenu"
              class="absolute top-full mt-1 left-0 z-10 bg-white border border-gray-200 rounded-md shadow-lg min-w-[280px] py-1 dark:bg-gray-800 dark:border-gray-700"
              @click.stop>
              <button v-for="{ preset, disabled, reason } in availablePresets" :key="preset.id"
                @click="handlePresetSelect(preset.id)" :disabled="disabled"
                class="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed relative"
                :class="{ 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400': preset.id === selectedConversationMode }">
                <div class="flex items-start justify-between gap-2">
                  <div class="flex-1">
                    <div class="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      {{ preset.name }}
                      <span v-if="preset.id === selectedConversationMode"
                        class="text-primary-600 dark:text-primary-400 text-xs">(Active)</span>
                    </div>
                    <div class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{{ preset.description }}</div>
                    <div v-if="disabled && reason" class="text-xs text-red-600 dark:text-red-400 mt-1">{{ reason }}</div>
                  </div>
                </div>
              </button>
            </div>
          </div>
          <button v-else class="btn-danger flex items-center gap-2 whitespace-nowrap" @click="endConversation"
            :disabled="!canEndConversation">
            <Square :size="18" />
            <span class="hidden md:inline">{{ isConversationEnding ? 'Ending...' : 'End Conversation' }}</span>
          </button>

          <div class="h-8 border-l border-gray-300 dark:border-gray-600 hidden md:block"></div>

          <!-- Advanced Controls -->
          <button class="btn-secondary btn-small-padding flex items-center gap-2 whitespace-nowrap" :disabled="!canRunAction"
            @click="showRunActionDialog = true">
            <Zap :size="18" />
            <span class="hidden md:inline">Run Action</span>
          </button>

          <button class="btn-secondary btn-small-padding flex items-center gap-2 whitespace-nowrap" :disabled="!canJumpToStage"
            @click="showJumpToStageDialog = true">
            <SkipForward :size="18" />
            <span class="hidden md:inline">Jump to Stage</span>
          </button>

          <button class="btn-secondary btn-small-padding flex items-center gap-2 whitespace-nowrap" :disabled="!canCallTool"
            @click="showCallToolDialog = true">
            <Wrench :size="18" />
            <span class="hidden md:inline">Call Tool</span>
          </button>

          <button class="btn-secondary btn-small-padding flex items-center gap-2 whitespace-nowrap" :disabled="!canSetVariable"
            @click="showSetVariableDialog = true">
            <Braces :size="18" />
            <span class="hidden md:inline">Set Variable</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Main Content Area -->
    <div class="flex-1 flex flex-col min-h-0 pt-4 gap-4 overflow-hidden pb-15 md:pb-0">
      <!-- History Panel (Main Area) -->
      <div
        class="flex-1 min-h-0 bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden flex flex-col dark:bg-gray-800 dark:border-gray-700">
        <div
          class="bg-gray-50 border-b border-gray-200 px-4 py-3 md:flex items-center justify-between dark:bg-gray-700/50 dark:border-gray-700">
          <span class="text-md font-semibold text-gray-700 dark:text-gray-200">Conversation History</span>
          <div class="flex items-center md:gap-4 mt-2 md:mt-0">
            <label class="flex items-center  md:gap-2 text-xs text-gray-600 cursor-pointer dark:text-gray-400">
              <input type="checkbox" v-model="showConversationEvents" class="form-checkbox" />
              <span>Show conversation events</span>
            </label>
          </div>
        </div>
        <div ref="historyContainer" class="flex-1 overflow-y-auto p-4">
          <!-- No conversation state -->
          <div v-if="conversationEvents.length === 0"
            class="flex items-center justify-center h-full text-gray-400 dark:text-gray-500">
            <div class="text-center">
              <p class="text-lg font-medium">No active conversation</p>
              <p class="text-sm mt-1">Start a conversation to see events appear here</p>
            </div>
          </div>

          <!-- Conversation events -->
          <div v-else class="space-y-3">
            <div v-for="(event, index) in filteredConversationEvents" :key="index">
              <!-- Regular User/AI/System/Error events -->
              <div v-if="event.type !== 'ConversationEvent'" class="p-3 rounded-lg border" :class="{
                'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800': event.type === 'User',
                'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800': event.type === 'AI',
                'bg-gray-50 border-gray-200 dark:bg-gray-700/50 dark:border-gray-600 ml-8': event.type === 'System',
                'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800': event.type === 'Error'
              }">
                <div class="flex items-start gap-3">
                  <div class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center" :class="{
                    'bg-blue-500 text-white': event.type === 'User',
                    'bg-green-500 text-white': event.type === 'AI',
                    'bg-gray-500 text-white': event.type === 'System',
                    'bg-red-500 text-white': event.type === 'Error'
                  }">
                    <User v-if="event.type === 'User'" :size="16" />
                    <Bot v-else-if="event.type === 'AI'" :size="16" />
                    <AlertCircle v-else-if="event.type === 'Error'" :size="16" />
                    <Info v-else :size="16" />
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center justify-between gap-2 mb-1">
                      <div class="flex items-center gap-2">
                        <span class="font-semibold text-sm">{{ event.type }}</span>
                        <span class="text-xs text-gray-500">{{ formatTime(event.timestamp) }}</span>
                      </div>
                      <div class="flex items-center gap-1">
                        <button
                          v-if="event.wsEvent && isMessageEvent(event.wsEvent) && hasSystemPrompt(event.wsEvent.eventData.metadata)"
                          @click="openPromptPreview(event.wsEvent.eventData.metadata!.systemPrompt as string)"
                          class="btn-icon p-1"
                          :class="{
                            'hover:bg-blue-100 dark:hover:bg-blue-900/30': event.type === 'User',
                            'hover:bg-green-100 dark:hover:bg-green-900/30': event.type === 'AI'
                          }"
                          title="View system prompt">
                          <FileText class="w-4 h-4" />
                        </button>
                        <button
                          v-if="event.wsEvent && isMessageEvent(event.wsEvent) && hasFillerPrompt(event.wsEvent.eventData.metadata)"
                          @click="openFillerPromptPreview(event.wsEvent.eventData.metadata!.fillerPrompt as string)"
                          class="btn-icon p-1"
                          :class="{
                            'hover:bg-blue-100 dark:hover:bg-blue-900/30': event.type === 'User',
                            'hover:bg-green-100 dark:hover:bg-green-900/30': event.type === 'AI'
                          }"
                          title="View filler prompt">
                          <Wand2 class="w-4 h-4" />
                        </button>
                        <button
                          v-if="event.wsEvent && isMessageEvent(event.wsEvent) && hasCurrentVariables(event.wsEvent.eventData.metadata)"
                          @click="openVariablesPreview(event.wsEvent.eventData.metadata!.currentVariables as Record<string, any>)"
                          class="btn-icon p-1"
                          :class="{
                            'hover:bg-blue-100 dark:hover:bg-blue-900/30': event.type === 'User',
                            'hover:bg-green-100 dark:hover:bg-green-900/30': event.type === 'AI'
                          }"
                          title="View stage variables">
                          <Braces class="w-4 h-4" />
                        </button>
                        <button
                          @click="openBugReport(event)"
                          class="btn-icon p-1"
                          :class="{
                            'hover:bg-blue-100 dark:hover:bg-blue-900/30': event.type === 'User',
                            'hover:bg-green-100 dark:hover:bg-green-900/30': event.type === 'AI',
                            'hover:bg-gray-100 dark:hover:bg-gray-900/30': event.type === 'System',
                            'hover:bg-red-100 dark:hover:bg-red-900/30': event.type === 'Error'
                          }"
                          title="Report bug">
                          <Bug class="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div class="text-sm">
                      <!-- Voice message with audio player -->
                      <template v-if="event.voiceOutputId">
                        <AudioPlayer v-if="getVoiceOutput(event.voiceOutputId)"
                          :state="getVoiceOutput(event.voiceOutputId)!.player.state"
                          :is-ready="getVoiceOutput(event.voiceOutputId)!.player.isReady"
                          :progress="getVoiceOutput(event.voiceOutputId)!.player.progress"
                          :transcript="getVoiceOutput(event.voiceOutputId)!.transcript || event.message || undefined"
                          @play="getVoiceOutput(event.voiceOutputId)!.player.play()"
                          @pause="getVoiceOutput(event.voiceOutputId)!.player.pause()"
                          @stop="getVoiceOutput(event.voiceOutputId)!.player.stop()"
                          @volume-change="(v) => { if (event.voiceOutputId) getVoiceOutput(event.voiceOutputId)?.player.setVolume(v) }" />
                        <!-- Show real-time text below audio player if transcription is in progress -->
                        <div v-if="event.isRealTime && event.message" class="mt-2 text-sm text-gray-700">
                          <span class="whitespace-pre-wrap">{{ event.message }}</span>
                          <span class="inline-block ml-1 w-2 h-2 bg-green-500 rounded-full animate-pulse"
                            title="Real-time transcription in progress"></span>
                        </div>
                      </template>

                      <!-- Regular text message -->
                      <template v-else>
                        <div class="relative">
                          <p v-if="event.message" class="whitespace-pre-wrap dark:text-gray-200">{{ event.message }}</p>
                          <!-- Real-time indicator -->
                          <span v-if="event.isRealTime"
                            class="inline-block ml-1 w-2 h-2 bg-current rounded-full animate-pulse" :class="{
                              'text-blue-500': event.type === 'User',
                              'text-green-500': event.type === 'AI'
                            }" title="Real-time transcription in progress"></span>
                        </div>
                        <div v-if="event.details" class="mt-2 text-xs text-gray-600 font-mono dark:text-gray-400">
                          {{ event.details }}
                        </div>
                      </template>
                    </div>
                    <div v-if="event.type === 'User' && event.wsEvent?.eventData?.metadata && (event.wsEvent.eventData.metadata.moderationDurationMs != null || event.wsEvent.eventData.metadata.processingDurationMs != null || event.wsEvent.eventData.metadata.actionsDurationMs != null || event.wsEvent.eventData.metadata.fillerDurationMs != null)"
                      class="mt-2 pt-2 border-t border-blue-200 flex flex-wrap gap-1.5 dark:border-blue-900">
                      <span v-if="event.wsEvent.eventData.metadata.moderationDurationMs != null" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-blue-100 border border-blue-300 dark:bg-blue-900/50 dark:border-blue-700"><span class="text-blue-600 dark:text-blue-400">Moderation</span><span class="font-mono font-semibold text-blue-900 dark:text-blue-100">{{ formatMs(event.wsEvent.eventData.metadata.moderationDurationMs) }}</span></span>
                      <span v-if="event.wsEvent.eventData.metadata.processingDurationMs != null" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-blue-100 border border-blue-300 dark:bg-blue-900/50 dark:border-blue-700"><span class="text-blue-600 dark:text-blue-400">Processing</span><span class="font-mono font-semibold text-blue-900 dark:text-blue-100">{{ formatMs(event.wsEvent.eventData.metadata.processingDurationMs) }}</span></span>
                      <span v-if="event.wsEvent.eventData.metadata.actionsDurationMs != null" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-blue-100 border border-blue-300 dark:bg-blue-900/50 dark:border-blue-700"><span class="text-blue-600 dark:text-blue-400">Actions</span><span class="font-mono font-semibold text-blue-900 dark:text-blue-100">{{ formatMs(event.wsEvent.eventData.metadata.actionsDurationMs) }}</span></span>
                      <span v-if="event.wsEvent.eventData.metadata.fillerDurationMs != null" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-blue-100 border border-blue-300 dark:bg-blue-900/50 dark:border-blue-700"><span class="text-blue-600 dark:text-blue-400">Filler</span><span class="font-mono font-semibold text-blue-900 dark:text-blue-100">{{ formatMs(event.wsEvent.eventData.metadata.fillerDurationMs) }}</span></span>
                    </div>
                    <div v-if="event.type === 'AI' && hasAssistantTiming(event.wsEvent?.eventData?.metadata)"
                      class="mt-2 pt-2 border-t border-green-200 flex flex-wrap gap-1.5 dark:border-green-900">
                      <span v-if="event.wsEvent?.eventData?.metadata?.totalTurnDurationMs != null" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-100 border border-green-300 dark:bg-green-900/50 dark:border-green-700"><span class="text-green-700 dark:text-green-400">Total</span><span class="font-mono font-semibold text-green-900 dark:text-green-100">{{ formatMs(event.wsEvent.eventData.metadata.totalTurnDurationMs) }}</span></span>
                      <span v-if="event.wsEvent?.eventData?.metadata?.llmDurationMs != null" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-100 border border-green-300 dark:bg-green-900/50 dark:border-green-700"><span class="text-green-700 dark:text-green-400">LLM</span><span class="font-mono font-semibold text-green-900 dark:text-green-100">{{ formatMs(event.wsEvent.eventData.metadata.llmDurationMs) }}</span></span>
                      <span v-if="event.wsEvent?.eventData?.metadata?.timeToFirstTokenMs != null" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-100 border border-green-300 dark:bg-green-900/50 dark:border-green-700"><span class="text-green-700 dark:text-green-400">TTFT</span><span class="font-mono font-semibold text-green-900 dark:text-green-100">{{ formatMs(event.wsEvent.eventData.metadata.timeToFirstTokenMs) }}</span></span>
                      <span v-if="event.wsEvent?.eventData?.metadata?.timeToFirstTokenFromTurnStartMs != null" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-100 border border-green-300 dark:bg-green-900/50 dark:border-green-700"><span class="text-green-700 dark:text-green-400">TTFT (turn)</span><span class="font-mono font-semibold text-green-900 dark:text-green-100">{{ formatMs(event.wsEvent.eventData.metadata.timeToFirstTokenFromTurnStartMs) }}</span></span>
                      <span v-if="event.wsEvent?.eventData?.metadata?.timeToFirstAudioMs != null" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-100 border border-green-300 dark:bg-green-900/50 dark:border-green-700"><span class="text-green-700 dark:text-green-400">First audio</span><span class="font-mono font-semibold text-green-900 dark:text-green-100">{{ formatMs(event.wsEvent.eventData.metadata.timeToFirstAudioMs) }}</span></span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Conversation Events (styled like ConversationDetailView) -->
              <ConversationEventCard
                v-else-if="event.wsEvent"
                :event="toNormalizedWsEvent(event, index)"
                :show-bug-report="false"
                @open-prompt="openPromptPreview"
                @open-filler-prompt="openFillerPromptPreview"
                @open-raw-response="openRawResponsePreview"
                @open-variables="openVariablesPreview"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Input Panel -->
      <div
        class="fixed md:relative bottom-0 left-0 right-0 flex-shrink-0 bg-white md:rounded-lg md:border border-t border-gray-200 shadow-sm p-4 dark:bg-gray-800 dark:border-gray-700 ">
        <div class="flex flex-row items-end md:items-start gap-0 md:gap-3">
          <!-- Voice Recording -->
          <div class="flex flex-col gap-2 transition-all duration-300 ease-in-out overflow-hidden"
            :class="[isInputFocused ? 'max-w-0 opacity-0 mr-0' : 'max-w-[200px] opacity-100 mr-2 md:mr-0', 'md:max-w-none md:opacity-100']">
            <label class="hidden md:block mb-1.5 font-medium text-gray-900 dark:text-gray-200">Voice</label>
            <div class="flex gap-2 items-center">
              <button v-if="recording?.recordingState !== 'recording'"
                class="btn-secondary h-10 px-4 flex items-center gap-2 whitespace-nowrap" :disabled="!canRecordVoice"
                @click="startVoiceRecording" title="Start voice recording">
                <Mic :size="20" />
                <span class="hidden md:block">Speak</span>
              </button>
              <button v-else class="btn-danger h-10 px-4 flex items-center gap-2 animate-pulse whitespace-nowrap"
                @click="stopVoiceRecording" title="Stop voice recording">
                <Square :size="20" />
                <span class="hidden md:block">Stop</span>
              </button>

              <!-- Settings Button -->
              <button @click="showAudioSettingsModal = true"
                class="btn-secondary h-10 p-0 flex items-center justify-center min-w-[40px]" title="Audio settings">
                <Settings :size="20" />
              </button>

              <!-- Audio Enhancement Indicators -->
              <div class="flex flex-col gap-0.5 justify-center">
                <Waves :size="12" :class="audioSettings.echoCancellation ? 'text-green-500' : 'text-gray-300 dark:text-gray-600'" >
                  <title>{{ `Echo Cancellation: ${audioSettings.echoCancellation ? 'Enabled' : 'Disabled'}` }}</title>
                </Waves>
                <Filter :size="12" :class="audioSettings.noiseSuppression ? 'text-green-500' : 'text-gray-300 dark:text-gray-600'">
                  <title>{{ `Noise Suppression: ${audioSettings.noiseSuppression ? 'Enabled' : 'Disabled'}` }}</title>
                </Filter>
                <Gauge :size="12" :class="audioSettings.autoGainControl ? 'text-green-500' : 'text-gray-300 dark:text-gray-600'">
                  <title>{{ `Auto Gain Control: ${audioSettings.autoGainControl ? 'Enabled' : 'Disabled'}` }}</title>
                </Gauge>
              </div>

              <!-- Audio Level Indicator -->
              <div v-if="recording?.recordingState === 'recording'" class="flex items-center gap-1" title="Audio level">
                <div class="w-24 h-2 bg-gray-200 rounded-full overflow-hidden dark:bg-gray-700">
                  <div class="h-full bg-blue-500 transition-all duration-100"
                    :style="{ width: `${(recording?.audioLevel ?? 0) * 100}%` }"></div>
                </div>
              </div>
            </div>
            <p v-if="recording?.errorMessage" class="text-xs text-red-600 whitespace-nowrap overflow-hidden text-ellipsis">{{ recording.errorMessage }}</p>
          </div>

          <!-- Text Input -->
          <div class="flex gap-2 flex-1 w-full items-end">
            <div class="flex-1 w-full flex flex-col">
              <label class="hidden md:block mb-1.5 font-medium text-gray-900 dark:text-gray-200">Message</label>
              <textarea v-model="messageInput"
               @focus="isInputFocused = true"
                @blur="handleInputBlur"
                class="form-textarea w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:border-primary-400 transition-all duration-300 ease-in-out"
                rows="1" 
                placeholder="Type your message here..."
                :disabled="!canSendMessage || recording?.recordingState === 'recording'"
                @keydown.enter.exact.prevent="sendMessage" 
                style="min-height: 42px; max-height: 120px;" 
                />
            </div>

            <!-- Send Button -->
            <button class="btn-primary h-10 items-center justify-center transition-all duration-300 ease-in-out"
              :class="[isInputFocused ? 'w-14 px-0' : 'w-14 px-0', 'md:w-auto md:px-3 md:mt-10']"
              :disabled="!canSendMessage || !messageInput.trim() || recording?.recordingState === 'recording'"
              @click="sendMessage">
              <Send :size="20" />
            </button>
            </div>
        </div>

      </div>
    </div>

    <!-- Modals -->
    <StageSelectionModal v-if="showStartConversationModal" :project-id="projectId" title="Start Conversation"
      @close="showStartConversationModal = false" @select="handleStartConversation" />

    <StageSelectionModal v-if="showJumpToStageDialog" :project-id="projectId" title="Jump to Stage"
      @close="showJumpToStageDialog = false" @select="handleJumpToStage" />

    <RunActionModal v-if="showRunActionDialog" :global-actions="globalActions" :current-stage="currentStage"
      @close="showRunActionDialog = false" @call="handleRunAction" />

    <CallToolModal v-if="showCallToolDialog" :project-id="projectId"
      @close="showCallToolDialog = false" @call="handleCallTool" />

    <SetVariableModal v-if="showSetVariableDialog" :current-stage="currentStage"
      @close="showSetVariableDialog = false" @set="handleSetVariable" />

    <AudioSettingsModal v-if="showAudioSettingsModal" :current-settings="audioSettings"
      :sample-rate="parseSampleRate(wsClient?.projectSettings.value?.asrConfig?.settings?.audioFormat)"
      @close="showAudioSettingsModal = false" @save="handleAudioSettingsSave" />

    <PromptPreviewModal
      v-if="showPromptPreviewModal"
      :prompt="selectedPrompt"
      @close="showPromptPreviewModal = false" />

    <PromptPreviewModal
      v-if="showFillerPromptPreviewModal"
      :prompt="selectedFillerPrompt"
      title="Filler Prompt"
      @close="showFillerPromptPreviewModal = false" />
    
    <PromptPreviewModal
      v-if="showRawResponsePreviewModal"
      :prompt="selectedRawResponse"
      title="Raw Response"
      @close="showRawResponsePreviewModal = false" />
    
    <VariablesPreviewModal
      v-if="showVariablesPreviewModal"
      :variables="selectedVariables"
      @close="showVariablesPreviewModal = false" />
    
    <IssueEditModal
      v-if="showBugReportModal"
      :issue="null"
      :prefill-data="bugReportPrefillData"
      @close="closeBugReportModal"
      @save="handleBugReportSave" />
  </div>
</template>

<script setup lang="ts">
import { ref, shallowRef, computed, watch, onMounted, nextTick } from 'vue'
import { useRouter, useRoute, onBeforeRouteLeave } from 'vue-router'
import { useProjectSelectionStore, usePlaygroundStore, useGlobalActionsStore, useApiKeysStore, useAuthStore, useUsersStore, useConversationsStore, useIssuesStore } from '@/stores'
import NoProjectSelected from '@/components/NoProjectSelected.vue'
import TimezoneSelector from '@/components/TimezoneSelector.vue'
import { useWebSocketClient } from '@/composables/useWebSocketClient'
import { useAudioPlayback } from '@/composables/useAudioPlayback'
import { useAudioRecording } from '@/composables/useAudioRecording'
import { Play, Square, Send, Zap, SkipForward, User, Bot, AlertCircle, Info, Mic, Settings, ChevronDown, Wrench, FileText, Wand2, Key, Braces, Bug, Waves, Filter, Gauge } from 'lucide-vue-next'
import StageSelectionModal from '@/components/modals/StageSelectionModal.vue'
import RunActionModal from '@/components/modals/RunActionModal.vue'
import CallToolModal from '@/components/modals/CallToolModal.vue'
import SetVariableModal from '@/components/modals/SetVariableModal.vue'
import AudioPlayer from '@/components/AudioPlayer.vue'
import AudioSettingsModal from '@/components/modals/AudioSettingsModal.vue'
import PromptPreviewModal from '@/components/modals/PromptPreviewModal.vue'
import VariablesPreviewModal from '@/components/modals/VariablesPreviewModal.vue'
import IssueEditModal from '@/components/modals/IssueEditModal.vue'
import ConversationEventCard, { type NormalizedEvent } from '@/components/ConversationEventCard.vue'
import type { StageResponse, ConversationEventResponse, CreateIssueRequest, UpdateIssueRequest } from '@/api/types'
import type { SendAiVoiceChunk, StartAiGenerationOutput, EndAiGenerationOutput, UserTranscribedChunk, AiTranscribedChunk, ConversationEvent as WSConversationEvent, ConversationEventUpdate as WSConversationEventUpdate } from '@/api/websocket/websocket-contracts'

// Audio settings persistence
interface AudioSettings {
  deviceId: string | null
  echoCancellation: boolean
  noiseSuppression: boolean
  autoGainControl: boolean
}

const AUDIO_SETTINGS_KEY = 'bonsai_audio_settings'

function loadAudioSettings(): AudioSettings {
  try {
    const stored = localStorage.getItem(AUDIO_SETTINGS_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.error('Failed to load audio settings:', error)
  }
  // Default settings
  return {
    deviceId: null,
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  }
}

function saveAudioSettings(settings: AudioSettings): void {
  try {
    localStorage.setItem(AUDIO_SETTINGS_KEY, JSON.stringify(settings))
  } catch (error) {
    console.error('Failed to save audio settings:', error)
  }
}

// Conversation mode presets and playground preferences
interface SessionSettings {
  sendVoiceInput: boolean
  sendTextInput: boolean
  receiveVoiceOutput: boolean
  receiveTranscriptionUpdates: boolean
  receiveEvents: boolean
}

type ConversationMode = 'text-only' | 'voice-input' | 'voice-output' | 'full-voice'

interface ConversationPreset {
  id: ConversationMode
  name: string
  description: string
  sessionSettings: SessionSettings
}

interface PlaygroundPreferences {
  lastApiKeyId: string | null
  lastStageId: string | null
  showSystemEvents: boolean
  showConversationEvents: boolean
  conversationMode: ConversationMode
  timezone: string
}

interface PlaygroundPreferencesStorage {
  [projectId: string]: PlaygroundPreferences
}

const PLAYGROUND_PREFS_KEY = 'bonsai_playground_prefs'

const conversationPresets: ConversationPreset[] = [
  {
    id: 'text-only',
    name: 'Text Only',
    description: 'Text input and output only',
    sessionSettings: {
      sendVoiceInput: false,
      sendTextInput: true,
      receiveVoiceOutput: false,
      receiveTranscriptionUpdates: true,
      receiveEvents: true,
    }
  },
  {
    id: 'voice-input',
    name: 'Voice Input + Text',
    description: 'Speak to the AI, receive text responses',
    sessionSettings: {
      sendVoiceInput: true,
      sendTextInput: true,
      receiveVoiceOutput: false,
      receiveTranscriptionUpdates: true,
      receiveEvents: true,
    }
  },
  {
    id: 'voice-output',
    name: 'Text + Voice Output',
    description: 'Type messages, hear AI responses',
    sessionSettings: {
      sendVoiceInput: false,
      sendTextInput: true,
      receiveVoiceOutput: true,
      receiveTranscriptionUpdates: true,
      receiveEvents: true,
    }
  },
  {
    id: 'full-voice',
    name: 'Full Voice',
    description: 'Complete voice conversation',
    sessionSettings: {
      sendVoiceInput: true,
      sendTextInput: true,
      receiveVoiceOutput: true,
      receiveTranscriptionUpdates: true,
      receiveEvents: true,
    }
  }
]

function loadPlaygroundPreferences(projectId: string): PlaygroundPreferences {
  try {
    const stored = localStorage.getItem(PLAYGROUND_PREFS_KEY)
    if (stored) {
      const allPrefs: PlaygroundPreferencesStorage = JSON.parse(stored)
      if (allPrefs[projectId]) {
        return allPrefs[projectId]
      }
    }
  } catch (error) {
    console.error('Failed to load playground preferences:', error)
  }
  // Default preferences
  return {
    lastApiKeyId: null,
    lastStageId: null,
    showSystemEvents: false,
    showConversationEvents: true,
    conversationMode: 'full-voice', // Default to full voice
    timezone: '',
  }
}

function savePlaygroundPreferences(projectId: string, prefs: PlaygroundPreferences): void {
  try {
    const stored = localStorage.getItem(PLAYGROUND_PREFS_KEY)
    const allPrefs: PlaygroundPreferencesStorage = stored ? JSON.parse(stored) : {}
    allPrefs[projectId] = prefs
    localStorage.setItem(PLAYGROUND_PREFS_KEY, JSON.stringify(allPrefs))
  } catch (error) {
    console.error('Failed to save playground preferences:', error)
  }
}

const router = useRouter()
const route = useRoute()
const projectSelectionStore = useProjectSelectionStore()
const playgroundStore = usePlaygroundStore()
const globalActionsStore = useGlobalActionsStore()
const apiKeysStore = useApiKeysStore()
const authStore = useAuthStore()
const usersStore = useUsersStore()
const conversationsStore = useConversationsStore()
const issuesStore = useIssuesStore()

// Project selection - use route params as source of truth
const projectId = computed(() => route.params.projectId as string || '')
const hasProject = computed(() => !!projectId.value)

// Sync route projectId with store on mount and route changes
onMounted(() => {
  if (projectId.value) {
    projectSelectionStore.setSelectedProjectId(projectId.value)
  }

  // Close preset menu when clicking outside
  const handleClickOutside = (e: MouseEvent) => {
    const target = e.target as HTMLElement
    if (!target.closest('.relative')) {
      showPresetMenu.value = false
      showSettingsMenu.value = false
    }
  }
  document.addEventListener('click', handleClickOutside)

  return () => {
    document.removeEventListener('click', handleClickOutside)
  }
})

onBeforeRouteLeave(() => {
  stopAllAudioPlayback()
  playgroundStore.setConversationActive(false)
})

// Load global actions and API keys when project changes
watch(projectId, async (newProjectId, oldProjectId) => {
  // Clean up previous project's state when switching projects
  if (oldProjectId && oldProjectId !== newProjectId) {
    stopAllAudioPlayback()
    wsClient.value?.disconnect()
    wsClient.value = null
    conversationEvents.value = []
    currentStage.value = null
    currentConversationId.value = null
    resumeConversationId.value = null
    selectedApiKeyId.value = null
    messageInput.value = ''
    showStartConversationModal.value = false
    showRunActionDialog.value = false
    showJumpToStageDialog.value = false
    showCallToolDialog.value = false
    showSetVariableDialog.value = false
    showBugReportModal.value = false
  }

  if (newProjectId) {
    await Promise.all([
      globalActionsStore.fetchAll(newProjectId),
      apiKeysStore.fetchAll(newProjectId, { filters: { isActive: true } })
    ])

    // Check if resuming from query params
    const queryConversationId = route.query.conversationId as string | undefined
    const queryApiKeyId = route.query.apiKeyId as string | undefined

    if (queryConversationId && queryApiKeyId) {
      // Resume flow: pre-select API key and store conversation ID
      resumeConversationId.value = queryConversationId
      selectedApiKeyId.value = queryApiKeyId

      // Load preferences but don't overwrite the resume API key
      const prefs = loadPlaygroundPreferences(newProjectId)
      showSystemEvents.value = prefs.showSystemEvents
      showConversationEvents.value = prefs.showConversationEvents
      selectedConversationMode.value = prefs.conversationMode
      selectedTimezone.value = prefs.timezone ?? ''

      // Clear query params from URL
      router.replace({ 
        name: route.name!, 
        params: route.params,
        query: {} 
      })

      // Auto-connect and resume
      await handleResumeConversation()
    } else {
      // Normal flow: load preferences and auto-select first active API key
      const prefs = loadPlaygroundPreferences(newProjectId)
      selectedApiKeyId.value = prefs.lastApiKeyId
      showSystemEvents.value = prefs.showSystemEvents
      showConversationEvents.value = prefs.showConversationEvents
      selectedConversationMode.value = prefs.conversationMode
      selectedTimezone.value = prefs.timezone ?? ''

      // Auto-select first active API key if saved preference doesn't match any key in this project
      const firstActiveKey = activeApiKeys.value[0]
      const savedKeyExists = selectedApiKeyId.value && activeApiKeys.value.some(k => k.id === selectedApiKeyId.value)
      if (firstActiveKey && !savedKeyExists) {
        selectedApiKeyId.value = firstActiveKey.id
      }
    }
  }
}, { immediate: true })

function goToApiKeys() {
  router.push({ name: 'administration.projects', params: { projectId: projectId.value } })
}

// Computed
const globalActions = computed(() => {
  if (!projectId.value) return []
  return globalActionsStore.items
})

const activeApiKeys = computed(() => {
  if (!projectId.value) return []
  return apiKeysStore.items.filter(key => key.isActive && key.projectId === projectId.value)
})

const apiKeysLoading = computed(() => apiKeysStore.isLoading)

// WebSocket and conversation state
const selectedApiKeyId = ref<string | null>(null)
const selectedApiKey = computed(() => {
  if (!selectedApiKeyId.value) return null
  return apiKeysStore.items.find(k => k.id === selectedApiKeyId.value)
})

// Resume conversation state
const resumeConversationId = ref<string | null>(null)
const isResuming = ref(false)

// Conversation mode and preferences
const selectedConversationMode = ref<ConversationMode>('full-voice')
const selectedTimezone = ref('')
const showPresetMenu = ref(false)
const showSettingsMenu = ref(false)
const showSystemEvents = ref(false)
const showConversationEvents = ref(true)

// Note: Preferences loading is now handled in the main projectId watch above to avoid conflicts with resume flow

// Save preferences when they change
watch([selectedApiKeyId, showSystemEvents, showConversationEvents, selectedConversationMode, selectedTimezone], () => {
  if (projectId.value) {
    const prefs: PlaygroundPreferences = {
      lastApiKeyId: selectedApiKeyId.value,
      lastStageId: null, // Will be implemented when stage is selected
      showSystemEvents: showSystemEvents.value,
      showConversationEvents: showConversationEvents.value,
      conversationMode: selectedConversationMode.value,
      timezone: selectedTimezone.value,
    }
    savePlaygroundPreferences(projectId.value, prefs)
  }
})

// Get session settings for selected mode
const currentSessionSettings = computed(() => {
  const preset = conversationPresets.find(p => p.id === selectedConversationMode.value)
  return preset?.sessionSettings
})

// Filter presets based on project voice capabilities
const availablePresets = computed(() => {
  const settings = wsClient.value?.projectSettings.value
  if (!settings) {
    // If not connected yet, show all presets
    return conversationPresets.map(preset => ({ preset, disabled: false, reason: null }))
  }

  return conversationPresets.map(preset => {
    const needsVoiceInput = preset.sessionSettings.sendVoiceInput
    const needsVoiceOutput = preset.sessionSettings.receiveVoiceOutput

    if (needsVoiceInput && !settings.acceptVoice) {
      return { preset, disabled: true, reason: 'Project does not support voice input' }
    }
    if (needsVoiceOutput && !settings.generateVoice) {
      return { preset, disabled: true, reason: 'Project does not support voice output' }
    }
    return { preset, disabled: false, reason: null }
  })
})

// Conversation event log
interface ConversationEvent {
  type: 'User' | 'AI' | 'System' | 'Error' | 'ConversationEvent'
  message: string
  timestamp: Date
  details?: string
  voiceOutputId?: string // Link to voice output for audio playback
  inputTurnId?: string // Link to input turn for real-time transcription
  outputTurnId?: string // Link to output turn for real-time transcription
  isRealTime?: boolean // Whether this is a real-time updating text
  transcriptChunks?: Array<{ chunkId: string; text: string; isFinal: boolean }> // Array to maintain insertion order
  wsEvent?: WSConversationEvent | WSConversationEventUpdate // Raw WebSocket conversation event for detailed display
}

const conversationEvents = ref<ConversationEvent[]>([])

function formatEventType(eventType: string): string {
  return eventType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function formatMs(ms: any): string | null {
  if (ms == null) return null
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

function hasAssistantTiming(metadata: Record<string, any> | undefined): boolean {
  if (!metadata) return false
  return ['llmDurationMs', 'timeToFirstTokenMs', 'timeToFirstTokenFromTurnStartMs', 'timeToFirstAudioMs', 'totalTurnDurationMs']
    .some(key => metadata[key] != null)
}

function toNormalizedWsEvent(event: ConversationEvent, index: number): NormalizedEvent {
  const wsEvent = event.wsEvent!
  return {
    id: String(index),
    eventType: wsEvent.eventType as NormalizedEvent['eventType'],
    eventData: wsEvent.eventData,
    timestamp: formatTime(event.timestamp),
  }
}
const historyContainer = ref<HTMLElement | null>(null)

// Filter events based on showSystemEvents and showConversationEvents toggles
const filteredConversationEvents = computed(() => {
  let filtered = conversationEvents.value
  
  if (!showSystemEvents.value) {
    filtered = filtered.filter(event => event.type !== 'System')
  }
  
  if (!showConversationEvents.value) {
    filtered = filtered.filter(event => event.type !== 'ConversationEvent')
  }
  
  return filtered
})

// Voice output tracking
const activeVoiceOutputs = ref<Map<string, { player: ReturnType<typeof useAudioPlayback>; transcript: string | null }>>(new Map())

/**
 * Get voice output by ID
 */
function getVoiceOutput(voiceOutputId: string) {
  return activeVoiceOutputs.value.get(voiceOutputId)
}

function scrollHistoryToBottom() {
  const el = historyContainer.value
  if (!el) return
  el.scrollTop = el.scrollHeight
}

function addEvent(event: ConversationEvent) {
  conversationEvents.value.push(event)
  // Auto-scroll to bottom
  nextTick(() => {
    scrollHistoryToBottom()
    requestAnimationFrame(() => scrollHistoryToBottom())
  })
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

/**
 * Update user transcript with real-time ASR chunks
 */
function updateUserTranscript(msg: UserTranscribedChunk) {
  console.log('Received user chunk:', msg.chunkId, 'Text:', msg.chunkText, 'isFinal:', msg.isFinal)

  // Find or create the event for this input turn
  let event = conversationEvents.value.find(e => e.inputTurnId === msg.inputTurnId && e.type === 'User')

  if (!event) {
    // Create new event for this input turn
    event = {
      type: 'User',
      message: '',
      timestamp: new Date(),
      inputTurnId: msg.inputTurnId,
      isRealTime: true,
      transcriptChunks: []
    }
    conversationEvents.value.push(event)
    console.log('Created new event for inputTurnId:', msg.inputTurnId)
  }

  // Initialize transcriptChunks if not exists
  if (!event.transcriptChunks) {
    event.transcriptChunks = []
  }

  // Find existing chunk by chunkId
  const existingIndex = event.transcriptChunks.findIndex(c => c.chunkId === msg.chunkId)

  if (existingIndex >= 0) {
    console.log('Updating existing chunk at index:', existingIndex)
    // Update existing chunk
    event.transcriptChunks[existingIndex] = {
      chunkId: msg.chunkId,
      text: msg.chunkText,
      isFinal: msg.isFinal
    }
  } else {
    console.log('Adding new chunk, current array length:', event.transcriptChunks.length)
    // Add new chunk to array
    event.transcriptChunks.push({
      chunkId: msg.chunkId,
      text: msg.chunkText,
      isFinal: msg.isFinal
    })
  }

  console.log('Total chunks:', event.transcriptChunks.length, 'Chunks:', event.transcriptChunks.map(c => c.chunkId))

  // Rebuild message from chunks in array order
  event.message = event.transcriptChunks.map(chunk => chunk.text.trim()).join(' ')

  console.log('Final message:', event.message)

  // Auto-scroll to bottom
  nextTick(() => scrollHistoryToBottom())
}

/**
 * Update AI transcript with real-time text streaming chunks
 */
function updateAiTranscript(msg: AiTranscribedChunk) {
  // Find existing event for this output turn (may have voice output)
  let event = conversationEvents.value.find(e => e.outputTurnId === msg.outputTurnId && e.type === 'AI')

  if (!event) {
    // Create new event for this output turn (text-only AI response)
    event = {
      type: 'AI',
      message: '',
      timestamp: new Date(),
      outputTurnId: msg.outputTurnId,
      isRealTime: true,
      transcriptChunks: []
    }
    conversationEvents.value.push(event)
  }

  // Initialize transcriptChunks if not exists
  if (!event.transcriptChunks) {
    event.transcriptChunks = []
  }

  // Find existing chunk by chunkId
  const existingIndex = event.transcriptChunks.findIndex(c => c.chunkId === msg.chunkId)

  if (existingIndex >= 0) {
    // Update existing chunk
    event.transcriptChunks[existingIndex] = {
      chunkId: msg.chunkId,
      text: msg.chunkText,
      isFinal: msg.isFinal
    }
  } else {
    // Add new chunk to array
    event.transcriptChunks.push({
      chunkId: msg.chunkId,
      text: msg.chunkText,
      isFinal: msg.isFinal
    })
  }

  // Rebuild message from chunks in array order
  event.message = event.transcriptChunks.map(chunk => chunk.text).join('')

  // Mark as not real-time if this chunk is final
  if (msg.isFinal) {
    event.isRealTime = false
  }

  // Auto-scroll to bottom
  nextTick(() => scrollHistoryToBottom())
}

// Type guard used for User/AI message cards in the playground
function isMessageEvent(event: WSConversationEvent): event is WSConversationEvent & {
  eventType: 'message'
  eventData: { role: 'user' | 'assistant'; text: string; originalText: string; metadata?: Record<string, any> }
} {
  return event.eventType === 'message'
}

function openPromptPreview(prompt: string) {
  selectedPrompt.value = prompt
  showPromptPreviewModal.value = true
}

function openFillerPromptPreview(prompt: string) {
  selectedFillerPrompt.value = prompt
  showFillerPromptPreviewModal.value = true
}

function openRawResponsePreview(rawResponse: string) {
  selectedRawResponse.value = rawResponse
  showRawResponsePreviewModal.value = true
}

function hasSystemPrompt(metadata: Record<string, any> | undefined): boolean {
  return !!(metadata && metadata.systemPrompt && typeof metadata.systemPrompt === 'string')
}

function hasFillerPrompt(metadata: Record<string, any> | undefined): boolean {
  return !!(metadata && metadata.fillerPrompt && typeof metadata.fillerPrompt === 'string')
}

function openVariablesPreview(variables: Record<string, any>) {
  selectedVariables.value = variables
  showVariablesPreviewModal.value = true
}

function hasCurrentVariables(metadata: Record<string, any> | undefined): boolean {
  return !!(metadata && metadata.currentVariables && typeof metadata.currentVariables === 'object')
}

function openBugReport(event: ConversationEvent) {
  console.log('All Events:', conversationEvents.value)
  const eventIndex = conversationEvents.value.filter(e=>e.type != 'System').indexOf(event)
  bugReportPrefillData.value = {
    projectId: projectId.value,
    sessionId: currentConversationId.value || undefined,
    eventIndex: eventIndex >= 0 ? eventIndex : undefined,
    stageId: currentStage.value?.id || undefined
  }
  showBugReportModal.value = true
}

function closeBugReportModal() {
  showBugReportModal.value = false
  bugReportPrefillData.value = undefined
}

async function handleBugReportSave(data: CreateIssueRequest | UpdateIssueRequest) {
  try {
    await issuesStore.create(data as CreateIssueRequest)
    closeBugReportModal()
    addEvent({
      type: 'System',
      message: 'Bug report created successfully',
      timestamp: new Date()
    })
  } catch (error) {
    console.error('Failed to create issue:', error)
    addEvent({
      type: 'Error',
      message: 'Failed to create bug report',
      timestamp: new Date()
    })
  }
}

const TERMINAL_CONVERSATION_EVENTS = new Set(['conversation_aborted', 'conversation_failed'] as ConversationEventResponse['eventType'][])

/**
 * Handle conversation event from WebSocket
 */
function handleConversationEvent(event: WSConversationEvent) {
  // Handle terminal events - conversation ended server-side
  if (TERMINAL_CONVERSATION_EVENTS.has(event.eventType)) {
    // Add the event to history first
    addEvent({
      type: 'ConversationEvent',
      message: formatEventType(event.eventType as string),
      timestamp: new Date(),
      wsEvent: event
    })
    // Reset conversation state without calling endConversation() on the server
    currentStage.value = null
    if (wsClient.value) {
      wsClient.value.isInConversation.value = false
    }
    disconnectWebSocket()
    return
  }

  // Handle message events - update existing events with final metadata
  if (isMessageEvent(event)) {
    // Find existing User or AI event by matching the text
    const existingEvent = conversationEvents.value.find(e => 
      (e.type === 'User' && event.eventData.role === 'user' && e.message.trim() === event.eventData.text.trim()) ||
      (e.type === 'AI' && event.eventData.role === 'assistant' && e.message.trim() === event.eventData.text.trim())
    )

    if (existingEvent) {
      // Update existing event with message event data (includes metadata with systemPrompt)
      existingEvent.wsEvent = event
      existingEvent.isRealTime = false
    } else {
      // No existing event found - create new one (shouldn't normally happen but safe fallback)
      addEvent({
        type: event.eventData.role === 'user' ? 'User' : 'AI',
        message: event.eventData.text,
        timestamp: new Date(),
        wsEvent: event,
        isRealTime: false
      })
    }
    return
  }

  // Store the raw WebSocket event for rendering in ConversationDetailView style
  if (!currentConversationId.value && event.conversationId) {
    currentConversationId.value = event.conversationId
  }
  addEvent({
    type: 'ConversationEvent',
    message: formatEventType(event.eventType as string),
    timestamp: new Date(),
    wsEvent: event
  })
}

/**
 * Handle conversation event update from WebSocket — updates the wsEvent of an
 * existing playground event matched by outputTurnId or inputTurnId.
 */
function handleConversationEventUpdate(event: WSConversationEventUpdate) {
  let existingEvent: ConversationEvent | undefined

  if (event.outputTurnId) {
    existingEvent = conversationEvents.value.find(e =>
      e.outputTurnId === event.outputTurnId ||
      e.wsEvent?.outputTurnId === event.outputTurnId
    )
  } else if (event.inputTurnId) {
    existingEvent = conversationEvents.value.find(e =>
      e.inputTurnId === event.inputTurnId ||
      e.wsEvent?.inputTurnId === event.inputTurnId
    )
  }

  if (existingEvent) {
    existingEvent.wsEvent = event
  }
}

// WebSocket client setup
const wsClient = shallowRef<ReturnType<typeof useWebSocketClient> | null>(null)
const isWsConnecting = ref(false)
const isWsDisconnecting = ref(false)
const isConversationStarting = ref(false)
const isConversationEnding = ref(false)
const isSendingMessage = ref(false)
const isRunningAction = ref(false)
const isJumpingStage = ref(false)
const isCallingTool = ref(false)

const wsIsConnected = computed(() => wsClient.value?.isConnected.value || false)
const wsSessionId = computed(() => wsClient.value?.sessionId.value || null)
const isConversationActive = computed(() => wsClient.value?.isInConversation.value || false)

// Sync conversation active state with the store so MainLayout can block project changes
watch(isConversationActive, (active) => {
  playgroundStore.setConversationActive(active)
})

const canConnectWebSocket = computed(() => {
  return !!selectedApiKey.value?.key && !wsIsConnected.value && !isWsConnecting.value && !isWsDisconnecting.value
})

const canStartConversation = computed(() => {
  return !!selectedApiKey.value?.key && !isConversationActive.value && !isWsConnecting.value && !isWsDisconnecting.value && !isConversationStarting.value && !isConversationEnding.value
})

const canEndConversation = computed(() => {
  return wsIsConnected.value && isConversationActive.value && !isConversationStarting.value && !isConversationEnding.value
})

const canRunAction = computed(() => {
  return wsIsConnected.value && isConversationActive.value && !isConversationStarting.value && !isConversationEnding.value && !isRunningAction.value
})

const canJumpToStage = computed(() => {
  return wsIsConnected.value && isConversationActive.value && !isConversationStarting.value && !isConversationEnding.value && !isJumpingStage.value
})

const canCallTool = computed(() => {
  return wsIsConnected.value && isConversationActive.value && !isConversationStarting.value && !isConversationEnding.value && !isCallingTool.value
})

const canSetVariable = computed(() => {
  return wsIsConnected.value && isConversationActive.value && !isConversationStarting.value && !isConversationEnding.value && currentStage.value !== null
})

const canSendMessage = computed(() => {
  return wsIsConnected.value && isConversationActive.value && !isConversationStarting.value && !isConversationEnding.value && !isSendingMessage.value
})

const canRecordVoice = computed(() => {
  return wsIsConnected.value && isConversationActive.value && !isConversationStarting.value && !isConversationEnding.value && !isSendingMessage.value && recording.value?.recordingState === 'idle'
})

// Parse sample rate from audioFormat (e.g., 'pcm_16000' -> 16000)
function parseSampleRate(audioFormat?: string): number {
  if (!audioFormat) return 16000 // Default
  const match = audioFormat.match(/(\d+)$/)
  if (match && match[1]) {
    return parseInt(match[1], 10)
  }
  return 16000
}

// Audio recording setup - reactive based on ASR settings
const recording = ref<ReturnType<typeof useAudioRecording> | null>(null)

// Initialize/update recording when project settings change
watch(() => wsClient.value?.projectSettings.value, (settings) => {
  if (!settings) {
    recording.value = null
    return
  }

  const sampleRate = parseSampleRate(settings.asrConfig?.settings?.audioFormat)

  addEvent({
    type: 'System',
    message: `Audio recording configured: ${sampleRate}Hz (${settings.asrConfig?.settings?.audioFormat || 'pcm_16000'})`,
    timestamp: new Date(),
    details: settings.acceptVoice ? 'Voice input enabled' : 'Voice input disabled'
  })

  // Create new recording instance with correct sample rate and saved settings
  recording.value = useAudioRecording({
    sampleRate,
    chunkDurationMs: 750, // 0.75 second per chunk
    deviceId: audioSettings.value.deviceId ?? undefined,
    echoCancellation: audioSettings.value.echoCancellation,
    noiseSuppression: audioSettings.value.noiseSuppression,
    autoGainControl: audioSettings.value.autoGainControl,
    onChunk: async (base64Audio: string) => {
      if (!wsClient.value) return

      try {
        // Stream audio chunk to backend
        await wsClient.value.sendVoiceChunk(base64Audio)
      } catch (error) {
        console.error('Failed to send voice chunk:', error)
        addEvent({
          type: 'Error',
          message: `Failed to send audio: ${error instanceof Error ? error.message : String(error)}`,
          timestamp: new Date()
        })
      }
    },
    onError: (error: Error) => {
      addEvent({
        type: 'Error',
        message: `Recording error: ${error.message}`,
        timestamp: new Date()
      })
    }
  })
}, { immediate: true })

async function startVoiceRecording() {
  if (!canRecordVoice.value || !wsClient.value || !recording.value) return

  stopAllAudioPlayback()

  try {
    // Start voice input phase on backend and get inputTurnId
    const inputTurnId = await wsClient.value.startVoiceInput()

    // Pre-create user event box with inputTurnId (empty message, will be filled by chunks)
    const event: ConversationEvent = {
      type: 'User',
      message: '',
      timestamp: new Date(),
      inputTurnId: inputTurnId,
      isRealTime: true,
      transcriptChunks: []
    }
    conversationEvents.value.push(event)

    // Auto-scroll to show the new event
    nextTick(() => scrollHistoryToBottom())

    // Start recording from microphone
    await recording.value.startRecording()
  } catch (error) {
    addEvent({
      type: 'Error',
      message: `Failed to start recording: ${error instanceof Error ? error.message : String(error)}`,
      timestamp: new Date()
    })
  }
}

async function stopVoiceRecording() {
  if (!wsClient.value || !recording.value) return

  try {
    // Stop recording (will process remaining chunks)
    recording.value.stopRecording()

    // Mark the last event not real-time anymore (in case onChunk is still processing)
    const lastEvent = conversationEvents.value[conversationEvents.value.length - 1]
    if (lastEvent) {
      lastEvent.isRealTime = false
    }

    // End voice input phase on backend
    await wsClient.value.endVoiceInput()
  } catch (error) {
    addEvent({
      type: 'Error',
      message: `Failed to end voice input: ${error instanceof Error ? error.message : String(error)}`,
      timestamp: new Date()
    })
  }
}

function handleAudioSettingsSave(settings: AudioSettings) {
  audioSettings.value = settings
  saveAudioSettings(settings)
  showAudioSettingsModal.value = false

  addEvent({
    type: 'System',
    message: 'Audio settings saved',
    timestamp: new Date(),
    details: `Device: ${settings.deviceId || 'default'}`
  })

  // Recreate recording instance with new settings if project settings exist
  if (wsClient.value?.projectSettings.value) {
    const projectSettings = wsClient.value.projectSettings.value
    const sampleRate = parseSampleRate(projectSettings.asrConfig?.settings?.audioFormat)

    recording.value = useAudioRecording({
      sampleRate,
      chunkDurationMs: 750,
      deviceId: settings.deviceId ?? undefined,
      echoCancellation: settings.echoCancellation,
      noiseSuppression: settings.noiseSuppression,
      autoGainControl: settings.autoGainControl,
      onChunk: async (base64Audio: string) => {
        if (!wsClient.value) return
        try {
          await wsClient.value.sendVoiceChunk(base64Audio)
        } catch (error) {
          console.error('Failed to send voice chunk:', error)
          addEvent({
            type: 'Error',
            message: `Failed to send audio: ${error instanceof Error ? error.message : String(error)}`,
            timestamp: new Date()
          })
        }
      },
      onError: (error: Error) => {
        addEvent({
          type: 'Error',
          message: `Recording error: ${error.message}`,
          timestamp: new Date()
        })
      }
    })
  }
}

async function connectWebSocket() {
  if (!canConnectWebSocket.value) return

  const apiKey = selectedApiKey.value?.key
  if (!apiKey) return

  try {
    isWsConnecting.value = true

    addEvent({
      type: 'System',
      message: 'Connecting to WebSocket server...',
      timestamp: new Date()
    })

    const client = useWebSocketClient(apiKey, {
      sessionSettings: currentSessionSettings.value,
      onConnect: () => {
        addEvent({
          type: 'System',
          message: 'Connected to WebSocket',
          timestamp: new Date()
        })
      },
      onDisconnect: () => {
        addEvent({
          type: 'System',
          message: 'Disconnected from WebSocket',
          timestamp: new Date()
        })
      },
      onError: (error) => {
        addEvent({
          type: 'Error',
          message: error.error,
          timestamp: new Date()
        })
      },
      onUserTranscribedChunk: (msg: UserTranscribedChunk) => {
        updateUserTranscript(msg)
      },
      onAiOutputStart: (msg: StartAiGenerationOutput) => {
        // Find or create event for this output turn
        let event = conversationEvents.value.find(e => e.outputTurnId === msg.outputTurnId && e.type === 'AI')

        if (!event) {
          // Create new event
          event = {
            type: 'AI',
            message: '',
            timestamp: new Date(),
            outputTurnId: msg.outputTurnId
          }
          conversationEvents.value.push(event)
        }

        // Only initialize audio player if voice output is expected
        if (msg.expectVoice) {
          event.voiceOutputId = msg.outputTurnId
          const player = useAudioPlayback()
          activeVoiceOutputs.value.set(msg.outputTurnId, {
            player: player as any,
            transcript: null
          })
        }

        // Auto-scroll
        nextTick(() => scrollHistoryToBottom())
      },
      onAiVoiceChunk: async (msg: SendAiVoiceChunk) => {
        const voiceOutput = activeVoiceOutputs.value.get(msg.outputTurnId)
        if (!voiceOutput) {
          console.warn('Received audio chunk for unknown voice output:', msg.outputTurnId)
          return
        }

        // Add chunk to audio player queue
        await voiceOutput.player.addChunk({
          audioData: msg.audioData,
          audioFormat: msg.audioFormat,
          ordinal: msg.ordinal,
          isFinal: msg.isFinal,
          bitRate: msg.bitRate,
          sampleRate: msg.sampleRate,
        })
      },
      onAiOutputEnd: (msg: EndAiGenerationOutput) => {
        const voiceOutput = activeVoiceOutputs.value.get(msg.outputTurnId)
        if (voiceOutput) {
          // Store transcript for display in AudioPlayer
          voiceOutput.transcript = msg.fullText?.trim() || null
        }

        // Update the conversation event with the full text
        const event = conversationEvents.value.find(e => e.outputTurnId === msg.outputTurnId && e.type === 'AI')
        if (event && msg.fullText) {
          event.message = msg.fullText.trim()
          event.isRealTime = false

          // Auto-scroll to bottom
          nextTick(() => scrollHistoryToBottom())
        }
      },
      onAiTranscribedChunk: (msg: AiTranscribedChunk) => {
        updateAiTranscript(msg)
      },
      onConversationEvent: (event: WSConversationEvent) => {
        handleConversationEvent(event)
      },
      onConversationEventUpdate: (event: WSConversationEventUpdate) => {
        handleConversationEventUpdate(event)
      }
    })

    wsClient.value = client
    await client.connect()

    if (wsSessionId.value) {
      addEvent({
        type: 'System',
        message: 'WebSocket session established',
        timestamp: new Date(),
        details: `Session ID: ${wsSessionId.value}`
      })
    }

    // If resuming, do it after successful connection
    if (resumeConversationId.value && !isResuming.value) {
      await resumeConversation(resumeConversationId.value)
    }
  } catch (error) {
    addEvent({
      type: 'Error',
      message: `Failed to connect: ${error instanceof Error ? error.message : String(error)}`,
      timestamp: new Date()
    })
    wsClient.value?.disconnect()
    wsClient.value = null
  } finally {
    isWsConnecting.value = false
  }
}

async function disconnectWebSocket() {
  if (!wsClient.value) return
  if (isWsDisconnecting.value) return

  try {
    isWsDisconnecting.value = true

    addEvent({
      type: 'System',
      message: 'Disconnecting from WebSocket...',
      timestamp: new Date()
    })

    wsClient.value.disconnect()
    wsClient.value = null
  } finally {
    isWsDisconnecting.value = false
  }
}

// State
const messageInput = ref('')
const isInputFocused = ref(false)
const handleInputBlur = () => {
  setTimeout(() => {
    isInputFocused.value = false
  }, 200)
}
const currentStage = ref<StageResponse | null>(null)
const showStartConversationModal = ref(false)
const showRunActionDialog = ref(false)
const showJumpToStageDialog = ref(false)
const showCallToolDialog = ref(false)
const showSetVariableDialog = ref(false)
const showAudioSettingsModal = ref(false)
const showPromptPreviewModal = ref(false)
const selectedPrompt = ref('')
const showFillerPromptPreviewModal = ref(false)
const selectedFillerPrompt = ref('')
const showRawResponsePreviewModal = ref(false)
const selectedRawResponse = ref('')
const showVariablesPreviewModal = ref(false)
const selectedVariables = ref<Record<string, any>>({})
const showBugReportModal = ref(false)
const bugReportPrefillData = ref<{ projectId?: string; sessionId?: string; eventIndex?: number; stageId?: string } | undefined>(undefined)
const currentConversationId = ref<string | null>(null)

// Audio settings
const audioSettings = ref<AudioSettings>(loadAudioSettings())

// Conversation mode selection
function handlePresetSelect(mode: ConversationMode) {
  selectedConversationMode.value = mode
  showPresetMenu.value = false

  addEvent({
    type: 'System',
    message: `Conversation mode changed to: ${conversationPresets.find(p => p.id === mode)?.name}`,
    timestamp: new Date()
  })

  // Auto-start conversation after selecting mode
  startConversation()
}

// Methods
async function startConversation() {
  if (isConversationActive.value || isConversationStarting.value || showStartConversationModal.value) {
    return
  }

  // Auto-connect WebSocket if not connected
  if (!wsIsConnected.value) {
    await connectWebSocket()
    if (!wsIsConnected.value) {
      return // Connection failed
    }
  }

  showStartConversationModal.value = true
}

/**
 * Ensure a user exists for the current operator
 * If not, create one with the operator's ID and basic profile
 */
async function ensureUserExists(): Promise<string> {
  const operatorId = authStore.currentOperator?.id
  if (!operatorId) {
    throw new Error('No authenticated operator found')
  }

  try {
    // Try to fetch the user by operator ID
    const user = await usersStore.fetchById(projectId.value, operatorId)
    if (user) {
      return operatorId
    }
  } catch (error) {
    // User doesn't exist (404), so we'll create it
  }

  // Create user with operator ID
  try {
    addEvent({
      type: 'System',
      message: `Creating user profile for operator: ${authStore.currentOperator?.name}`,
      timestamp: new Date()
    })

    await usersStore.create(projectId.value, {
      id: operatorId,
      profile: {
        name: authStore.currentOperator?.name || 'Operator User',
        type: 'operator',
        createdVia: 'playground'
      }
    })

    addEvent({
      type: 'System',
      message: 'User profile created successfully',
      timestamp: new Date()
    })

    return operatorId
  } catch (error) {
    throw new Error(`Failed to create user: ${error instanceof Error ? error.message : String(error)}`)
  }
}

async function handleStartConversation(stage: StageResponse) {
  if (!wsClient.value) return
  if (isConversationStarting.value || isConversationEnding.value) return

  try {
    isConversationStarting.value = true

    // Clear conversation history when starting a new conversation
    conversationEvents.value = []
    currentConversationId.value = null
    activeVoiceOutputs.value.clear()

    addEvent({
      type: 'System',
      message: `Starting conversation with stage: ${stage.name}`,
      timestamp: new Date()
    })

    // Ensure user exists before starting conversation
    const userId = await ensureUserExists()

    const convId = await wsClient.value.startConversation({
      userId: userId,
      stageId: stage.id,
      agentId: stage.agentId,
      timezone: selectedTimezone.value || undefined,
    })

    currentStage.value = stage

    addEvent({
      type: 'System',
      message: 'Conversation started successfully',
      timestamp: new Date(),
      details: `Conversation ID: ${convId}, User ID: ${userId}`
    })
  } catch (error) {
    addEvent({
      type: 'Error',
      message: `Failed to start conversation: ${error instanceof Error ? error.message : String(error)}`,
      timestamp: new Date()
    })
  } finally {
    isConversationStarting.value = false
  }
}

async function handleResumeConversation() {
  if (!selectedApiKey.value) {
    addEvent({
      type: 'Error',
      message: 'No API key selected',
      timestamp: new Date()
    })
    return
  }

  // Connect if not already connected
  if (!wsIsConnected.value) {
    await connectWebSocket()
  }
}

async function resumeConversation(convId: string) {
  if (!wsClient.value) return
  if (isResuming.value || isConversationStarting.value || isConversationEnding.value) return

  try {
    isResuming.value = true

    // Clear conversation history and voice outputs
    conversationEvents.value = []
    currentConversationId.value = convId
    activeVoiceOutputs.value.clear()

    addEvent({
      type: 'System',
      message: `Loading conversation history...`,
      timestamp: new Date()
    })

    // Fetch conversation history from API
    const projectIdValue = projectId.value
    if (projectIdValue) {
      try {
        const response = await conversationsStore.fetchEvents(projectIdValue, convId, {
          orderBy: 'timestamp'
        })
        
        const historicalEvents = response.items || []
        
        // Convert API events to display format
        for (const apiEvent of historicalEvents) {
          conversationEvents.value.push(convertApiEventToDisplayEvent(apiEvent))
        }

        addEvent({
          type: 'System',
          message: `Loaded ${historicalEvents.length} historical event${historicalEvents.length !== 1 ? 's' : ''}`,
          timestamp: new Date()
        })
      } catch (error) {
        console.error('Failed to load conversation history:', error)
        addEvent({
          type: 'Error',
          message: `Failed to load conversation history: ${error instanceof Error ? error.message : String(error)}`,
          timestamp: new Date()
        })
      }
    }

    addEvent({
      type: 'System',
      message: `Resuming conversation: ${convId}`,
      timestamp: new Date()
    })

    await wsClient.value.resumeConversation(convId)

    addEvent({
      type: 'System',
      message: 'Conversation resumed successfully',
      timestamp: new Date(),
      details: `Conversation ID: ${convId}`
    })

    // Auto-scroll to bottom after loading history
    nextTick(() => scrollHistoryToBottom())

    // Clear the resume conversation ID after successful resume
    resumeConversationId.value = null
  } catch (error) {
    addEvent({
      type: 'Error',
      message: `Failed to resume conversation: ${error instanceof Error ? error.message : String(error)}`,
      timestamp: new Date()
    })

    // Clear the resume conversation ID on error
    resumeConversationId.value = null
  } finally {
    isResuming.value = false
  }
}

/**
 * Convert API conversation event to Playground display format
 */
function convertApiEventToDisplayEvent(apiEvent: ConversationEventResponse): ConversationEvent {
  const timestamp = apiEvent.timestamp ? new Date(apiEvent.timestamp) : new Date()
  
  // Handle message events specially (User/AI type)
  if (apiEvent.eventType === 'message' && 'role' in apiEvent.eventData) {
    const messageData = apiEvent.eventData as { role: 'user' | 'assistant'; text: string; originalText: string; metadata?: Record<string, any> }
    return {
      type: messageData.role === 'user' ? 'User' : 'AI',
      message: messageData.text || messageData.originalText || '',
      timestamp,
      wsEvent: apiEvent as any // Include raw event for metadata buttons
    }
  }
  
  // For all other events, use ConversationEvent type with wsEvent
  return {
    type: 'ConversationEvent',
    message: formatEventType(apiEvent.eventType as string),
    timestamp,
    wsEvent: apiEvent as any
  }
}

async function handleJumpToStage(stage: StageResponse) {
  if (!wsClient.value || !wsClient.value.client.value) {
    addEvent({
      type: 'Error',
      message: 'No active WebSocket connection',
      timestamp: new Date()
    })
    return
  }
  if (isJumpingStage.value || isConversationStarting.value || isConversationEnding.value) return

  try {
    isJumpingStage.value = true
    addEvent({
      type: 'System',
      message: `Jumping to stage: ${stage.name}`,
      timestamp: new Date()
    })

    await wsClient.value.client.value.goToStage(stage.id)
    currentStage.value = stage

    addEvent({
      type: 'System',
      message: `Successfully moved to stage: ${stage.name}`,
      timestamp: new Date()
    })
  } catch (error) {
    addEvent({
      type: 'Error',
      message: `Failed to jump to stage: ${error instanceof Error ? error.message : String(error)}`,
      timestamp: new Date()
    })
  } finally {
    isJumpingStage.value = false
  }
}

async function handleCallTool(toolId: string, parameters: Record<string, any>) {
  if (!wsClient.value || !wsClient.value.client.value) {
    addEvent({
      type: 'Error',
      message: 'No active WebSocket connection',
      timestamp: new Date()
    })
    return
  }
  if (isCallingTool.value || isConversationStarting.value || isConversationEnding.value) return

  try {
    isCallingTool.value = true
    addEvent({
      type: 'System',
      message: `Calling tool: ${toolId}`,
      timestamp: new Date()
    })

    const result = await wsClient.value.client.value.callTool(toolId, parameters)

    addEvent({
      type: 'System',
      message: `Tool executed successfully. Result: ${JSON.stringify(result, null, 2)}`,
      timestamp: new Date()
    })
  } catch (error) {
    addEvent({
      type: 'Error',
      message: `Failed to call tool: ${error instanceof Error ? error.message : String(error)}`,
      timestamp: new Date()
    })
  } finally {
    isCallingTool.value = false
  }
}

async function handleSetVariable(data: { variableName: string; variableValue: any }) {
  if (!wsClient.value || !wsClient.value.client.value) {
    addEvent({
      type: 'Error',
      message: 'No active WebSocket connection',
      timestamp: new Date()
    })
    return
  }

  if (!currentStage.value) {
    addEvent({
      type: 'Error',
      message: 'No active stage',
      timestamp: new Date()
    })
    return
  }

  try {
    addEvent({
      type: 'System',
      message: `Setting variable "${data.variableName}" in stage "${currentStage.value.name}"`,
      timestamp: new Date(),
      details: `Value: ${JSON.stringify(data.variableValue)}`
    })

    await wsClient.value.client.value.setVariable(
      currentStage.value.id,
      data.variableName,
      data.variableValue
    )

    addEvent({
      type: 'System',
      message: `Variable "${data.variableName}" set successfully`,
      timestamp: new Date()
    })

    showSetVariableDialog.value = false
  } catch (error) {
    addEvent({
      type: 'Error',
      message: `Failed to set variable: ${error instanceof Error ? error.message : String(error)}`,
      timestamp: new Date()
    })
  }
}

async function endConversation() {
  if (!wsClient.value) return
  if (isConversationEnding.value || isConversationStarting.value) return

  try {
    isConversationEnding.value = true
    addEvent({
      type: 'System',
      message: 'Ending conversation...',
      timestamp: new Date()
    })

    await wsClient.value.endConversation()
    currentStage.value = null

    addEvent({
      type: 'System',
      message: 'Conversation ended successfully',
      timestamp: new Date()
    })

    // Auto-disconnect WebSocket
    await disconnectWebSocket()
  } catch (error) {
    addEvent({
      type: 'Error',
      message: `Failed to end conversation: ${error instanceof Error ? error.message : String(error)}`,
      timestamp: new Date()
    })
  } finally {
    isConversationEnding.value = false
  }
}

function stopAllAudioPlayback() {
  for (const voiceOutput of activeVoiceOutputs.value.values()) {
    voiceOutput.player.stop()
  }
}

async function sendMessage() {
  if (!messageInput.value.trim() || !wsClient.value) return
  if (!canSendMessage.value) return

  stopAllAudioPlayback()

  const message = messageInput.value.trim()

  try {
    isSendingMessage.value = true
    addEvent({
      type: 'User',
      message: message,
      timestamp: new Date()
    })

    await wsClient.value.sendTextInput(message)
    messageInput.value = ''
  } catch (error) {
    addEvent({
      type: 'Error',
      message: `Failed to send message: ${error instanceof Error ? error.message : String(error)}`,
      timestamp: new Date()
    })
  } finally {
    isSendingMessage.value = false
  }
}

async function handleRunAction(data: { type: 'global' | 'stage'; actionKey: string; parameters: Record<string, any>; parameterOrder: string[] }) {
  if (!wsClient.value || !wsClient.value.client.value) {
    addEvent({
      type: 'Error',
      message: 'No active WebSocket connection',
      timestamp: new Date()
    })
    return
  }
  if (!canRunAction.value) return

  try {
    isRunningAction.value = true
    addEvent({
      type: 'System',
      message: `Running action: ${data.actionKey}`,
      timestamp: new Date(),
      details: `Parameters: ${JSON.stringify(data.parameters)}`
    })

    // Pass parameters as record with order information
    const result = await wsClient.value.client.value.runAction(data.actionKey, data.parameters)

    addEvent({
      type: 'System',
      message: `Action completed: ${data.actionKey}`,
      timestamp: new Date(),
      details: `Result: ${JSON.stringify(result)}`
    })

    showRunActionDialog.value = false
  } catch (error) {
    addEvent({
      type: 'Error',
      message: `Failed to run action: ${error instanceof Error ? error.message : String(error)}`,
      timestamp: new Date()
    })
  } finally {
    isRunningAction.value = false
  }
}
</script>
