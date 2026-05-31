"use client";

import { useEffect, useState } from "react";
import { env } from "@/lib/env";
import { getAvatarCacheBuster, hasCustomAvatar } from "../utils/avatarUtils";
import { fetchAvatarBlob } from "../utils/avatarFetchCache";

/** Load another user's uploaded avatar (not the logged-in user's). */
export function useUserAvatarImage(
  userId: number | undefined,
  avatarUrl?: string | null
): string | null {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const hasCustom = hasCustomAvatar(avatarUrl);

  useEffect(() => {
    let revoked: string | null = null;

    const load = async () => {
      if (!hasCustom || !userId) {
        setObjectUrl(null);
        return;
      }

      try {
        const cacheBuster = getAvatarCacheBuster(avatarUrl);
        const query = cacheBuster
          ? `?v=${encodeURIComponent(cacheBuster)}`
          : "";
        const blob = await fetchAvatarBlob(
          `${env.apiEndpoint}/auth/users/${userId}/avatar${query}`,
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
  }, [hasCustom, userId, avatarUrl]);

  return objectUrl;
}
