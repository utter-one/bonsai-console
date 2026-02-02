<template>
  <div class="modal-overlay" @click="$emit('close')">
    <div class="modal-content max-w-6xl fixed-height-modal" @click.stop>
      <h2 class="modal-header">
        {{ editingKey ? 'Edit Action' : 'New Action' }}
      </h2>

      <!-- Tab Navigation -->
      <div class="border-b border-gray-200 mb-6">
        <nav class="-mb-px flex space-x-8 overflow-x-auto">
          <button
            type="button"
            @click="activeTab = 'basic'"
            :class="[
              activeTab === 'basic'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
              'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm'
            ]"
          >
            Basic
          </button>
          <button
            type="button"
            @click="activeTab = 'trigger'"
            :class="[
              activeTab === 'trigger'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
              'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm'
            ]"
          >
            Trigger
          </button>
          <button
            type="button"
            @click="activeTab = 'parameters'"
            :class="[
              activeTab === 'parameters'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
              'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm'
            ]"
          >
            Parameters
          </button>
          <button
            type="button"
            @click="activeTab = 'effects'"
            :class="[
              activeTab === 'effects'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
              'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm'
            ]"
          >
            Effects
          </button>
          <button
            v-if="operations.goToStage.enabled"
            type="button"
            @click="activeTab = 'goToStage'"
            :class="[
              activeTab === 'goToStage'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
              'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm'
            ]"
          >
            Go To Stage
          </button>
          <button
            v-if="operations.runScript.enabled"
            type="button"
            @click="activeTab = 'runScript'"
            :class="[
              activeTab === 'runScript'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
              'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm'
            ]"
          >
            Run Script
          </button>
          <button
            v-if="operations.modifyUserInput.enabled"
            type="button"
            @click="activeTab = 'modifyUserInput'"
            :class="[
              activeTab === 'modifyUserInput'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
              'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm'
            ]"
          >
            Modify User Input
          </button>
          <button
            v-if="operations.modifyVariables.enabled"
            type="button"
            @click="activeTab = 'modifyVariables'"
            :class="[
              activeTab === 'modifyVariables'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
              'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm'
            ]"
          >
            Modify Variables
          </button>
          <button
            v-if="operations.modifyUserProfile.enabled"
            type="button"
            @click="activeTab = 'modifyUserProfile'"
            :class="[
              activeTab === 'modifyUserProfile'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
              'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm'
            ]"
          >
            Modify User Profile
          </button>
          <button
            v-if="operations.callTool.enabled"
            type="button"
            @click="activeTab = 'callTool'"
            :class="[
              activeTab === 'callTool'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
              'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm'
            ]"
          >
            Call Tool
          </button>
          <button
            v-if="operations.callWebhook.enabled"
            type="button"
            @click="activeTab = 'callWebhook'"
            :class="[
              activeTab === 'callWebhook'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
              'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm'
            ]"
          >
            Call Webhook
          </button>
        </nav>
      </div>
      
      <form @submit.prevent="handleSubmit" class="flex flex-col" style="height: calc(100% - 140px);">
        <div class="overflow-y-auto flex-1 px-1">
        <!-- Basic Tab -->
        <div v-show="activeTab === 'basic'" class="space-y-6">
          <div class="form-group">
            <label class="form-label">
              Action Key <span class="required">*</span>
            </label>
            <input
              v-model="form.key"
              type="text"
              required
              placeholder="transfer_to_agent"
              :class="editingKey ? 'form-input-disabled font-mono' : 'form-input font-mono'"
              :disabled="!!editingKey"
            />
            <p class="form-help-text">
              Unique identifier for this action{{ editingKey ? ' (cannot be changed)' : '' }}
            </p>
          </div>

          <div class="form-group">
            <label class="form-label">
              Display Name <span class="required">*</span>
            </label>
            <input
              v-model="form.name"
              type="text"
              required
              placeholder="Transfer to Human Agent"
              class="form-input"
            />
            <p class="form-help-text">
              Human-readable name for this action
            </p>
          </div>

          <div class="form-group">
            <label class="form-label">
              Examples <span class="text-gray-500">(optional, one per line)</span>
            </label>
            <textarea
              v-model="form.examples"
              rows="4"
              class="form-textarea"
              placeholder="I want to speak with someone&#10;Can I talk to an agent?&#10;Transfer me to a human"
            ></textarea>
            <p class="form-help-text">
              Example phrases that should trigger this action
            </p>
          </div>
        </div>

        <!-- Trigger Tab -->
        <div v-show="activeTab === 'trigger'" class="space-y-6">
          <div class="form-group">
            <label class="form-label">Trigger Options <span class="required">*</span></label>
            <div class="space-y-2">
              <label class="flex items-center cursor-pointer">
                <input
                  v-model="form.triggerOnUserInput"
                  type="checkbox"
                  class="form-checkbox"
                />
                <span class="ml-2 text-sm font-medium text-gray-700">
                  Trigger on User Input
                </span>
              </label>
              <label class="flex items-center cursor-pointer">
                <input
                  v-model="form.triggerOnClientCommand"
                  type="checkbox"
                  class="form-checkbox"
                />
                <span class="ml-2 text-sm font-medium text-gray-700">
                  Trigger on Client Command
                </span>
              </label>
            </div>
            <p class="form-help-text">
              Select when this action can be triggered
            </p>
          </div>

          <div class="form-group">
            <label class="form-label">
              Classification Trigger <span class="text-gray-500">(optional)</span>
            </label>
            <input
              v-model="form.classificationTrigger"
              type="text"
              placeholder="transfer_request"
              class="form-input"
            />
            <p class="form-help-text">
              Classification label that triggers this action
            </p>
          </div>

          <div class="form-group">
            <label class="form-label">
              Override Classifier ID <span class="text-gray-500">(optional)</span>
            </label>
            <select
              v-model="form.overrideClassifierId"
              class="form-select-auto"
            >
              <option value="">No override (use stage classifiers)</option>
              <option v-for="classifier in projectClassifiers" :key="classifier.id" :value="classifier.id">
                {{ classifier.name }}
              </option>
            </select>
            <p class="form-help-text">
              Override the stage classifier for this action
            </p>
          </div>

          <div class="form-group">
            <label class="form-label">
              Condition <span class="text-gray-500">(optional)</span>
            </label>
            <input
              v-model="form.condition"
              type="text"
              placeholder="context.variables.agent_available === true"
              class="form-input font-mono text-sm"
            />
            <p class="form-help-text">
              Optional JavaScript condition expression for action activation
            </p>
          </div>
        </div>

        <!-- Parameters Tab -->
        <div v-show="activeTab === 'parameters'" class="space-y-6">
          <div class="form-group">
            <label class="form-label">Action Parameters</label>
            <p class="form-help-text mb-3">
              Define parameters that will be extracted from user input when this action is triggered.
            </p>
            <div class="space-y-4">
              <div
                v-for="(param, index) in parameters"
                :key="index"
                class="p-4 border border-gray-200 rounded-lg space-y-3"
              >
                <div class="flex justify-between items-center">
                  <span class="text-sm font-medium text-gray-700">Parameter {{ index + 1 }}</span>
                  <button
                    type="button"
                    @click="removeParameter(index)"
                    class="text-red-600 hover:text-red-700 text-sm"
                  >
                    Remove
                  </button>
                </div>
                
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="form-label text-sm">Parameter Name <span class="required">*</span></label>
                    <input
                      v-model="param.name"
                      type="text"
                      required
                      placeholder="destination_stage"
                      class="form-input font-mono text-sm"
                    />
                  </div>

                  <div>
                    <label class="form-label text-sm">Type <span class="required">*</span></label>
                    <select v-model="param.type" class="form-select-auto text-sm" required>
                      <option value="string">string</option>
                      <option value="number">number</option>
                      <option value="boolean">boolean</option>
                      <option value="string[]">string[]</option>
                      <option value="number[]">number[]</option>
                      <option value="boolean[]">boolean[]</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label class="form-label text-sm">Description <span class="required">*</span></label>
                  <input
                    v-model="param.description"
                    type="text"
                    required
                    placeholder="The stage to transfer to"
                    class="form-input text-sm"
                  />
                  <p class="text-xs text-gray-500 mt-1">
                    Describe what this parameter represents to help with extraction
                  </p>
                </div>

                <div>
                  <label class="flex items-center cursor-pointer">
                    <input
                      v-model="param.required"
                      type="checkbox"
                      class="form-checkbox"
                    />
                    <span class="ml-2 text-sm font-medium text-gray-700">
                      Required parameter
                    </span>
                  </label>
                  <p class="text-xs text-gray-500 ml-6">
                    Whether this parameter must be extracted from user input
                  </p>
                </div>
              </div>

              <button
                type="button"
                @click="addParameter"
                class="btn-secondary w-full"
              >
                + Add Parameter
              </button>
            </div>
          </div>
        </div>

        <!-- Effects Tab -->
        <div v-show="activeTab === 'effects'" class="space-y-6">
          <div class="form-group">
            <label class="form-label">Select Effects</label>
            <p class="form-help-text mb-3">
              Choose which effects this action should perform. Complex effects will add dedicated tabs for configuration.
            </p>
            <div class="space-y-3">
              <label class="flex items-start cursor-pointer">
                <input
                  v-model="operations.endConversation.enabled"
                  type="checkbox"
                  class="form-checkbox mt-0.5"
                />
                <div class="ml-3">
                  <span class="text-sm font-medium text-gray-700">End Conversation</span>
                  <p class="text-xs text-gray-500">Gracefully end the conversation</p>
                </div>
              </label>

              <label class="flex items-start cursor-pointer">
                <input
                  v-model="operations.abortConversation.enabled"
                  type="checkbox"
                  class="form-checkbox mt-0.5"
                />
                <div class="ml-3">
                  <span class="text-sm font-medium text-gray-700">Abort Conversation</span>
                  <p class="text-xs text-gray-500">Immediately terminate the conversation</p>
                </div>
              </label>

              <label class="flex items-start cursor-pointer">
                <input
                  v-model="operations.goToStage.enabled"
                  type="checkbox"
                  class="form-checkbox mt-0.5"
                />
                <div class="ml-3">
                  <span class="text-sm font-medium text-gray-700">Go To Stage</span>
                  <p class="text-xs text-gray-500">Navigate to a different stage (adds tab for configuration)</p>
                </div>
              </label>

              <label class="flex items-start cursor-pointer">
                <input
                  v-model="operations.runScript.enabled"
                  type="checkbox"
                  class="form-checkbox mt-0.5"
                />
                <div class="ml-3">
                  <span class="text-sm font-medium text-gray-700">Run Script</span>
                  <p class="text-xs text-gray-500">Execute custom JavaScript code (adds tab for configuration)</p>
                </div>
              </label>

              <label class="flex items-start cursor-pointer">
                <input
                  v-model="operations.modifyUserInput.enabled"
                  type="checkbox"
                  class="form-checkbox mt-0.5"
                />
                <div class="ml-3">
                  <span class="text-sm font-medium text-gray-700">Modify User Input</span>
                  <p class="text-xs text-gray-500">Transform the user's input before processing (adds tab for configuration)</p>
                </div>
              </label>

              <label class="flex items-start cursor-pointer">
                <input
                  v-model="operations.modifyVariables.enabled"
                  type="checkbox"
                  class="form-checkbox mt-0.5"
                />
                <div class="ml-3">
                  <span class="text-sm font-medium text-gray-700">Modify Variables</span>
                  <p class="text-xs text-gray-500">Set, update, or remove conversation variables (adds tab for configuration)</p>
                </div>
              </label>

              <label class="flex items-start cursor-pointer">
                <input
                  v-model="operations.modifyUserProfile.enabled"
                  type="checkbox"
                  class="form-checkbox mt-0.5"
                />
                <div class="ml-3">
                  <span class="text-sm font-medium text-gray-700">Modify User Profile</span>
                  <p class="text-xs text-gray-500">Update user profile fields (adds tab for configuration)</p>
                </div>
              </label>

              <label class="flex items-start cursor-pointer">
                <input
                  v-model="operations.callTool.enabled"
                  type="checkbox"
                  class="form-checkbox mt-0.5"
                />
                <div class="ml-3">
                  <span class="text-sm font-medium text-gray-700">Call Tool</span>
                  <p class="text-xs text-gray-500">Invoke a registered tool (adds tab for configuration)</p>
                </div>
              </label>

              <label class="flex items-start cursor-pointer">
                <input
                  v-model="operations.callWebhook.enabled"
                  type="checkbox"
                  class="form-checkbox mt-0.5"
                />
                <div class="ml-3">
                  <span class="text-sm font-medium text-gray-700">Call Webhook</span>
                  <p class="text-xs text-gray-500">Make an HTTP request to an external endpoint (adds tab for configuration)</p>
                </div>
              </label>
            </div>
          </div>
        </div>

        <!-- Go To Stage Tab -->
        <div v-show="activeTab === 'goToStage'" class="space-y-6">
          <div class="form-group">
            <label class="form-label">
              Target Stage ID <span class="required">*</span>
            </label>
            <input
              v-model="operations.goToStage.stageId"
              type="text"
              :required="operations.goToStage.enabled"
              placeholder="stage_abc123"
              class="form-input font-mono"
            />
            <p class="form-help-text">
              The ID of the stage to navigate to
            </p>
          </div>

          <div class="form-group">
            <label class="form-label">
              Reason <span class="text-gray-500">(optional)</span>
            </label>
            <input
              v-model="operations.goToStage.reason"
              type="text"
              placeholder="User requested transfer to billing"
              class="form-input"
            />
            <p class="form-help-text">
              Optional reason for the stage transition
            </p>
          </div>
        </div>

        <!-- Run Script Tab -->
        <div v-show="activeTab === 'runScript'" class="space-y-6">
          <div class="form-group">
            <label class="form-label">
              JavaScript Code <span class="required">*</span>
            </label>
            <textarea
              v-model="operations.runScript.code"
              rows="10"
              :required="operations.runScript.enabled"
              class="form-textarea font-mono text-sm"
              placeholder="// Available: context, user, conversation&#10;const result = context.variables.count + 1;&#10;return { count: result };"
            ></textarea>
            <p class="form-help-text">
              JavaScript code to execute. Available objects: context, user, conversation
            </p>
          </div>

          <div class="form-group">
            <label class="form-label">
              Result Key <span class="text-gray-500">(optional)</span>
            </label>
            <input
              v-model="operations.runScript.resultKey"
              type="text"
              placeholder="scriptResult"
              class="form-input font-mono"
            />
            <p class="form-help-text">
              Variable name to store the script result
            </p>
          </div>
        </div>

        <!-- Modify User Input Tab -->
        <div v-show="activeTab === 'modifyUserInput'" class="space-y-6">
          <div class="form-group">
            <label class="form-label">
              Template <span class="required">*</span>
            </label>
            <textarea
              v-model="operations.modifyUserInput.template"
              rows="4"
              :required="operations.modifyUserInput.enabled"
              class="form-textarea"
              placeholder="User wants to {{user.input}}"
            ></textarea>
            <p class="form-help-text">
              Template to transform the user input. Use <code>&#123;&#123;user.input&#125;&#125;</code> to reference original input
            </p>
          </div>
        </div>

        <!-- Modify Variables Tab -->
        <div v-show="activeTab === 'modifyVariables'" class="space-y-6">
          <div class="form-group">
            <label class="form-label">Variable Modifications</label>
            <div class="space-y-4">
              <div
                v-for="(mod, index) in operations.modifyVariables.modifications"
                :key="index"
                class="p-4 border border-gray-200 rounded-lg space-y-3"
              >
                <div class="flex justify-between items-center">
                  <span class="text-sm font-medium text-gray-700">Modification {{ index + 1 }}</span>
                  <button
                    type="button"
                    @click="removeVariableModification(index)"
                    class="text-red-600 hover:text-red-700 text-sm"
                  >
                    Remove
                  </button>
                </div>
                
                <div>
                  <label class="form-label text-sm">Variable Name</label>
                  <input
                    v-model="mod.variableName"
                    type="text"
                    placeholder="cart_total"
                    class="form-input font-mono text-sm"
                  />
                </div>

                <div>
                  <label class="form-label text-sm">Operation</label>
                  <select v-model="mod.operation" class="form-select-auto text-sm">
                    <option value="set">Set</option>
                    <option value="reset">Reset</option>
                    <option value="add">Add</option>
                    <option value="remove">Remove</option>
                  </select>
                </div>

                <div v-if="mod.operation !== 'reset'">
                  <label class="form-label text-sm">Value</label>
                  <input
                    v-model="mod.value"
                    type="text"
                    placeholder="42"
                    class="form-input text-sm"
                  />
                </div>
              </div>

              <button
                type="button"
                @click="addVariableModification"
                class="btn-secondary w-full"
              >
                + Add Modification
              </button>
            </div>
          </div>
        </div>

        <!-- Modify User Profile Tab -->
        <div v-show="activeTab === 'modifyUserProfile'" class="space-y-6">
          <div class="form-group">
            <label class="form-label">Profile Modifications</label>
            <div class="space-y-4">
              <div
                v-for="(mod, index) in operations.modifyUserProfile.modifications"
                :key="index"
                class="p-4 border border-gray-200 rounded-lg space-y-3"
              >
                <div class="flex justify-between items-center">
                  <span class="text-sm font-medium text-gray-700">Modification {{ index + 1 }}</span>
                  <button
                    type="button"
                    @click="removeProfileModification(index)"
                    class="text-red-600 hover:text-red-700 text-sm"
                  >
                    Remove
                  </button>
                </div>
                
                <div>
                  <label class="form-label text-sm">Field Name</label>
                  <input
                    v-model="mod.fieldName"
                    type="text"
                    placeholder="email"
                    class="form-input font-mono text-sm"
                  />
                </div>

                <div>
                  <label class="form-label text-sm">Operation</label>
                  <select v-model="mod.operation" class="form-select-auto text-sm">
                    <option value="set">Set</option>
                    <option value="reset">Reset</option>
                    <option value="add">Add</option>
                    <option value="remove">Remove</option>
                  </select>
                </div>

                <div v-if="mod.operation !== 'reset'">
                  <label class="form-label text-sm">Value</label>
                  <input
                    v-model="mod.value"
                    type="text"
                    placeholder="user@example.com"
                    class="form-input text-sm"
                  />
                </div>
              </div>

              <button
                type="button"
                @click="addProfileModification"
                class="btn-secondary w-full"
              >
                + Add Modification
              </button>
            </div>
          </div>
        </div>

        <!-- Call Tool Tab -->
        <div v-show="activeTab === 'callTool'" class="space-y-6">
          <div class="form-group">
            <label class="form-label">
              Tool ID <span class="required">*</span>
            </label>
            <input
              v-model="operations.callTool.toolId"
              type="text"
              :required="operations.callTool.enabled"
              placeholder="tool_abc123"
              class="form-input font-mono"
            />
            <p class="form-help-text">
              The ID of the tool to invoke
            </p>
          </div>

          <div class="form-group">
            <label class="form-label">
              Parameters <span class="text-gray-500">(optional, JSON)</span>
            </label>
            <textarea
              v-model="operations.callTool.parameters"
              rows="6"
              class="form-textarea font-mono text-sm"
              placeholder='{\n  "query": "{{user.input}}",\n  "limit": 10\n}'
            ></textarea>
            <p class="form-help-text">
              JSON object with tool parameters. Supports template variables.
            </p>
          </div>

          <div class="form-group">
            <label class="form-label">
              Result Key <span class="text-gray-500">(optional)</span>
            </label>
            <input
              v-model="operations.callTool.resultKey"
              type="text"
              placeholder="toolResult"
              class="form-input font-mono"
            />
            <p class="form-help-text">
              Variable name to store the tool result
            </p>
          </div>
        </div>

        <!-- Call Webhook Tab -->
        <div v-show="activeTab === 'callWebhook'" class="space-y-6">
          <div class="form-group">
            <label class="form-label">
              URL <span class="required">*</span>
            </label>
            <input
              v-model="operations.callWebhook.url"
              type="url"
              :required="operations.callWebhook.enabled"
              placeholder="https://api.example.com/webhook"
              class="form-input font-mono"
            />
            <p class="form-help-text">
              The webhook endpoint URL
            </p>
          </div>

          <div class="form-group">
            <label class="form-label">
              HTTP Method <span class="required">*</span>
            </label>
            <select v-model="operations.callWebhook.method" class="form-select-auto" :required="operations.callWebhook.enabled">
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="PATCH">PATCH</option>
              <option value="DELETE">DELETE</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">
              Headers <span class="text-gray-500">(optional, JSON)</span>
            </label>
            <textarea
              v-model="operations.callWebhook.headers"
              rows="4"
              class="form-textarea font-mono text-sm"
              placeholder='{\n  "Content-Type": "application/json",\n  "Authorization": "Bearer token"\n}'
            ></textarea>
            <p class="form-help-text">
              JSON object with HTTP headers
            </p>
          </div>

          <div class="form-group">
            <label class="form-label">
              Body <span class="text-gray-500">(optional, JSON)</span>
            </label>
            <textarea
              v-model="operations.callWebhook.body"
              rows="6"
              class="form-textarea font-mono text-sm"
              placeholder='{\n  "userId": "{{user.id}}",\n  "message": "{{user.input}}"\n}'
            ></textarea>
            <p class="form-help-text">
              JSON body for the request. Supports template variables.
            </p>
          </div>

          <div class="form-group">
            <label class="form-label">
              Result Key <span class="text-gray-500">(optional)</span>
            </label>
            <input
              v-model="operations.callWebhook.resultKey"
              type="text"
              placeholder="webhookResult"
              class="form-input font-mono"
            />
            <p class="form-help-text">
              Variable name to store the webhook response
            </p>
          </div>
        </div>
        </div>

        <div class="modal-footer border-t border-gray-200 mt-auto pt-4">
          <button type="button" @click="$emit('close')" class="btn-secondary">
            Cancel
          </button>
          <button type="submit" class="btn-primary">
            {{ editingKey ? 'Save Changes' : 'Create Action' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useClassifiersStore } from '@/stores'
import type { StageAction, Effect } from '@/api/types'

const route = useRoute()
const classifiersStore = useClassifiersStore()

const props = defineProps<{
  action: StageAction | null
  editingKey: string | null
}>()

const projectClassifiers = computed(() => {
  const projectId = route.params.projectId as string
  return classifiersStore.items.filter(c => c.projectId === projectId)
})

const emit = defineEmits<{
  close: []
  save: [data: { key: string; action: StageAction }]
}>()

type TabType = 'basic' | 'trigger' | 'parameters' | 'effects' | 'goToStage' | 'runScript' | 'modifyUserInput' | 'modifyVariables' | 'modifyUserProfile' | 'callTool' | 'callWebhook'

const activeTab = ref<TabType>('basic')

const form = ref({
  key: '',
  name: '',
  condition: '',
  triggerOnUserInput: true,
  triggerOnClientCommand: false,
  classificationTrigger: '',
  overrideClassifierId: '',
  template: '',
  examples: ''
})

const operations = ref({
  endConversation: {
    enabled: false,
    reason: ''
  },
  abortConversation: {
    enabled: false,
    reason: ''
  },
  goToStage: {
    enabled: false,
    stageId: '',
    reason: ''
  },
  runScript: {
    enabled: false,
    code: '',
    resultKey: ''
  },
  modifyUserInput: {
    enabled: false,
    template: ''
  },
  modifyVariables: {
    enabled: false,
    modifications: [] as Array<{
      variableName?: string
      operation: 'set' | 'reset' | 'add' | 'remove'
      value?: any
    }>
  },
  modifyUserProfile: {
    enabled: false,
    modifications: [] as Array<{
      fieldName?: string
      operation: 'set' | 'reset' | 'add' | 'remove'
      value?: any
    }>
  },
  callTool: {
    enabled: false,
    toolId: '',
    parameters: '',
    resultKey: ''
  },
  callWebhook: {
    enabled: false,
    url: '',
    method: 'POST' as 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    headers: '',
    body: '',
    resultKey: ''
  }
})

const parameters = ref<Array<{
  name: string
  type: 'string' | 'number' | 'boolean' | 'string[]' | 'number[]' | 'boolean[]'
  description: string
  required: boolean
}>>([])

function addParameter() {
  parameters.value.push({
    name: '',
    type: 'string',
    description: '',
    required: false
  })
}

function removeParameter(index: number) {
  parameters.value.splice(index, 1)
}

function addVariableModification() {
  operations.value.modifyVariables.modifications.push({
    variableName: '',
    operation: 'set',
    value: ''
  })
}

function removeVariableModification(index: number) {
  operations.value.modifyVariables.modifications.splice(index, 1)
}

function addProfileModification() {
  operations.value.modifyUserProfile.modifications.push({
    fieldName: '',
    operation: 'set',
    value: ''
  })
}

function removeProfileModification(index: number) {
  operations.value.modifyUserProfile.modifications.splice(index, 1)
}

// Initialize form when action prop changes
watch(() => props.action, (action) => {
  if (action && props.editingKey) {
    form.value = {
      key: props.editingKey,
      name: action.name,
      condition: action.condition || '',
      triggerOnUserInput: action.triggerOnUserInput,
      triggerOnClientCommand: action.triggerOnClientCommand,
      classificationTrigger: action.classificationTrigger || '',
      overrideClassifierId: action.overrideClassifierId || '',
      template: action.template || '',
      examples: action.examples?.join('\n') || ''
    }

    // Load parameters from action
    parameters.value = action.parameters ? [...action.parameters] : []

    // Load effects from action
    const effects = action.effects || []
    
    // Reset all effects
    operations.value.endConversation.enabled = false
    operations.value.abortConversation.enabled = false
    operations.value.goToStage.enabled = false
    operations.value.runScript.enabled = false
    operations.value.modifyUserInput.enabled = false
    operations.value.modifyVariables.enabled = false
    operations.value.modifyUserProfile.enabled = false
    operations.value.callTool.enabled = false
    operations.value.callWebhook.enabled = false

    // Load existing effects
    effects.forEach(effect => {
      switch (effect.type) {
        case 'end_conversation':
          operations.value.endConversation.enabled = true
          operations.value.endConversation.reason = effect.reason || ''
          break
        case 'abort_conversation':
          operations.value.abortConversation.enabled = true
          operations.value.abortConversation.reason = effect.reason || ''
          break
        case 'go_to_stage':
          operations.value.goToStage.enabled = true
          if ('stageId' in effect) {
            operations.value.goToStage.stageId = effect.stageId || ''
          }
          break
        case 'run_script':
          operations.value.runScript.enabled = true
          if ('code' in effect) {
            operations.value.runScript.code = effect.code || ''
          }
          break
        case 'modify_user_input':
          operations.value.modifyUserInput.enabled = true
          operations.value.modifyUserInput.template = effect.template || ''
          break
        case 'modify_variables':
          operations.value.modifyVariables.enabled = true
          operations.value.modifyVariables.modifications = effect.modifications || []
          break
        case 'modify_user_profile':
          operations.value.modifyUserProfile.enabled = true
          operations.value.modifyUserProfile.modifications = effect.modifications || []
          break
        case 'call_tool':
          operations.value.callTool.enabled = true
          if ('toolId' in effect) {
            operations.value.callTool.toolId = effect.toolId || ''
          }
          if ('parameters' in effect) {
            operations.value.callTool.parameters = effect.parameters ? JSON.stringify(effect.parameters, null, 2) : ''
          }
          break
        case 'call_webhook':
          operations.value.callWebhook.enabled = true
          operations.value.callWebhook.url = effect.url || ''
          operations.value.callWebhook.method = effect.method || 'POST'
          operations.value.callWebhook.headers = effect.headers ? JSON.stringify(effect.headers, null, 2) : ''
          operations.value.callWebhook.body = effect.body ? JSON.stringify(effect.body, null, 2) : ''
          operations.value.callWebhook.resultKey = effect.resultKey || ''
          break
      }
    })
  } else {
    // Reset form for new action
    form.value = {
      key: '',
      name: '',
      condition: '',
      triggerOnUserInput: true,
      triggerOnClientCommand: false,
      classificationTrigger: '',
      overrideClassifierId: '',
      template: '',
      examples: ''
    }

    // Reset parameters
    parameters.value = []

    // Reset all effects
    operations.value.endConversation = { enabled: false, reason: '' }
    operations.value.abortConversation = { enabled: false, reason: '' }
    operations.value.goToStage = { enabled: false, stageId: '', reason: '' }
    operations.value.runScript = { enabled: false, code: '', resultKey: '' }
    operations.value.modifyUserInput = { enabled: false, template: '' }
    operations.value.modifyVariables = { enabled: false, modifications: [] }
    operations.value.modifyUserProfile = { enabled: false, modifications: [] }
    operations.value.callTool = { enabled: false, toolId: '', parameters: '', resultKey: '' }
    operations.value.callWebhook = { enabled: false, url: '', method: 'POST', headers: '', body: '', resultKey: '' }
  }
}, { immediate: true })

function handleSubmit() {
  if (!form.value.key || !form.value.name) {
    return
  }

  // Build effects array from enabled effects
  const effectsArray: Effect[] = []

  if (operations.value.endConversation.enabled) {
    effectsArray.push({
      type: 'end_conversation',
      reason: operations.value.endConversation.reason || undefined
    })
  }

  if (operations.value.abortConversation.enabled) {
    effectsArray.push({
      type: 'abort_conversation',
      reason: operations.value.abortConversation.reason || undefined
    })
  }

  if (operations.value.goToStage.enabled) {
    effectsArray.push({
      type: 'go_to_stage',
      stageId: operations.value.goToStage.stageId
    })
  }

  if (operations.value.runScript.enabled) {
    effectsArray.push({
      type: 'run_script',
      code: operations.value.runScript.code
    })
  }

  if (operations.value.modifyUserInput.enabled) {
    effectsArray.push({
      type: 'modify_user_input',
      template: operations.value.modifyUserInput.template
    })
  }

  if (operations.value.modifyVariables.enabled) {
    const mods = operations.value.modifyVariables.modifications
      .filter(m => m.variableName)
      .map(m => ({
        variableName: m.variableName!,
        operation: m.operation,
        value: m.value
      }))
    effectsArray.push({
      type: 'modify_variables',
      modifications: mods
    })
  }

  if (operations.value.modifyUserProfile.enabled) {
    const mods = operations.value.modifyUserProfile.modifications
      .filter(m => m.fieldName)
      .map(m => ({
        fieldName: m.fieldName!,
        operation: m.operation,
        value: m.value
      }))
    effectsArray.push({
      type: 'modify_user_profile',
      modifications: mods
    })
  }

  if (operations.value.callTool.enabled) {
    let params: Record<string, any>
    try {
      params = operations.value.callTool.parameters ? JSON.parse(operations.value.callTool.parameters) : {}
    } catch (e) {
      alert('Invalid JSON in tool parameters')
      return
    }

    effectsArray.push({
      type: 'call_tool',
      toolId: operations.value.callTool.toolId,
      parameters: params
    })
  }

  if (operations.value.callWebhook.enabled) {
    let headers: Record<string, string> | undefined
    let body: any | undefined

    try {
      headers = operations.value.callWebhook.headers ? JSON.parse(operations.value.callWebhook.headers) : undefined
    } catch (e) {
      alert('Invalid JSON in webhook headers')
      return
    }

    try {
      body = operations.value.callWebhook.body ? JSON.parse(operations.value.callWebhook.body) : undefined
    } catch (e) {
      alert('Invalid JSON in webhook body')
      return
    }

    effectsArray.push({
      type: 'call_webhook',
      url: operations.value.callWebhook.url,
      method: operations.value.callWebhook.method,
      headers,
      body,
      resultKey: operations.value.callWebhook.resultKey
    })
  }

  const action: StageAction = {
    name: form.value.name,
    condition: form.value.condition || null,
    triggerOnUserInput: form.value.triggerOnUserInput,
    triggerOnClientCommand: form.value.triggerOnClientCommand,
    classificationTrigger: form.value.classificationTrigger || null,
    overrideClassifierId: form.value.overrideClassifierId || null,
    parameters: parameters.value.length > 0 ? parameters.value : [],
    effects: effectsArray,
    template: form.value.template || null,
    examples: form.value.examples ? form.value.examples.split('\n').filter(e => e.trim()) : null,
    metadata: props.action?.metadata || undefined
  }

  emit('save', { key: form.value.key, action })
}
</script>

<style scoped>
.max-w-6xl {
  max-width: 72rem;
}

.fixed-height-modal {
  height: 90vh;
  max-height: 1200px;
  display: flex;
  flex-direction: column;
}
</style>
