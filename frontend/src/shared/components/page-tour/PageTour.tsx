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
  top?: number;
  bottom?: number;
  left: number;
};

type PageTourProps = {
  tourId: string;
  steps: PageTourStep[];
  /** Delay before the tour starts so the page can settle. */
  startDelayMs?: number;
  enabled?: boolean;
};

const PAD = 6;
const VIEW_MARGIN = 12;
const CARD_WIDTH = 340;
const CARD_HEIGHT_EST = 230;
const CARD_GAP = 12;
/** Space the peeking mascot needs above the card top edge. */
const MASCOT_PEEK = 72;
const DEFAULT_MASCOT = "/mascot/mascot-1.png";

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

  const top = Math.min(Math.max(rect.top - PAD, viewTop), viewBottom - 40);
  const left = Math.min(Math.max(rect.left - PAD, viewLeft), viewRight - 40);
  const right = Math.max(Math.min(rect.right + PAD, viewRight), left + 40);
  const bottom = Math.max(Math.min(rect.bottom + PAD, viewBottom), top + 40);

  return {
    top,
    left,
    width: right - left,
    height: bottom - top,
  };
}

function cardViewportBox(pos: CardPos, width: number): SpotlightRect {
  const height = CARD_HEIGHT_EST + MASCOT_PEEK;
  if (pos.top != null) {
    return {
      left: pos.left,
      top: Math.max(0, pos.top - MASCOT_PEEK),
      width,
      height,
    };
  }
  const bottom = pos.bottom ?? VIEW_MARGIN;
  return {
    left: pos.left,
    top: window.innerHeight - bottom - CARD_HEIGHT_EST - MASCOT_PEEK,
    width,
    height,
  };
}

/**
 * Prefer bottom-left so the card stays out of the way.
 * If that covers the spotlight, try bottom-right, then under/above the target.
 */
function placeCard(spotlight: SpotlightRect | null): CardPos {
  const width = Math.min(CARD_WIDTH, window.innerWidth - VIEW_MARGIN * 2);
  const leftBL = VIEW_MARGIN;
  const leftBR = Math.max(VIEW_MARGIN, window.innerWidth - VIEW_MARGIN - width);
  const bottomSafe = VIEW_MARGIN + 10;

  const bottomLeft: CardPos = { left: leftBL, bottom: bottomSafe };
  const bottomRight: CardPos = { left: leftBR, bottom: bottomSafe };

  if (!spotlight) return bottomLeft;

  const minTop = headerOffset() + MASCOT_PEEK + 4;
  const belowTop = spotlight.top + spotlight.height + CARD_GAP + MASCOT_PEEK;
  const aboveTop = spotlight.top - CARD_GAP - CARD_HEIGHT_EST;

  const candidates: CardPos[] = [bottomLeft, bottomRight];

  if (belowTop + CARD_HEIGHT_EST <= window.innerHeight - VIEW_MARGIN) {
    candidates.push(
      {
        left: Math.min(Math.max(leftBL, spotlight.left), leftBR),
        top: Math.max(minTop, belowTop),
      },
      { left: leftBL, top: Math.max(minTop, belowTop) }
    );
  }

  if (aboveTop >= minTop) {
    candidates.push(
      {
        left: Math.min(Math.max(leftBL, spotlight.left), leftBR),
        top: aboveTop,
      },
      { left: leftBL, top: aboveTop }
    );
  }

  for (const candidate of candidates) {
    if (!overlaps(cardViewportBox(candidate, width), spotlight, 16)) {
      return candidate;
    }
  }

  return bottomLeft;
}

function scrollTargetIntoView(selector?: string) {
  if (!selector) return;
  const el = document.querySelector(selector);
  if (!(el instanceof HTMLElement)) return;

  const rect = el.getBoundingClientRect();
  const topLimit = headerOffset() + 12;
  const bottomLimit = window.innerHeight - CARD_HEIGHT_EST - MASCOT_PEEK - 28;
  const visibleHeight = Math.max(120, bottomLimit - topLimit);

  if (rect.top >= topLimit && rect.bottom <= bottomLimit) return;

  if (rect.height >= visibleHeight * 0.85) {
    const delta = rect.top - topLimit;
    if (Math.abs(delta) > 4) window.scrollBy(0, delta);
    return;
  }

  if (rect.top < topLimit) {
    window.scrollBy(0, rect.top - topLimit);
  } else if (rect.bottom > bottomLimit) {
    window.scrollBy(0, rect.bottom - bottomLimit);
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
  const y = Math.abs(Number.parseInt(body.style.top || "0", 10)) || window.scrollY;
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
}: PageTourProps) {
  const { user, updateUser } = useAuth();
  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [spotlight, setSpotlight] = useState<SpotlightRect | null>(null);
  const [cardPos, setCardPos] = useState<CardPos>({
    left: VIEW_MARGIN,
    bottom: VIEW_MARGIN + 10,
  });
  const scrollYRef = useRef(0);
  const tourEnabled = enabled && !pageTourDisabled;

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
    document.documentElement.classList.remove("page-tour-active");
    // Optimistic local mark so profile patches don't re-open the tour.
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
    // Primitive join so array identity changes from unrelated patches don't
    // re-arm the auto-start timer after "Got it".
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
        setActive(true);
        document.documentElement.classList.add("page-tour-active");
      })();
    };
    window.addEventListener("teachteam:replay-page-tour", onReplay);
    return () =>
      window.removeEventListener("teachteam:replay-page-tour", onReplay);
  }, [tourEnabled, tourId, user, persistTour]);

  // Lock background scroll while the tour is open.
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

    // Temporarily unlock so we can scroll the target into place, then re-lock.
    unlockBodyScroll();
    scrollTargetIntoView(step.target);
    scrollYRef.current = window.scrollY;
    refreshSpotlight();
    lockBodyScroll(scrollYRef.current);

    const t1 = window.setTimeout(() => {
      unlockBodyScroll();
      refreshSpotlight();
      scrollYRef.current = window.scrollY;
      lockBodyScroll(scrollYRef.current);
    }, 40);

    return () => window.clearTimeout(t1);
  }, [refreshSpotlight, stepIndex, active, step]);

  useEffect(() => {
    if (!active) return;
    const onResize = () => refreshSpotlight();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [active, refreshSpotlight]);

  useEffect(() => {
    if (!active) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        finish();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, finish]);

  if (!active || !step) return null;

  const isLast = stepIndex >= steps.length - 1;
  const mascotSrc = step.mascotSrc || DEFAULT_MASCOT;
  const holeStyle = spotlight
    ? {
        top: `${spotlight.top}px`,
        left: `${spotlight.left}px`,
        width: `${spotlight.width}px`,
        height: `${spotlight.height}px`,
      }
    : undefined;

  const cardStyle: React.CSSProperties = {
    left: `${cardPos.left}px`,
    width: `min(${CARD_WIDTH}px, calc(100vw - ${VIEW_MARGIN * 2}px))`,
    ...(cardPos.top != null
      ? { top: `${cardPos.top}px`, bottom: "auto" }
      : { bottom: `${cardPos.bottom ?? 24}px`, top: "auto" }),
  };

  return (
    <div
      className={styles.pageTour}
      role="dialog"
      aria-modal="true"
      aria-labelledby="page-tour-title"
      aria-describedby="page-tour-body"
    >
      <div className={styles.pageTour__dim} aria-hidden="true" />
      {spotlight && (
        <div
          className={styles.pageTour__hole}
          style={holeStyle}
          aria-hidden="true"
        />
      )}

      <div className={styles.pageTour__card} style={cardStyle}>
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

        <p className={styles.pageTour__progress}>
          {stepIndex + 1} / {steps.length}
        </p>
        <h2 id="page-tour-title" className={styles.pageTour__title}>
          {step.title}
        </h2>
        <p id="page-tour-body" className={styles.pageTour__body}>
          {step.body}
        </p>

        <div className={styles.pageTour__actions}>
          <button
            type="button"
            className={styles.pageTour__skip}
            onClick={finish}
          >
            Skip
          </button>
          <button
            type="button"
            className={styles.pageTour__next}
            onClick={() => {
              if (isLast) {
                finish();
                return;
              }
              setStepIndex((i) => i + 1);
            }}
          >
            {isLast ? "Got it" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
