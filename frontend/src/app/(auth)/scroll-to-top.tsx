"use client";

import { useLayoutEffect } from "react";

function scrollPageToTop(): void {
  const root = document.documentElement;
  const previousBehavior = root.style.scrollBehavior;
  root.style.scrollBehavior = "auto";
  window.scrollTo(0, 0);
  root.style.scrollBehavior = previousBehavior;
}

export default function ScrollToTop() {
  useLayoutEffect(() => {
    const previousRestoration = history.scrollRestoration;
    history.scrollRestoration = "manual";
    scrollPageToTop();
    const frame = window.requestAnimationFrame(scrollPageToTop);
    return () => {
      window.cancelAnimationFrame(frame);
      history.scrollRestoration = previousRestoration;
    };
  }, []);

  return null;
}
