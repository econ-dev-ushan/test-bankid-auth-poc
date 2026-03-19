import { appConfig } from '../env/config'

interface RequestOptions extends RequestInit {
  signal?: AbortSignal
}

export async function getJson<T>(path: string, options?: RequestOptions): Promise<T> {
  const response = await fetch(`${appConfig.apiBaseUrl}${path}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...(options?.headers ?? {}),
    },
  })

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`)
  }

  return (await response.json()) as T
}
