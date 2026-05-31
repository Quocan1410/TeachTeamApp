const inFlight = new Map<string, Promise<unknown>>();

export function dedupeInFlight<T>(
  key: string,
  request: () => Promise<T>
): Promise<T> {
  const existing = inFlight.get(key);
  if (existing) {
    return existing as Promise<T>;
  }

  const promise = request().finally(() => {
    inFlight.delete(key);
  });

  inFlight.set(key, promise);
  return promise;
}
