# ConversationEventCards — split ConversationEventCard

## What

Replace the single monolithic `ConversationEventCard.vue` (~600 lines, 13 `v-else-if`
branches) with a family of focused per-event-type card components and a thin dispatcher
component.

## Why

`ConversationEventCard.vue` handles 13 distinct event types, each with 80–180 lines of
unique rendering logic: different fields, different icons, different expandable sections.
The file is a linear chain of `v-else-if` branches that is hard to navigate and even
harder to modify safely — a change to one event type's layout risks accidentally
affecting adjacent branches.

Splitting into per-type components allows each event type to be worked on in isolation,
makes the type-specific logic trivially findable, and allows the dispatcher to be
a sub-10-line routing component.

## Source

`src/components/ConversationEventCard.vue`

## New files

```
src/components/events/
  ConversationEventCard.vue        ← new thin dispatcher (replaces original)
  EventMessageCard.vue
  EventClassificationCard.vue
  EventTransformationCard.vue
  EventActionCard.vue
  EventCommandCard.vue
  EventToolCallCard.vue
  EventConversationStartCard.vue
  EventConversationResumeCard.vue
  EventConversationEndCard.vue
  EventConversationAbortedCard.vue
  EventConversationFailedCard.vue
  EventJumpToStageCard.vue
  EventModerationCard.vue
```

The original `src/components/ConversationEventCard.vue` is either deleted and import
paths updated everywhere, or it becomes a re-export of
`src/components/events/ConversationEventCard.vue` to avoid changing import paths.

## Dispatcher component

`src/components/events/ConversationEventCard.vue`:

```vue
<template>
  <component
    :is="resolvedComponent"
    v-if="resolvedComponent"
    :event="event"
    v-bind="$attrs"
  />
  <div v-else class="event-card event-card-unknown">
    Unknown event type: {{ event.type }}
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { NormalizedConversationEvent } from '@/types/api'
import EventMessageCard from './EventMessageCard.vue'
import EventClassificationCard from './EventClassificationCard.vue'
// ... all 13 imports

const props = defineProps<{ event: NormalizedConversationEvent }>()

const componentMap = {
  message: EventMessageCard,
  classification: EventClassificationCard,
  transformation: EventTransformationCard,
  action: EventActionCard,
  command: EventCommandCard,
  tool_call: EventToolCallCard,
  conversation_start: EventConversationStartCard,
  conversation_resume: EventConversationResumeCard,
  conversation_end: EventConversationEndCard,
  conversation_aborted: EventConversationAbortedCard,
  conversation_failed: EventConversationFailedCard,
  jump_to_stage: EventJumpToStageCard,
  moderation: EventModerationCard,
} as const

const resolvedComponent = computed(
  () => componentMap[props.event.type as keyof typeof componentMap] ?? null
)
</script>
```

## Per-type card interface

Each card component receives a single typed prop:

```typescript
// EventMessageCard.vue
defineProps<{ event: MessageConversationEvent }>()

// EventClassificationCard.vue
defineProps<{ event: ClassificationConversationEvent }>()

// ... etc.
```

Each card is responsible for:
- Its own layout (header, body, expandable detail section)
- Type-specific field rendering (timestamps, content, scores, etc.)
- Its own icon selection

Type guard functions (`isMessageEvent`, `isClassificationEvent`, etc.) that currently
live in `ConversationEventCard.vue` move to a shared utility file:
`src/utils/conversationEventTypeGuards.ts`.

## Event types and approximate block sizes

| Component | Event type | Approx. lines in original |
|-----------|-----------|--------------------------|
| `EventMessageCard` | `message` | ~150 |
| `EventClassificationCard` | `classification` | ~180 |
| `EventTransformationCard` | `transformation` | ~120 |
| `EventActionCard` | `action` | ~130 |
| `EventCommandCard` | `command` | ~110 |
| `EventToolCallCard` | `tool_call` | ~180 |
| `EventConversationStartCard` | `conversation_start` | ~100 |
| `EventConversationResumeCard` | `conversation_resume` | ~100 |
| `EventConversationEndCard` | `conversation_end` | ~80 |
| `EventConversationAbortedCard` | `conversation_aborted` | ~80 |
| `EventConversationFailedCard` | `conversation_failed` | ~80 |
| `EventJumpToStageCard` | `jump_to_stage` | ~80 |
| `EventModerationCard` | `moderation` | ~120 |

## Implementation steps

1. Create `src/utils/conversationEventTypeGuards.ts` — move all type guard functions
   from `ConversationEventCard.vue`.
2. Create `src/components/events/` directory.
3. For each event type, create the corresponding card component by extracting the
   matching `v-if`/`v-else-if` block from the original file.
4. Create the dispatcher `ConversationEventCard.vue` in `src/components/events/`.
5. Update `src/components/ConversationEventCard.vue` to re-export from the new path
   (or update all import sites directly).
6. Delete the original large component once all imports are resolved.

## Acceptance criteria

- All 13 event types render identically to the original.
- The fallback "unknown event type" case still renders (does not throw).
- The original `ConversationEventCard.vue` public API (single `event` prop) is unchanged.
- The conversation detail view displays events correctly.
- No TypeScript errors introduced.
