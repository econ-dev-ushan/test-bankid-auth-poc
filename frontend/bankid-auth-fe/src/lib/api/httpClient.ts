import { appConfig } from '../env/config'

interface RequestOptions extends RequestInit {
  signal?: AbortSignal
}

async function buildHttpError(response: Response) {
  const contentType = response.headers.get('content-type') ?? ''
  const fallbackMessage = `Request failed with status ${response.status}`

  if (contentType.includes('application/json')) {
    try {
      const payload = (await response.json()) as {
        message?: string | string[]
        error?: string
      }
      const message = Array.isArray(payload.message)
        ? payload.message.join(', ')
        : payload.message

      return new Error(message || payload.error || fallbackMessage)
    } catch {
      return new Error(fallbackMessage)
    }
  }

  try {
    const text = await response.text()
    return new Error(text || fallbackMessage)
  } catch {
    return new Error(fallbackMessage)
  }
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
    throw await buildHttpError(response)
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
    throw await buildHttpError(response)
  }

  return (await response.json()) as TResponse
}
