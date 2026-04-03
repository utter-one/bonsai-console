import type { InjectionKey } from 'vue'
import type { ApiErrorDetail } from '@/api/types'

export type FormGroupPath = string | number | (string | number)[]

export interface FormGroupContext {
  resolveError: (path: FormGroupPath) => ApiErrorDetail | null
  registerPath: (path: FormGroupPath) => void
  unregisterPath: (path: FormGroupPath) => void
}

export const FORM_GROUP_KEY: InjectionKey<FormGroupContext> = Symbol('formGroup')
