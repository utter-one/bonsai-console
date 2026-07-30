# Deferred Processing

The **Deferred Processing** view shows incoming messages that are queued for delayed processing. When a channel has processing delays configured (e.g., to avoid triggering rate limits), incoming messages are held in this queue until their scheduled processing time arrives.

## What You'll See

Each entry in the queue shows:

| Field | Description |
|---|---|
| **Created** | When the entry was queued |
| **Status** | Current state: `pending`, `processed`, `failed`, or `cancelled` |
| **Channel** | Which channel provider received the original message |
| **Conversation** | Associated conversation ID (if any) |
| **Process At** | Scheduled time for processing |
| **Retries** | Number of retry attempts so far |

## Statuses

| Status | Meaning |
|---|---|
| **Pending** | Waiting for the scheduled processing time. Can be cancelled or processed immediately. |
| **Processed** | Successfully dispatched to the conversation pipeline. |
| **Failed** | Processing attempt failed. Check the entry detail for the error message. |
| **Cancelled** | Manually cancelled — the message will not be processed. |

## Actions

### View Details

Click any row to open a detail modal with full entry information including the original message payload, provider ID, session ID, and any error messages.

### Process Now

For pending entries, click the clock icon to reschedule processing to the next poll cycle (effectively immediate). This is useful when you want to skip the delay for a specific message.

### Cancel

For pending entries, click the cancel icon to remove the entry from the queue. The message will not be processed.

### Go to Conversation

If the entry is associated with a conversation, click the message icon to navigate directly to that conversation's detail view.

## Filters

- **Status** — Filter by pending, processed, failed, or cancelled entries.
- **Channel** — Filter by channel type (e.g., SMTP/IMAP, WhatsApp, Telegram, Twilio Messaging).
- **Search** — Search across session IDs, conversation IDs, provider IDs, and entry IDs.

## Access

Available under the **Monitor** section in the sidebar. Requires an active project selection.

## Tips

- **Monitor failed entries** — If messages keep failing, check the error message in the detail modal to diagnose the issue.
- **Process delays** — Processing delays are configured per channel provider. See [Providers](../administration/providers) for channel configuration details.
- **Related to conversations** — Use the conversation link to jump directly to the conversation context for debugging.
