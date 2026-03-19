import { getJson } from '../../../lib/api/httpClient'
import { bankIdHealthSchema } from '../lib/bankidTypes'

export async function getBankIdHealth(signal?: AbortSignal) {
  const response = await getJson('/api/bankid/health', { signal })
  return bankIdHealthSchema.parse(response)
}
