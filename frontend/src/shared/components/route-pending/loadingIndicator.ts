const FAVICON_HREF = "/favicon.png";

let busyCount = 0;
let spinTimer = 0;
let angle = 0;
let faviconImage: HTMLImageElement | null = null;
let faviconCanvas: HTMLCanvasElement | null = null;
let progress = 0;
let trickleTimer = 0;
let hideTimer = 0;

function topBar(): HTMLElement | null {
  return document.getElementById("app-top-progress");
}

function iconLinks(): HTMLLinkElement[] {
  return Array.from(document.querySelectorAll("link[rel='icon']"));
}

function paintFavicon() {
  const image = faviconImage;
  if (!image || !image.complete || image.naturalWidth === 0) return;
  const size = 64;
  if (!faviconCanvas) {
    faviconCanvas = document.createElement("canvas");
    faviconCanvas.width = size;
    faviconCanvas.height = size;
  }
  const context = faviconCanvas.getContext("2d");
  if (!context) return;
  const center = size / 2;
  const radius = size / 2 - 4;
  angle += 0.4;
  context.clearRect(0, 0, size, size);
  context.beginPath();
  context.strokeStyle = "rgba(246, 97, 10, 0.28)";
  context.lineWidth = 5;
  context.arc(center, center, radius, 0, Math.PI * 2);
  context.stroke();
  context.beginPath();
  context.strokeStyle = "#f6610a";
  context.lineWidth = 5;
  context.lineCap = "round";
  context.arc(center, center, radius, angle, angle + Math.PI * 1.15);
  context.stroke();
  const icon = size * 0.58;
  context.drawImage(image, (size - icon) / 2, (size - icon) / 2, icon, icon);
  const href = faviconCanvas.toDataURL("image/png");
  iconLinks().forEach((link) => {
    link.href = href;
  });
}

function startFaviconSpin() {
  if (spinTimer) return;
  if (!faviconImage) {
    faviconImage = new Image();
    faviconImage.src = FAVICON_HREF;
  }
  spinTimer = window.setInterval(paintFavicon, 80);
}

function stopFaviconSpin() {
  if (spinTimer) {
    window.clearInterval(spinTimer);
    spinTimer = 0;
  }
  iconLinks().forEach((link) => {
    link.href = FAVICON_HREF;
  });
}

function progressFill(): HTMLElement | null {
  return topBar()?.querySelector("span") ?? null;
}

function paintProgress(value: number) {
  const fill = progressFill();
  if (!fill) return;
  fill.style.animation = "none";
  fill.style.transform = `scaleX(${value})`;
}

function stopTrickle() {
  if (trickleTimer) {
    window.clearInterval(trickleTimer);
    trickleTimer = 0;
  }
}

function startTrickle() {
  if (trickleTimer) return;
  if (hideTimer) {
    window.clearTimeout(hideTimer);
    hideTimer = 0;
  }
  if (progress <= 0 || progress >= 1) progress = 0.12;
  paintProgress(progress);
  trickleTimer = window.setInterval(() => {
    if (progress >= 0.9) return;
    const remaining = 0.9 - progress;
    progress = Math.min(0.9, progress + Math.max(0.012, remaining * 0.12));
    paintProgress(progress);
  }, 200);
}

function finishProgress() {
  stopTrickle();
  progress = 1;
  paintProgress(1);
  if (hideTimer) window.clearTimeout(hideTimer);
  hideTimer = window.setTimeout(() => {
    const bar = topBar();
    const fill = progressFill();
    if (bar) bar.hidden = true;
    if (fill) {
      fill.style.transition = "none";
      fill.style.transform = "scaleX(0)";
      fill.offsetHeight;
      fill.style.transition = "";
    }
    progress = 0;
    hideTimer = 0;
  }, 280);
}

export function syncLoadingIndicator() {
  const bar = topBar();
  const busy = busyCount > 0 || window.__topLoading === true;
  if (!bar) return;
  if (busy) {
    bar.hidden = false;
    startTrickle();
    startFaviconSpin();
    return;
  }
  stopFaviconSpin();
  if (progress > 0) finishProgress();
  else bar.hidden = true;
}

export function retainPageBusy(): () => void {
  busyCount += 1;
  syncLoadingIndicator();
  return () => {
    busyCount = Math.max(0, busyCount - 1);
    syncLoadingIndicator();
  };
}
