"use client";

import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { AuthService } from "@/shared/services/authService";
import { hasCompletedPageTour } from "./tourCatalog";
import styles from "./PageTour.module.css";

export type PageTourStep = {
  id: string;
  title: string;
  body: string;
  target?: string;
  mascotSrc?: string;
};

type SpotlightRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

type CardPos = {
  top: number;
  left: number;
};

type PageTourProps = {
  tourId: string;
  steps: PageTourStep[];
  /** Delay before the tour starts so the page can settle. */
  startDelayMs?: number;
  enabled?: boolean;
  /** Called when the active step changes (before spotlight measure). */
  onStepChange?: (step: PageTourStep, index: number) => void;
};

const PAD = 8;
const VIEW_MARGIN = 12;
const CARD_WIDTH = 340;
/** Keep in sync with real tour card (title + body + mascot + actions). */
const CARD_HEIGHT_EST = 248;
const CARD_GAP = 16;
const DEFAULT_MASCOT = "/mascot/mascot-1.png";
/** Tall targets: short band when card must sit below; taller when card can sit beside. */
const MAX_SPOTLIGHT_HEIGHT = 240;
const MAX_SPOTLIGHT_HEIGHT_SIDE = 420;
const MOVE_MS = 420;

function headerOffset(): number {
  if (typeof document === "undefined") return 72;
  const header =
    document.querySelector<HTMLElement>(".header__main-header") ||
    document.querySelector<HTMLElement>(".header__header-sticky") ||
    document.querySelector("header");
  if (!header) return 72;
  const bottom = header.getBoundingClientRect().bottom;
  return Number.isFinite(bottom) ? Math.max(56, bottom) : 72;
}

function overlaps(a: SpotlightRect, b: SpotlightRect, pad = 10): boolean {
  return !(
    a.left + a.width + pad < b.left ||
    b.left + b.width + pad < a.left ||
    a.top + a.height + pad < b.top ||
    b.top + b.height + pad < a.top
  );
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(Math.max(n, min), max);
}

function readTargetRect(selector?: string): SpotlightRect | null {
  if (!selector || typeof document === "undefined") return null;
  const el = document.querySelector(selector);
  if (!(el instanceof HTMLElement)) return null;
  const rect = el.getBoundingClientRect();
  if (rect.width < 2 || rect.height < 2) return null;

  const viewTop = headerOffset() + 4;
  const viewLeft = VIEW_MARGIN;
  const viewRight = window.innerWidth - VIEW_MARGIN;
  const viewBottom = window.innerHeight - VIEW_MARGIN;

  let top = rect.top - PAD;
  let left = rect.left - PAD;
  let width = rect.width + PAD * 2;

  const cardW = Math.min(CARD_WIDTH, window.innerWidth - VIEW_MARGIN * 2);
  const canPlaceSide =
    left - CARD_GAP - cardW >= viewLeft ||
    left + width + CARD_GAP + cardW <= viewRight;
  const maxHeight = canPlaceSide
    ? MAX_SPOTLIGHT_HEIGHT_SIDE
    : MAX_SPOTLIGHT_HEIGHT;

  let height = Math.min(rect.height + PAD * 2, maxHeight);

  if (top < viewTop) {
    height = Math.max(48, height - (viewTop - top));
    top = viewTop;
  }
  if (top + height > viewBottom) {
    height = Math.max(48, viewBottom - top);
  }

  // Only reserve vertical room for the card when it cannot sit beside the hole.
  if (!canPlaceSide) {
    const roomUnder =
      window.innerHeight - VIEW_MARGIN - CARD_HEIGHT_EST - CARD_GAP - top;
    if (roomUnder > 72) {
      height = Math.min(height, roomUnder);
    }
  }

  left = clamp(left, viewLeft, viewRight - 48);
  width = Math.min(width, viewRight - left);

  return { top, left, width, height };
}

function cardViewportBox(pos: CardPos, width: number): SpotlightRect {
  return {
    left: pos.left,
    top: pos.top,
    width,
    height: CARD_HEIGHT_EST,
  };
}

function fallbackCardPos(): CardPos {
  return {
    left: VIEW_MARGIN,
    top: Math.max(
      headerOffset() + 8,
      window.innerHeight - VIEW_MARGIN - 10 - CARD_HEIGHT_EST
    ),
  };
}

/**
 * Anchor the card near the spotlight (below → above → sides), then near-focus fallbacks.
 * Always returns top/left so CSS can tween smoothly with transform.
 */
function placeCard(spotlight: SpotlightRect | null): CardPos {
  const width = Math.min(CARD_WIDTH, window.innerWidth - VIEW_MARGIN * 2);
  const leftMin = VIEW_MARGIN;
  const leftMax = Math.max(VIEW_MARGIN, window.innerWidth - VIEW_MARGIN - width);
  const minTop = headerOffset() + 8;
  const maxTop = Math.max(
    minTop,
    window.innerHeight - VIEW_MARGIN - CARD_HEIGHT_EST
  );
  const corner = fallbackCardPos();

  if (!spotlight) return corner;

  const alignLeft = clamp(spotlight.left, leftMin, leftMax);
  const centerLeft = clamp(
    spotlight.left + spotlight.width / 2 - width / 2,
    leftMin,
    leftMax
  );
  const belowTop = spotlight.top + spotlight.height + CARD_GAP;
  const aboveTop = spotlight.top - CARD_GAP - CARD_HEIGHT_EST;
  const sideTop = clamp(
    spotlight.top + spotlight.height / 2 - CARD_HEIGHT_EST / 2,
    minTop,
    maxTop
  );
  // Closest-under slot when full "below" won't fit — keep card by the hole.
  const snugBelowTop = clamp(belowTop, minTop, maxTop);

  const candidates: CardPos[] = [];

  if (belowTop <= maxTop) {
    candidates.push(
      { left: centerLeft, top: Math.max(minTop, belowTop) },
      { left: alignLeft, top: Math.max(minTop, belowTop) }
    );
  } else {
    candidates.push(
      { left: centerLeft, top: snugBelowTop },
      { left: alignLeft, top: snugBelowTop }
    );
  }
  if (aboveTop >= minTop) {
    candidates.push(
      { left: centerLeft, top: aboveTop },
      { left: alignLeft, top: aboveTop }
    );
  }

  const rightLeft = spotlight.left + spotlight.width + CARD_GAP;
  if (rightLeft + width <= window.innerWidth - VIEW_MARGIN) {
    candidates.push({ left: rightLeft, top: sideTop });
  }
  const leftLeft = spotlight.left - CARD_GAP - width;
  if (leftLeft >= VIEW_MARGIN) {
    candidates.push({ left: leftLeft, top: sideTop });
  }

  candidates.push(
    { left: centerLeft, top: snugBelowTop },
    { left: alignLeft, top: snugBelowTop },
    corner,
    {
      left: leftMax,
      top: corner.top,
    }
  );

  for (const candidate of candidates) {
    if (!overlaps(cardViewportBox(candidate, width), spotlight, 12)) {
      return candidate;
    }
  }

  // Last resort: stay near the focus even if boxes touch slightly.
  return { left: centerLeft, top: snugBelowTop };
}

function scrollTargetIntoView(selector?: string) {
  if (!selector) return;
  const el = document.querySelector(selector);
  if (!(el instanceof HTMLElement)) return;

  const rect = el.getBoundingClientRect();
  const topLimit = headerOffset() + 12;
  const bottomLimit = window.innerHeight - CARD_HEIGHT_EST - 36;
  const visibleHeight = Math.max(120, bottomLimit - topLimit);

  if (
    rect.top >= topLimit &&
    rect.top + Math.min(rect.height, MAX_SPOTLIGHT_HEIGHT) <= bottomLimit
  ) {
    return;
  }

  if (rect.height >= visibleHeight * 0.85) {
    const delta = rect.top - topLimit;
    if (Math.abs(delta) > 4) window.scrollBy({ top: delta, behavior: "smooth" });
    return;
  }

  if (rect.top < topLimit) {
    window.scrollBy({ top: rect.top - topLimit, behavior: "smooth" });
  } else if (rect.bottom > bottomLimit) {
    window.scrollBy({ top: rect.bottom - bottomLimit, behavior: "smooth" });
  }
}

function lockBodyScroll(scrollY: number) {
  const html = document.documentElement;
  const body = document.body;
  html.style.overflow = "hidden";
  body.style.overflow = "hidden";
  body.style.position = "fixed";
  body.style.top = `-${scrollY}px`;
  body.style.width = "100%";
}

function unlockBodyScroll(): number {
  const html = document.documentElement;
  const body = document.body;
  const y =
    Math.abs(Number.parseInt(body.style.top || "0", 10)) || window.scrollY;
  html.style.overflow = "";
  body.style.overflow = "";
  body.style.position = "";
  body.style.top = "";
  body.style.width = "";
  window.scrollTo(0, y);
  return y;
}

const pageTourDisabled =
  process.env.NEXT_PUBLIC_DISABLE_PAGE_TOUR === "1" ||
  process.env.NEXT_PUBLIC_DISABLE_PAGE_TOUR === "true";

export default function PageTour({
  tourId,
  steps,
  startDelayMs = 700,
  enabled = true,
  onStepChange,
}: PageTourProps) {
  const { user, updateUser } = useAuth();
  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [spotlight, setSpotlight] = useState<SpotlightRect | null>(null);
  const [cardPos, setCardPos] = useState<CardPos>({ left: VIEW_MARGIN, top: 120 });
  const [nudgeNext, setNudgeNext] = useState(false);
  const [entered, setEntered] = useState(false);
  const scrollYRef = useRef(0);
  const nudgeTimerRef = useRef<number | null>(null);
  const measureTimerRef = useRef<number | null>(null);
  const nextButtonRef = useRef<HTMLButtonElement | null>(null);
  const onStepChangeRef = useRef(onStepChange);
  const tourEnabled = enabled && !pageTourDisabled;

  useEffect(() => {
    onStepChangeRef.current = onStepChange;
  }, [onStepChange]);

  const persistTour = useCallback(
    async (completed: boolean) => {
      const response = await AuthService.updatePageTour(tourId, completed);
      if (response.success && response.data?.user) {
        updateUser(response.data.user);
      }
    },
    [tourId, updateUser]
  );

  const finish = useCallback(() => {
    setActive(false);
    setSpotlight(null);
    setEntered(false);
    document.documentElement.classList.remove("page-tour-active");
    if (user) {
      const current = Array.isArray(user.completedPageTours)
        ? user.completedPageTours
        : [];
      if (!current.includes(tourId)) {
        updateUser({
          ...user,
          completedPageTours: [...current, tourId],
        });
      }
    }
    void persistTour(true);
  }, [persistTour, tourId, updateUser, user]);

  useEffect(() => {
    if (!tourEnabled || steps.length === 0 || !user) return;
    if (hasCompletedPageTour(user.completedPageTours, tourId)) return;
    const timer = window.setTimeout(() => {
      setActive(true);
      setStepIndex(0);
      setEntered(false);
      document.documentElement.classList.add("page-tour-active");
    }, startDelayMs);
    return () => {
      window.clearTimeout(timer);
    };
  }, [
    tourEnabled,
    steps.length,
    tourId,
    user?.id,
    Array.isArray(user?.completedPageTours)
      ? user.completedPageTours.join("\0")
      : "",
    startDelayMs,
  ]);

  useEffect(() => {
    if (!tourEnabled || !user) return;
    const onReplay = (event: Event) => {
      const detail = (event as CustomEvent<{ tourId?: string }>).detail;
      if (detail?.tourId && detail.tourId !== tourId) return;
      void (async () => {
        await persistTour(false);
        setStepIndex(0);
        setEntered(false);
        setActive(true);
        document.documentElement.classList.add("page-tour-active");
      })();
    };
    window.addEventListener("teachteam:replay-page-tour", onReplay);
    return () =>
      window.removeEventListener("teachteam:replay-page-tour", onReplay);
  }, [tourEnabled, tourId, user, persistTour]);

  useEffect(() => {
    if (!active) return;
    scrollYRef.current = window.scrollY;
    document.documentElement.classList.add("page-tour-active");
    lockBodyScroll(scrollYRef.current);

    const blockScroll = (event: Event) => {
      const target = event.target;
      if (
        target instanceof Element &&
        target.closest(`.${styles.pageTour__card}`)
      ) {
        return;
      }
      event.preventDefault();
    };
    document.addEventListener("wheel", blockScroll, { passive: false });
    document.addEventListener("touchmove", blockScroll, { passive: false });

    return () => {
      document.removeEventListener("wheel", blockScroll);
      document.removeEventListener("touchmove", blockScroll);
      unlockBodyScroll();
    };
  }, [active]);

  const step = steps[stepIndex];

  const refreshSpotlight = useCallback(() => {
    if (!active || !step) return;
    const rect = readTargetRect(step.target);
    setSpotlight(rect);
    setCardPos(placeCard(rect));
  }, [active, step]);

  useLayoutEffect(() => {
    if (!active || !step) return;

    onStepChangeRef.current?.(step, stepIndex);

    if (measureTimerRef.current) {
      window.clearTimeout(measureTimerRef.current);
      measureTimerRef.current = null;
    }

    // One unlock → scroll → wait for layout → measure → lock (no double thrash).
    unlockBodyScroll();
    scrollTargetIntoView(step.target);

    // Details / list may trigger parent state (select applicant) before paint.
    const settleMs = step.target
      ? step.id === "details" || step.id === "list"
        ? 360
        : 220
      : 40;
    measureTimerRef.current = window.setTimeout(() => {
      refreshSpotlight();
      scrollYRef.current = window.scrollY;
      lockBodyScroll(scrollYRef.current);
      measureTimerRef.current = window.setTimeout(() => {
        // Second pass after lock so rects match the fixed body.
        refreshSpotlight();
        setEntered(true);
        measureTimerRef.current = null;
      }, 64);
    }, settleMs);

    return () => {
      if (measureTimerRef.current) {
        window.clearTimeout(measureTimerRef.current);
        measureTimerRef.current = null;
      }
    };
  }, [refreshSpotlight, stepIndex, active, step]);

  useEffect(() => {
    if (!active) return;
    const onResize = () => refreshSpotlight();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [active, refreshSpotlight]);

  const pulseNext = useCallback(() => {
    setNudgeNext(false);
    window.requestAnimationFrame(() => {
      setNudgeNext(true);
      nextButtonRef.current?.focus({ preventScroll: true });
    });
    if (nudgeTimerRef.current) window.clearTimeout(nudgeTimerRef.current);
    nudgeTimerRef.current = window.setTimeout(() => {
      setNudgeNext(false);
      nudgeTimerRef.current = null;
    }, 700);
  }, []);

  useEffect(() => {
    return () => {
      if (nudgeTimerRef.current) window.clearTimeout(nudgeTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!active) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        finish();
        return;
      }
      if (event.key === "Tab") {
        const skip = document.getElementById("page-tour-skip");
        const next = nextButtonRef.current;
        if (!skip || !next) return;
        event.preventDefault();
        const focusNext =
          event.shiftKey
            ? document.activeElement === skip
              ? next
              : skip
            : document.activeElement === next
              ? skip
              : next;
        focusNext.focus({ preventScroll: true });
        return;
      }
      if (event.key !== "Enter" && event.key !== " ") {
        event.preventDefault();
        pulseNext();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [active, finish, pulseNext]);

  useEffect(() => {
    if (!active) return;
    const t = window.setTimeout(() => {
      nextButtonRef.current?.focus({ preventScroll: true });
    }, 40);
    return () => window.clearTimeout(t);
  }, [active, stepIndex]);

  if (!active || !step) return null;

  const isLast = stepIndex >= steps.length - 1;
  const mascotSrc = step.mascotSrc || DEFAULT_MASCOT;
  const holeStyle = spotlight
    ? {
        top: `${spotlight.top}px`,
        left: `${spotlight.left}px`,
        width: `${spotlight.width}px`,
        height: `${spotlight.height}px`,
        opacity: 1,
      }
    : {
        top: `${cardPos.top}px`,
        left: `${cardPos.left}px`,
        width: "0px",
        height: "0px",
        opacity: 0,
      };

  const cardStyle: React.CSSProperties = {
    width: `min(${CARD_WIDTH}px, calc(100vw - ${VIEW_MARGIN * 2}px))`,
    transform: `translate3d(${cardPos.left}px, ${cardPos.top}px, 0)`,
    transitionDuration: entered ? `${MOVE_MS}ms` : "0ms",
  };

  const goNext = () => {
    setNudgeNext(false);
    if (isLast) {
      finish();
      return;
    }
    setStepIndex((i) => i + 1);
  };

  return (
    <div
      className={styles.pageTour}
      role="dialog"
      aria-modal="true"
      aria-labelledby="page-tour-title"
      aria-describedby="page-tour-body"
      onMouseDown={(event) => {
        event.preventDefault();
        pulseNext();
      }}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
      }}
    >
      <div className={styles.pageTour__dim} aria-hidden="true" />
      <div
        className={`${styles.pageTour__hole}${
          spotlight ? "" : ` ${styles.pageTour__holeHidden}`
        }`}
        style={holeStyle}
        aria-hidden="true"
      />

      <div
        className={`${styles.pageTour__card}${
          entered ? ` ${styles.pageTour__cardReady}` : ""
        }`}
        style={cardStyle}
        onMouseDown={(event) => {
          event.stopPropagation();
          const target = event.target;
          if (target instanceof Element && !target.closest("button")) {
            pulseNext();
          }
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="page-tour-title" className={styles.pageTour__title}>
          {step.title}
        </h2>
        <p id="page-tour-body" className={styles.pageTour__body}>
          {step.body}
        </p>

        <div className={styles.pageTour__mascotSeat} aria-hidden="true">
          <Image
            src={mascotSrc}
            alt=""
            width={220}
            height={220}
            className={styles.pageTour__mascot}
            priority
          />
        </div>

        <div className={styles.pageTour__actions}>
          <button
            type="button"
            id="page-tour-skip"
            className={styles.pageTour__skip}
            onMouseDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.stopPropagation();
              finish();
            }}
          >
            Skip
          </button>
          <p className={styles.pageTour__progress} aria-live="polite">
            {stepIndex + 1}/{steps.length}
          </p>
          <button
            ref={nextButtonRef}
            type="button"
            id="page-tour-next"
            className={`${styles.pageTour__next}${
              nudgeNext ? ` ${styles.pageTour__nextNudge}` : ""
            }`}
            onMouseDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.stopPropagation();
              goNext();
            }}
          >
            {isLast ? "Got it" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
