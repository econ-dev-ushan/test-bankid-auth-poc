import { z } from 'zod'

export const bankIdFlowSchema = z.enum(['same-device', 'qr'])
export const bankIdStateSchema = z.enum(['pending', 'complete', 'failed', 'cancelled'])
export const bankIdStartRequestSchema = z.object({
  flow: bankIdFlowSchema,
})

export const bankIdStatusSchema = z.object({
  state: bankIdStateSchema,
  hintCode: z.string().nullable(),
  message: z.string(),
})

export const bankIdLaunchSchema = z.object({
  autoStartToken: z.string(),
  bankIdUrl: z.string().url(),
})

export const bankIdQrSchema = z.object({
  imageDataUrl: z.string().nullable(),
  refreshIntervalMs: z.number().int().positive(),
  refreshAt: z.string().optional(),
})

export const bankIdCompletionSchema = z.object({
  user: z.object({
    personalNumber: z.string(),
    name: z.string(),
    givenName: z.string(),
    surname: z.string(),
  }),
  device: z.object({
    ipAddress: z.string(),
  }),
  bankId: z.object({
    orderRef: z.string(),
    completionData: z.unknown(),
  }),
})

export const bankIdStartResponseSchema = z.object({
  orderId: z.string(),
  flow: bankIdFlowSchema,
  launch: bankIdLaunchSchema.optional(),
  qr: bankIdQrSchema.optional(),
  status: bankIdStatusSchema,
  completion: bankIdCompletionSchema.nullish(),
})

export const bankIdStatusResponseSchema = z.object({
  orderId: z.string(),
  flow: bankIdFlowSchema,
  state: bankIdStateSchema,
  hintCode: z.string().nullable(),
  message: z.string(),
  qr: bankIdQrSchema.optional(),
  completion: bankIdCompletionSchema.nullish(),
})

export const bankIdHealthSchema = z.object({
  ready: z.boolean(),
  mode: z.enum(['disabled', 'configured']),
  apiBaseUrl: z.string().url(),
  rpApiPrefix: z.string(),
  frontendBaseUrl: z.string().url(),
  requestTimeoutMs: z.number().int().positive(),
  collectIntervalMs: z.number().int().positive(),
  qrRefreshIntervalMs: z.number().int().positive(),
  orderTtlSeconds: z.number().int().positive(),
  mtls: z.object({
    certificateLoaded: z.boolean(),
    caLoaded: z.boolean(),
  }),
  orderStore: z.object({
    activeOrders: z.number().int().nonnegative(),
  }),
})

export type BankIdFlow = z.infer<typeof bankIdFlowSchema>
export type BankIdStartRequest = z.infer<typeof bankIdStartRequestSchema>
export type BankIdStartResponse = z.infer<typeof bankIdStartResponseSchema>
export type BankIdStatusResponse = z.infer<typeof bankIdStatusResponseSchema>
export type BankIdHealth = z.infer<typeof bankIdHealthSchema>
