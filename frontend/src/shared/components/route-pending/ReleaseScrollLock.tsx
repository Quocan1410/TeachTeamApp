"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { forceUnlockBodyScroll } from "@/shared/utils/bodyScrollLock";

export default function ReleaseScrollLock() {
  const pathname = usePathname();

  useEffect(() => {
    forceUnlockBodyScroll();
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
