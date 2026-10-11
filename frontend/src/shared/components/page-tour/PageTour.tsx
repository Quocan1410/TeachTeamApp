"use client";

import React, { useCallback, useEffect, useLayoutEffect, useState } from "react";
import Image from "next/image";
import {
  clearTourCompleted,
  hasCompletedTour,
  markTourCompleted,
} from "./tourStorage";
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
  userId?: string | null;
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
  userId,
  startDelayMs = 700,
  enabled = true,
}: PageTourProps) {
  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [spotlight, setSpotlight] = useState<SpotlightRect | null>(null);

  const finish = useCallback(() => {
    markTourCompleted(tourId, userId);
    setActive(false);
    setSpotlight(null);
    document.documentElement.classList.remove("page-tour-active");
  }, [tourId, userId]);

  useEffect(() => {
    if (!enabled || steps.length === 0) return;
    if (hasCompletedTour(tourId, userId)) return;
    const timer = window.setTimeout(() => {
      setActive(true);
      setStepIndex(0);
      document.documentElement.classList.add("page-tour-active");
    }, startDelayMs);
    return () => {
      window.clearTimeout(timer);
      document.documentElement.classList.remove("page-tour-active");
    };
  }, [enabled, steps.length, tourId, userId, startDelayMs]);

  useEffect(() => {
    if (!enabled) return;
    const onReplay = (event: Event) => {
      const detail = (event as CustomEvent<{ tourId?: string }>).detail;
      if (detail?.tourId && detail.tourId !== tourId) return;
      clearTourCompleted(tourId, userId);
      setStepIndex(0);
      setActive(true);
      document.documentElement.classList.add("page-tour-active");
    };
    window.addEventListener("teachteam:replay-page-tour", onReplay);
    return () =>
      window.removeEventListener("teachteam:replay-page-tour", onReplay);
  }, [enabled, tourId, userId]);

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

      <div
        className={`${styles.pageTour__card} ${
          spotlight ? styles["pageTour__card--anchored"] : ""
        }`}
      >
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
