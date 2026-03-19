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

export async function postJson<TResponse, TBody>(
  path: string,
  body: TBody,
  options?: RequestOptions,
): Promise<TResponse> {
  const response = await fetch(`${appConfig.apiBaseUrl}${path}`, {
    ...options,
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(options?.headers ?? {}),
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`)
  }

  return (await response.json()) as TResponse
}
