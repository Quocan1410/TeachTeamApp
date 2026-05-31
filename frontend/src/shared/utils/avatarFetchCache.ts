const avatarBlobCache = new Map<string, Promise<Blob | null>>();

export async function fetchAvatarBlob(
  url: string,
  init?: RequestInit
): Promise<Blob | null> {
  const existing = avatarBlobCache.get(url);
  if (existing) {
    return existing;
  }

  const request = fetch(url, init)
    .then(async (response) => {
      if (!response.ok) {
        avatarBlobCache.delete(url);
        return null;
      }
      return response.blob();
    })
    .catch(() => {
      avatarBlobCache.delete(url);
      return null;
    });

  avatarBlobCache.set(url, request);
  return request;
}

export function clearAvatarFetchCache(): void {
  avatarBlobCache.clear();
}
