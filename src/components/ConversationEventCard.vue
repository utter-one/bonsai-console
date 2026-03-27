<script setup lang="ts">
import { ref } from 'vue'
import type { NormalizedEvent } from './events/eventHelpers'
import { isTopLevelEvent, getEventTypeColor } from './events/eventHelpers'
import EventMessageCard from './events/EventMessageCard.vue'
import EventClassificationCard from './events/EventClassificationCard.vue'
import EventTransformationCard from './events/EventTransformationCard.vue'
import EventExecutionPlanCard from './events/EventExecutionPlanCard.vue'
import EventActionCard from './events/EventActionCard.vue'
import EventCommandCard from './events/EventCommandCard.vue'
import EventToolCallCard from './events/EventToolCallCard.vue'
import EventConversationStartCard from './events/EventConversationStartCard.vue'
import EventConversationResumeCard from './events/EventConversationResumeCard.vue'
import EventConversationEndCard from './events/EventConversationEndCard.vue'
import EventConversationAbortedCard from './events/EventConversationAbortedCard.vue'
import EventConversationFailedCard from './events/EventConversationFailedCard.vue'
import EventJumpToStageCard from './events/EventJumpToStageCard.vue'
import EventModerationCard from './events/EventModerationCard.vue'
import EventVariablesUpdatedCard from './events/EventVariablesUpdatedCard.vue'
import EventUserProfileUpdatedCard from './events/EventUserProfileUpdatedCard.vue'
import EventUserInputModifiedCard from './events/EventUserInputModifiedCard.vue'
import EventUserBannedCard from './events/EventUserBannedCard.vue'
import EventVisibilityChangedCard from './events/EventVisibilityChangedCard.vue'
import EventGenericCard from './events/EventGenericCard.vue'

const props = defineProps<{
  event: NormalizedEvent
  showBugReport?: boolean
  highlighted?: boolean
  /** Optional ID-to-name lookup maps for resolving stage/classifier/transformer IDs */
  entityNames?: {
    stages?: Record<string, string>
    classifiers?: Record<string, string>
    transformers?: Record<string, string>
  }
}>()

const emit = defineEmits<{
  (e: 'open-prompt', prompt: string): void
  (e: 'open-filler-prompt', prompt: string): void
  (e: 'open-raw-response', rawResponse: string): void
  (e: 'open-variables', variables: Record<string, any>): void
  (e: 'open-bug-report', event: NormalizedEvent): void
}>()

const hasHovered = ref(false)

function onHighlightMouseEnter() {
  if (props.highlighted && !hasHovered.value) {
    hasHovered.value = true
  }
}

const forwardAll = {
  'open-prompt': (p: string) => emit('open-prompt', p),
  'open-filler-prompt': (p: string) => emit('open-filler-prompt', p),
  'open-raw-response': (p: string) => emit('open-raw-response', p),
  'open-variables': (v: Record<string, any>) => emit('open-variables', v),
  'open-bug-report': (e: NormalizedEvent) => emit('open-bug-report', e),
}

const forwardBugReport = {
  'open-bug-report': (e: NormalizedEvent) => emit('open-bug-report', e),
}

</script>

<template>
  <div
    class="border rounded-lg p-1 shadow-sm transition-shadow hover:shadow-md"
    :class="[
      getEventTypeColor(event.eventType),
      { 'ml-8': !isTopLevelEvent(event) },
      { 'highlight-pulse': highlighted && !hasHovered },
      { 'highlight-finish': highlighted && hasHovered }
    ]"
    @mouseenter="onHighlightMouseEnter"
  >
    <EventMessageCard
      v-if="event.eventType === 'message'"
      :event="event"
      :show-bug-report="showBugReport"
      v-on="forwardAll"
    />

    <EventClassificationCard v-else-if="event.eventType === 'classification'" :event="event" :show-bug-report="showBugReport" :entity-names="entityNames" v-on="forwardAll" />

    <EventTransformationCard v-else-if="event.eventType === 'transformation'" :event="event" :show-bug-report="showBugReport" :entity-names="entityNames" v-on="forwardAll" />

    <EventExecutionPlanCard v-else-if="event.eventType === 'execution_plan'" :event="event" :show-bug-report="showBugReport" :entity-names="entityNames" v-on="forwardBugReport" />

    <EventActionCard v-else-if="event.eventType === 'action'" :event="event" :show-bug-report="showBugReport" :entity-names="entityNames" v-on="forwardAll" />

    <EventCommandCard v-else-if="event.eventType === 'command'" :event="event" :show-bug-report="showBugReport" v-on="forwardAll" />

    <EventToolCallCard v-else-if="event.eventType === 'tool_call'" :event="event" :show-bug-report="showBugReport" v-on="forwardAll" />

    <EventConversationStartCard v-else-if="event.eventType === 'conversation_start'" :event="event" :show-bug-report="showBugReport" :entity-names="entityNames" v-on="forwardAll" />

    <EventConversationResumeCard v-else-if="event.eventType === 'conversation_resume'" :event="event" :entity-names="entityNames" />

    <EventConversationEndCard v-else-if="event.eventType === 'conversation_end'" :event="event" :entity-names="entityNames" />

    <EventConversationAbortedCard v-else-if="event.eventType === 'conversation_aborted'" :event="event" :entity-names="entityNames" />

    <EventConversationFailedCard v-else-if="event.eventType === 'conversation_failed'" :event="event" :entity-names="entityNames" />

    <EventJumpToStageCard v-else-if="event.eventType === 'jump_to_stage'" :event="event" :entity-names="entityNames" />

    <EventModerationCard v-else-if="event.eventType === 'moderation'" :event="event" />

    <EventVariablesUpdatedCard v-else-if="event.eventType === 'variables_updated'" :event="event" />

    <EventUserProfileUpdatedCard v-else-if="event.eventType === 'user_profile_updated'" :event="event" />

    <EventUserInputModifiedCard v-else-if="event.eventType === 'user_input_modified'" :event="event" />

    <EventUserBannedCard v-else-if="event.eventType === 'user_banned'" :event="event" />

    <EventVisibilityChangedCard v-else-if="event.eventType === 'visibility_changed'" :event="event" />

    <EventGenericCard v-else :event="event" />
  </div>
</template>

<style scoped>
:deep(details) summary::-webkit-details-marker {
  display: none;
}

:deep(details) summary::marker {
  display: none;
}

:deep(details[open]) summary {
  margin-bottom: 0.5rem;
}

@keyframes highlight-infinite {
  0%, 100% {
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.65);
    outline: 2px solid rgba(59, 130, 246, 0.65);
    outline-offset: 2px;
  }
  50% {
    box-shadow: 0 0 0 6px rgba(59, 130, 246, 0.08);
    outline: 2px solid rgba(59, 130, 246, 0.15);
    outline-offset: 4px;
  }
}

@keyframes highlight-finish {
  0%, 60% {
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.65);
    outline: 2px solid rgba(59, 130, 246, 0.65);
    outline-offset: 2px;
  }
  100% {
    box-shadow: 0 0 0 0 transparent;
    outline: 2px solid transparent;
    outline-offset: 2px;
  }
}

.highlight-pulse {
  animation: highlight-infinite 1.5s ease-in-out infinite;
}

.highlight-finish {
  animation: highlight-finish 5s ease-out forwards;
}
</style>
