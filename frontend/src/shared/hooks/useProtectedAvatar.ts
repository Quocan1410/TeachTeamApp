"use client";

import { useEffect, useState } from "react";
import { AuthService } from "../services/authService";
import { env } from "@/lib/env";

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

      const token = AuthService.getToken();
      if (!token) {
        setObjectUrl(null);
        return;
      }

      try {
        const response = await fetch(`${env.apiEndpoint}/auth/avatar/image`, {
          headers: { Authorization: `Bearer ${token}` },
        });

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
  }, [hasAvatar, refreshKey]);

  return objectUrl;
}
