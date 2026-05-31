let lockCount = 0;
let previousBodyOverflow = "";
let previousBodyPaddingRight = "";

export function lockBodyScroll(): void {
  if (typeof document === "undefined") return;

  if (lockCount === 0) {
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;

    previousBodyOverflow = document.body.style.overflow;
    previousBodyPaddingRight = document.body.style.paddingRight;

    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
  }

  lockCount += 1;
}

export function unlockBodyScroll(): void {
  if (typeof document === "undefined") return;

  lockCount = Math.max(0, lockCount - 1);

  if (lockCount === 0) {
    document.body.style.overflow = previousBodyOverflow;
    document.body.style.paddingRight = previousBodyPaddingRight;
  }
}
