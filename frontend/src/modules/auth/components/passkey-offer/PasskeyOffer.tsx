"use client";

import { useEffect, useState } from "react";
import { createPasskey } from "@/modules/auth/utils/passkey";
import styles from "./passkey-offer.module.css";

interface PasskeyOfferProps {
  onDone: (message: string) => void;
  onError: (message: string) => void;
}

const captions = [
  "You approve on this device.",
  "The device signs a one-time check.",
  "TeachTeam accepts that signature.",
];

export default function PasskeyOffer({ onDone, onError }: PasskeyOfferProps) {
  const [showInfo, setShowInfo] = useState(false);
  const [busy, setBusy] = useState(false);
  const [captionIndex, setCaptionIndex] = useState(0);

  const finishWithoutPasskey = () => {
    onDone("Account created. Sign in with the email and password you just chose.");
  };

  const savePasskey = async () => {
    setBusy(true);
    const response = await createPasskey();
    setBusy(false);
    if (!response.success) {
      onError(response.message || "Passkey could not be saved.");
      return;
    }
    onDone(
      "Account created. Your passkey is saved. Sign in with it, or with your email and password."
    );
  };

  return (
    <section className={styles.offer} aria-labelledby="passkey-offer-title">
      <div className={styles.heading}>
        <h1 id="passkey-offer-title" className={styles.title}>
          Save a passkey?
        </h1>
        <button
          type="button"
          className={styles.info}
          aria-expanded={showInfo}
          aria-label="How a passkey works"
          onClick={() => {
            setShowInfo((open) => !open);
            setCaptionIndex(0);
          }}
        >
          <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
      <p className={styles.text}>
        Next time you can sign in from this device without typing your password.
      </p>
      {showInfo && (
        <div className={styles.story}>
          <div className={styles.track} aria-hidden="true">
            <span className={styles.step}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                <rect x="7" y="2.5" width="10" height="19" rx="2" />
                <circle cx="12" cy="17.5" r="0.8" fill="currentColor" />
              </svg>
            </span>
            <span className={styles.arrow} />
            <span className={styles.step}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                <circle cx="8" cy="15" r="3" />
                <path d="M10.2 12.8L19 4m0 0h-3.2M19 4v3.2" />
              </svg>
            </span>
            <span className={styles.arrow} />
            <span className={styles.step}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                <circle cx="12" cy="12" r="8" />
                <path d="M8.5 12.2l2.3 2.3 4.7-5" />
              </svg>
            </span>
          </div>
          <p className={styles.caption}>{captions[captionIndex]}</p>
          <CaptionTicker active={showInfo} onChange={setCaptionIndex} />
        </div>
      )}
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.secondary}
          disabled={busy}
          onClick={finishWithoutPasskey}
        >
          Not now
        </button>
        <button
          type="button"
          className={styles.primary}
          disabled={busy}
          onClick={savePasskey}
        >
          {busy ? "Waiting…" : "Create passkey"}
        </button>
      </div>
    </section>
  );
}

function CaptionTicker({
  active,
  onChange,
}: {
  active: boolean;
  onChange: (index: number) => void;
}) {
  useEffect(() => {
    if (!active) return;
    let step = 0;
    onChange(0);
    const timer = window.setInterval(() => {
      step = (step + 1) % 3;
      onChange(step);
    }, 1600);
    return () => window.clearInterval(timer);
  }, [active, onChange]);
  return null;
}
