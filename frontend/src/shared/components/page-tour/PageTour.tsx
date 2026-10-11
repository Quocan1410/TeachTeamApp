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

type PageTourProps = {
  tourId: string;
  steps: PageTourStep[];
  /** Delay before the tour starts so the page can settle. */
  startDelayMs?: number;
  enabled?: boolean;
};

const PAD = 10;
const DEFAULT_MASCOT = "/mascot/mascot-1.png";

function readTargetRect(selector?: string): SpotlightRect | null {
  if (!selector || typeof document === "undefined") return null;
  const el = document.querySelector(selector);
  if (!(el instanceof HTMLElement)) return null;
  const rect = el.getBoundingClientRect();
  if (rect.width < 2 || rect.height < 2) return null;
  return {
    top: Math.max(0, rect.top - PAD),
    left: Math.max(0, rect.left - PAD),
    width: Math.min(window.innerWidth - 8, rect.width + PAD * 2),
    height: Math.min(window.innerHeight - 8, rect.height + PAD * 2),
  };
}

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
    if (!enabled || steps.length === 0 || !user) return;
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
  }, [enabled, steps.length, tourId, user, startDelayMs]);

  useEffect(() => {
    if (!enabled || !user) return;
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
  }, [enabled, tourId, user, persistTour]);

  const step = steps[stepIndex];

  const refreshSpotlight = useCallback(() => {
    if (!active || !step) return;
    const rect = readTargetRect(step.target);
    setSpotlight(rect);
    if (step.target) {
      const el = document.querySelector(step.target);
      if (el instanceof HTMLElement) {
        el.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "nearest",
        });
      }
    }
  }, [active, step]);

  useLayoutEffect(() => {
    refreshSpotlight();
  }, [refreshSpotlight, stepIndex]);

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

      <div className={styles.pageTour__card}>
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
