let lockCount = 0;
let lockedScrollY = 0;
let previousHtmlOverflow = "";
let previousBodyOverflow = "";
let previousBodyPaddingRight = "";
let previousBodyPosition = "";
let previousBodyTop = "";
let previousBodyLeft = "";
let previousBodyRight = "";
let previousBodyWidth = "";

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

    previousHtmlOverflow = html.style.overflow;
    previousBodyOverflow = body.style.overflow;
    previousBodyPaddingRight = body.style.paddingRight;
    previousBodyPosition = body.style.position;
    previousBodyTop = body.style.top;
    previousBodyLeft = body.style.left;
    previousBodyRight = body.style.right;
    previousBodyWidth = body.style.width;

    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${lockedScrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";
    if (scrollbarWidth > 0) {
      body.style.paddingRight = `${scrollbarWidth}px`;
    }

    window.addEventListener("wheel", preventBackgroundScroll, { passive: false });
    window.addEventListener("touchmove", preventBackgroundScroll, { passive: false });
    window.addEventListener("keydown", preventScrollKeys);
  }

  lockCount += 1;
}

export function forceUnlockBodyScroll(): void {
  if (typeof document === "undefined") return;

  const body = document.body;
  const stuck = body.style.position === "fixed";
  if (lockCount === 0 && !stuck) return;

  if (lockCount === 0) {
    body.style.position = "";
    body.style.top = "";
    body.style.left = "";
    body.style.right = "";
    body.style.width = "";
    body.style.overflow = "";
    body.style.paddingRight = "";
    document.documentElement.style.overflow = "";
    window.scrollTo(0, 0);
    return;
  }

  lockCount = 1;
  unlockBodyScroll();
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
  body.style.position = previousBodyPosition;
  body.style.top = previousBodyTop;
  body.style.left = previousBodyLeft;
  body.style.right = previousBodyRight;
  body.style.width = previousBodyWidth;

  window.removeEventListener("wheel", preventBackgroundScroll);
  window.removeEventListener("touchmove", preventBackgroundScroll);
  window.removeEventListener("keydown", preventScrollKeys);
  window.scrollTo(0, lockedScrollY);
}
