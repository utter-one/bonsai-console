// Re-export all generated types
export * from './generated/data-contracts'

export interface ApiErrorDetail {
  origin?: string
  code: string
  minimum?: number
  inclusive?: boolean
  path: (string | number)[]
  message: string
}

export interface ApiError {
  error: string
  details?: ApiErrorDetail[]
}

export interface ParsedError {
  message: string
  details?: ApiErrorDetail[]
  statusCode?: number
}

