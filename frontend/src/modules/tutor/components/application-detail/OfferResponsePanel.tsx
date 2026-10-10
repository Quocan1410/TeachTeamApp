"use client";

import React, { useState } from "react";
import styles from "./OfferResponsePanel.module.css";

interface OfferResponsePanelProps {
  busy: boolean;
  onSubmit: (decision: "accept" | "decline", message: string) => Promise<void>;
}

const OfferResponsePanel: React.FC<OfferResponsePanelProps> = ({
  busy,
  onSubmit,
}) => {
  const [message, setMessage] = useState("");
  const [pendingDecision, setPendingDecision] = useState<
    "accept" | "decline" | null
  >(null);

  const trimmed = message.trim();
  const canSubmit = trimmed.length > 0 && !busy;

  const handleSubmit = async (decision: "accept" | "decline") => {
    if (!canSubmit) return;
    setPendingDecision(decision);
    try {
      await onSubmit(decision, trimmed);
      setMessage("");
    } finally {
      setPendingDecision(null);
    }
  };

  return (
    <section className={styles.offerResponsePanel__panel} aria-label="Respond to offer">
      <h3 className={styles.offerResponsePanel__title}>You have been selected</h3>
      <p className={styles.offerResponsePanel__hint}>
        Confirm whether you accept this offer and include a message for the
        lecturer.
      </p>
      <textarea
        className={styles.offerResponsePanel__input}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Share your availability, questions, or confirmation…"
        maxLength={3000}
        disabled={busy}
        rows={3}
      />
      <div className={styles.offerResponsePanel__actions}>
        <button
          type="button"
          className={`${styles.offerResponsePanel__btn} ${styles.offerResponsePanel__btnAccept}`}
          onClick={() => void handleSubmit("accept")}
          disabled={!canSubmit || pendingDecision === "decline"}
        >
          {pendingDecision === "accept" ? "Sending…" : "Accept offer"}
        </button>
        <button
          type="button"
          className={`${styles.offerResponsePanel__btn} ${styles.offerResponsePanel__btnDecline}`}
          onClick={() => void handleSubmit("decline")}
          disabled={!canSubmit || pendingDecision === "accept"}
        >
          {pendingDecision === "decline" ? "Sending…" : "Decline offer"}
        </button>
      </div>
    </section>
  );
};

export default OfferResponsePanel;
