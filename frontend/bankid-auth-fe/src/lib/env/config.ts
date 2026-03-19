function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, '')
}

export const appConfig = {
  apiBaseUrl: trimTrailingSlash(
    import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000',
  ),
}
