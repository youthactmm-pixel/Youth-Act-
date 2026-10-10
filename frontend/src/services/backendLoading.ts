let pendingRequests = 0
const listeners = new Set<() => void>()

export function subscribeToBackendLoading(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getBackendLoadingSnapshot(): boolean {
  return pendingRequests > 0
}

function notifyListeners(): void {
  for (const listener of listeners) {
    listener()
  }
}

export async function withBackendLoading<T>(
  request: () => Promise<T>
): Promise<T> {
  pendingRequests += 1
  notifyListeners()

  try {
    return await request()
  } finally {
    pendingRequests -= 1
    notifyListeners()
  }
}
