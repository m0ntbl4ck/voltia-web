export class ApiError extends Error {
  status: number
  detail?: string

  constructor(status: number, title: string, detail?: string) {
    super(title)
    this.status = status
    this.detail = detail
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  let res: Response
  try {
    res = await fetch(`/api/v1${path}`, {
      method,
      credentials: 'same-origin',
      // Session data must not come from the browser cache, and this also skips a
      // permanent redirect an earlier host setup left behind for the same URL.
      cache: 'no-store',
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError(0, 'No se pudo conectar con el servidor')
  }

  if (res.status === 204) return undefined as T
  const payload = await res.json().catch(() => null)
  if (!res.ok) {
    throw new ApiError(res.status, payload?.title ?? 'Error del servidor', payload?.detail)
  }
  return payload as T
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
}
