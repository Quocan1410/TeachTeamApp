"use client";

import React, { useCallback, useEffect, useLayoutEffect, useState } from "react";
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

const PAD = 8;
const VIEW_MARGIN = 10;
const CARD_WIDTH = 360;
const CARD_GAP = 14;
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

/** Intersect padded target with the visible area below the fixed header. */
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

  const rawTop = rect.top - PAD;
  const rawLeft = rect.left - PAD;
  const rawRight = rect.right + PAD;
  const rawBottom = rect.bottom + PAD;

  const top = Math.min(Math.max(rawTop, viewTop), viewBottom - 48);
  const left = Math.min(Math.max(rawLeft, viewLeft), viewRight - 48);
  const right = Math.max(Math.min(rawRight, viewRight), left + 48);
  const bottom = Math.max(Math.min(rawBottom, viewBottom), top + 48);

  return {
    top,
    left,
    width: right - left,
    height: bottom - top,
  };
}

function placeCard(spotlight: SpotlightRect | null): CardPos {
  const width = Math.min(CARD_WIDTH, window.innerWidth - VIEW_MARGIN * 2);
  const estimatedHeight = 220;
  const centerX = spotlight
    ? spotlight.left + spotlight.width / 2
    : window.innerWidth / 2;
  const left = Math.min(
    Math.max(VIEW_MARGIN, centerX - width / 2),
    window.innerWidth - VIEW_MARGIN - width
  );

  if (!spotlight) {
    return { left, bottom: VIEW_MARGIN + 8 };
  }

  const spaceBelow =
    window.innerHeight - VIEW_MARGIN - (spotlight.top + spotlight.height);
  const spaceAbove = spotlight.top - headerOffset() - VIEW_MARGIN;

  if (spaceBelow >= estimatedHeight + CARD_GAP || spaceBelow >= spaceAbove) {
    const top = Math.min(
      spotlight.top + spotlight.height + CARD_GAP,
      window.innerHeight - VIEW_MARGIN - estimatedHeight
    );
    return { left, top: Math.max(headerOffset() + 4, top) };
  }

  // Sit just above the spotlight (CSS `bottom` = distance from viewport bottom).
  const bottom = Math.max(
    VIEW_MARGIN,
    window.innerHeight - (spotlight.top - CARD_GAP)
  );
  return { left, bottom };
}

function scrollTargetIntoView(selector?: string) {
  if (!selector) return;
  const el = document.querySelector(selector);
  if (!(el instanceof HTMLElement)) return;

  const rect = el.getBoundingClientRect();
  const topLimit = headerOffset() + 12;
  const bottomLimit = window.innerHeight - 24;
  const visibleHeight = bottomLimit - topLimit;

  if (rect.top >= topLimit && rect.bottom <= bottomLimit) return;

  // Tall targets: pin top just under the header instead of centering
  // (centering pulls the box through the logo).
  if (rect.height >= visibleHeight * 0.85) {
    const delta = rect.top - topLimit;
    if (Math.abs(delta) > 4) {
      window.scrollBy({ top: delta, behavior: "smooth" });
    }
    return;
  }

  if (rect.top < topLimit) {
    window.scrollBy({ top: rect.top - topLimit, behavior: "smooth" });
  } else if (rect.bottom > bottomLimit) {
    window.scrollBy({ top: rect.bottom - bottomLimit, behavior: "smooth" });
  }
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
  const [cardPos, setCardPos] = useState<CardPos>({ left: 0, bottom: 24 });
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
    void persistTour(true);
    setActive(false);
    setSpotlight(null);
    document.documentElement.classList.remove("page-tour-active");
  }, [persistTour]);

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
      document.documentElement.classList.remove("page-tour-active");
    };
  }, [tourEnabled, steps.length, tourId, user, startDelayMs]);

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

  const step = steps[stepIndex];

  const refreshSpotlight = useCallback(() => {
    if (!active || !step) return;
    const rect = readTargetRect(step.target);
    setSpotlight(rect);
    setCardPos(placeCard(rect));
  }, [active, step]);

  useLayoutEffect(() => {
    if (!active || !step) return;
    scrollTargetIntoView(step.target);
    refreshSpotlight();
    // Smooth scroll settles after a beat — remeasure so the hole tracks the target.
    const t1 = window.setTimeout(refreshSpotlight, 280);
    const t2 = window.setTimeout(refreshSpotlight, 560);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [refreshSpotlight, stepIndex, active, step]);

  useEffect(() => {
    if (!active) return;
    const onResize = () => refreshSpotlight();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
    };
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
