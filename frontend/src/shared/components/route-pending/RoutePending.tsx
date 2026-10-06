"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { syncLoadingIndicator } from "@/shared/components/route-pending/loadingIndicator";

declare global {
  interface Window {
    __topLoading?: boolean;
    __hideTopLoader?: () => void;
    __syncLoadingIndicator?: () => void;
  }
}

export default function RoutePending() {
  const pathname = usePathname();

  useEffect(() => {
    window.__syncLoadingIndicator = syncLoadingIndicator;
    document.documentElement.dataset.appReady = "1";
    syncLoadingIndicator();
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      window.__topLoading = false;
      syncLoadingIndicator();
    }, 80);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  return null;
}
