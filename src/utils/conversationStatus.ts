export function getStatusBadgeClass(status: string): string {
  switch (status) {
    case 'awaiting_user_input':
    case 'receiving_user_voice':
    case 'processing_user_input':
    case 'generating_response':
      return 'badge-active'
    case 'finished':
      return 'badge-info'
    case 'aborted':
      return 'badge-warning'
    case 'failed':
      return 'badge-error'
    case 'initialized':
    default:
      return 'badge-secondary'
  }
}

export function formatStatusLabel(status: string): string {
  return status
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

export function shortenConversationId(id: string): string {
  return `conv_...${id.slice(-6)}`
}
