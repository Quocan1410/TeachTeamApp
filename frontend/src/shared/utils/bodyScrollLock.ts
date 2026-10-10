let lockCount = 0;
let lockedScrollY = 0;
let previousHtmlOverflow = "";
let previousHtmlScrollBehavior = "";
let previousBodyOverflow = "";
let previousBodyPaddingRight = "";

const SCROLL_KEYS = new Set([
  " ",
  "PageUp",
  "PageDown",
  "ArrowUp",
  "ArrowDown",
  "Home",
  "End",
]);

function canScroll(element: Element | null): boolean {
  let current = element;
  while (current && current !== document.body && current !== document.documentElement) {
    const style = window.getComputedStyle(current);
    const overflowY = style.overflowY;
    const scrollable =
      (overflowY === "auto" || overflowY === "scroll" || overflowY === "overlay") &&
      current.scrollHeight > current.clientHeight + 1;
    if (scrollable) return true;
    current = current.parentElement;
  }
  return false;
}

function preventBackgroundScroll(event: Event) {
  const target = event.target instanceof Element ? event.target : null;
  if (canScroll(target)) return;
  event.preventDefault();
}

function preventScrollKeys(event: KeyboardEvent) {
  if (!SCROLL_KEYS.has(event.key)) return;
  const target = event.target instanceof HTMLElement ? event.target : null;
  if (
    target &&
    (target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.tagName === "SELECT" ||
      target.isContentEditable)
  ) {
    return;
  }
  if (canScroll(target)) return;
  event.preventDefault();
}

export function lockBodyScroll(): void {
  if (typeof document === "undefined") return;

  if (lockCount === 0) {
    const html = document.documentElement;
    const body = document.body;
    lockedScrollY = window.scrollY || html.scrollTop || 0;
    const scrollbarWidth = window.innerWidth - html.clientWidth;
    const scrollbarGutter = window.getComputedStyle(html).scrollbarGutter;

    previousHtmlOverflow = html.style.overflow;
    previousHtmlScrollBehavior = html.style.scrollBehavior;
    previousBodyOverflow = body.style.overflow;
    previousBodyPaddingRight = body.style.paddingRight;

    html.style.scrollBehavior = "auto";
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    if (scrollbarWidth > 0 && !scrollbarGutter.includes("stable")) {
      body.style.paddingRight = `${scrollbarWidth}px`;
    }

    window.addEventListener("wheel", preventBackgroundScroll, { passive: false });
    window.addEventListener("touchmove", preventBackgroundScroll, { passive: false });
    window.addEventListener("keydown", preventScrollKeys);
  }

  lockCount += 1;
}

export function unlockBodyScroll(): void {
  if (typeof document === "undefined") return;

  lockCount = Math.max(0, lockCount - 1);
  if (lockCount !== 0) return;

  const html = document.documentElement;
  const body = document.body;
  html.style.overflow = previousHtmlOverflow;
  body.style.overflow = previousBodyOverflow;
  body.style.paddingRight = previousBodyPaddingRight;

  window.removeEventListener("wheel", preventBackgroundScroll);
  window.removeEventListener("touchmove", preventBackgroundScroll);
  window.removeEventListener("keydown", preventScrollKeys);

  if (Math.abs(window.scrollY - lockedScrollY) > 1) {
    window.scrollTo(0, lockedScrollY);
  }
  html.style.scrollBehavior = previousHtmlScrollBehavior;
}

export function forceUnlockBodyScroll(): void {
  if (typeof document === "undefined") return;
  if (lockCount !== 0 || document.body.style.position !== "fixed") return;

  const html = document.documentElement;
  const body = document.body;
  const top = Number.parseFloat(body.style.top || "0");
  const y = Number.isFinite(top) ? Math.abs(top) : 0;
  html.style.scrollBehavior = "auto";
  body.style.position = "";
  body.style.top = "";
  body.style.left = "";
  body.style.right = "";
  body.style.width = "";
  body.style.overflow = "";
  body.style.paddingRight = "";
  html.style.overflow = "";
  window.scrollTo(0, y);
  html.style.scrollBehavior = "";
}
