import type { ApiErrorDetail, ParsedError } from '@/api/types'

export function parseApiError(err: unknown): ParsedError {
  if (err && typeof err === 'object' && 'response' in err) {
    const axiosErr = err as { response?: { status?: number; data?: { error?: string; details?: ApiErrorDetail[] } } }
    const data = axiosErr.response?.data
    if (data?.error) {
      return {
        message: data.error,
        details: data.details,
        statusCode: axiosErr.response?.status,
      }
    }
    if (axiosErr.response?.status) {
      return {
        message: `Request failed with status ${axiosErr.response.status}`,
        statusCode: axiosErr.response.status,
      }
    }
  }

  if (err instanceof Error) {
    return { message: err.message }
  }

  return { message: 'An unexpected error occurred' }
}

export function getFieldError(
  error: ParsedError | null,
  path: string | number | (string | number)[]
): ApiErrorDetail | null {
  if (!error?.details?.length) return null
  const normalized: (string | number)[] = Array.isArray(path) ? path : [path]
  return (
    error.details.find(
      (d) =>
        d.path.length === normalized.length &&
        d.path.every((seg, i) => String(seg) === String(normalized[i]))
    ) ?? null
  )
}
