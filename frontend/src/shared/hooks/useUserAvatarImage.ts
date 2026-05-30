"use client";

import { useEffect, useState } from "react";
import { env } from "@/lib/env";
import { hasCustomAvatar } from "../utils/avatarUtils";

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
        const response = await fetch(
          `${env.apiEndpoint}/auth/users/${userId}/avatar`,
          { credentials: "include" }
        );

        if (!response.ok) {
          setObjectUrl(null);
          return;
        }

        const blob = await response.blob();
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
