"use client";

import { useEffect, useState } from "react";
import { env } from "@/lib/env";
import { getAvatarCacheBuster } from "@/shared/utils/avatarUtils";
import { fetchAvatarBlob } from "@/shared/utils/avatarFetchCache";

export function useProtectedAvatar(
  hasAvatar: boolean,
  refreshKey?: string | number | null
): string | null {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    let revoked: string | null = null;

    const load = async () => {
      if (!hasAvatar) {
        setObjectUrl(null);
        return;
      }

      try {
        const cacheBuster =
          typeof refreshKey === "string"
            ? getAvatarCacheBuster(refreshKey)
            : undefined;
        const query = cacheBuster
          ? `?v=${encodeURIComponent(cacheBuster)}`
          : "";
        const blob = await fetchAvatarBlob(
          `${env.apiEndpoint}/auth/avatar/image${query}`,
          { credentials: "include", cache: "no-store" }
        );

        if (!blob) {
          setObjectUrl(null);
          return;
        }
        const url = URL.createObjectURL(blob);
        revoked = url;
        setObjectUrl(url);
      } catch {
        setObjectUrl(null);
      }
    };

    load();

    return () => {
      if (revoked) {
        URL.revokeObjectURL(revoked);
      }
    };
  }, [hasAvatar, refreshKey]);

  return objectUrl;
}
