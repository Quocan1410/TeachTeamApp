"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { FingerPrintIcon } from "@heroicons/react/24/outline";
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
    onDone("Account created\nReady to sign in");
  };

  const savePasskey = async () => {
    setBusy(true);
    const response = await createPasskey();
    setBusy(false);
    if (!response.success) {
      onError(response.message || "Passkey could not be saved.");
      return;
    }
    onDone("Passkey saved\nTime to sign in");
  };

  return (
    <section className={styles.passkeyOffer} aria-labelledby="passkey-offer-title">
      <div className={styles.passkeyOffer__mascot} aria-hidden="true">
        <Image
          src="/mascot/mascot-3.png"
          alt=""
          width={377}
          height={661}
          priority
          className={styles.passkeyOffer__image}
        />
      </div>
      <div className={styles.passkeyOffer__card}>
        <span className={styles.passkeyOffer__mark} aria-hidden="true">
          <FingerPrintIcon />
        </span>
        <div className={styles.passkeyOffer__heading}>
          <h1 id="passkey-offer-title" className={styles.passkeyOffer__title}>
            Save a passkey?
          </h1>
          <button
            type="button"
            className={`${styles.passkeyOffer__info} ${
              showInfo ? styles["passkeyOffer__info--open"] : ""
            }`}
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
        <p className={styles.passkeyOffer__text}>
          Next time you can sign in from this device without typing your password.
        </p>
        <div
          className={`${styles.passkeyOffer__reveal} ${
            showInfo ? styles["passkeyOffer__reveal--open"] : ""
          }`}
        >
          <div className={styles.passkeyOffer__revealInner}>
            <div className={styles.passkeyOffer__story} aria-hidden={!showInfo}>
            <div className={styles.passkeyOffer__track} aria-hidden="true">
              <span className={styles.passkeyOffer__step}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                  <rect x="7" y="2.5" width="10" height="19" rx="2" />
                  <circle cx="12" cy="17.5" r="0.8" fill="currentColor" />
                </svg>
              </span>
              <span className={styles.passkeyOffer__arrow} />
              <span className={styles.passkeyOffer__step}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                  <circle cx="8" cy="15" r="3" />
                  <path d="M10.2 12.8L19 4m0 0h-3.2M19 4v3.2" />
                </svg>
              </span>
              <span className={styles.passkeyOffer__arrow} />
              <span className={styles.passkeyOffer__step}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                  <circle cx="12" cy="12" r="8" />
                  <path d="M8.5 12.2l2.3 2.3 4.7-5" />
                </svg>
              </span>
            </div>
            <p className={styles.passkeyOffer__caption}>{captions[captionIndex]}</p>
            <CaptionTicker active={showInfo} onChange={setCaptionIndex} />
            </div>
          </div>
        </div>
        <button
          type="button"
          className={styles.passkeyOffer__submit}
          disabled={busy}
          onClick={savePasskey}
        >
          <FingerPrintIcon aria-hidden="true" />
          {busy ? "Waiting…" : "Create passkey"}
        </button>
        <button
          type="button"
          className={styles.passkeyOffer__skip}
          disabled={busy}
          onClick={finishWithoutPasskey}
        >
          Not now
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
