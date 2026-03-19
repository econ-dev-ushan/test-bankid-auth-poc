import { getJson, postJson } from '../../../lib/api/httpClient'
import {
  bankIdHealthSchema,
  bankIdStartRequestSchema,
  bankIdStartResponseSchema,
  bankIdStatusResponseSchema,
  type BankIdFlow,
} from '../lib/bankidTypes'

export async function getBankIdHealth(signal?: AbortSignal) {
  const response = await getJson('/api/bankid/health', { signal })
  return bankIdHealthSchema.parse(response)
}

export async function startBankIdAuth(flow: BankIdFlow) {
  const payload = bankIdStartRequestSchema.parse({ flow })
  const response = await postJson('/api/bankid/auth', payload)
  return bankIdStartResponseSchema.parse(response)
}

export async function getBankIdOrderStatus(orderId: string, signal?: AbortSignal) {
  const response = await getJson(`/api/bankid/orders/${orderId}`, { signal })
  return bankIdStatusResponseSchema.parse(response)
}

export async function cancelBankIdOrder(orderId: string) {
  const response = await postJson(`/api/bankid/orders/${orderId}/cancel`, {})
  return bankIdStatusResponseSchema.parse(response)
}
