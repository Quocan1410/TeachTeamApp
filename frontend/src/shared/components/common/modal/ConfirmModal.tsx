"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  lockBodyScroll,
  unlockBodyScroll,
} from "@/shared/utils/bodyScrollLock";
import styles from "./ConfirmModal.module.css";

export interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "danger";
  actionsLayout?: "end" | "split";
  busy?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

function ModalIcon({ variant }: { variant: "default" | "danger" }) {
  if (variant === "danger") {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
        <path
          fillRule="evenodd"
          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
          clipRule="evenodd"
        />
      </svg>
    );
  }

  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path
        fillRule="evenodd"
        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
        clipRule="evenodd"
      />
    </svg>
  );
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  actionsLayout = "end",
  busy = false,
  onConfirm,
  onClose,
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    lockBodyScroll();

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      unlockBodyScroll();
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, busy, onClose]);

  if (!isOpen || !mounted) return null;

  const isSplit = actionsLayout === "split";

  return createPortal(
    <div
      className={styles.backdrop}
      role="presentation"
      onClick={() => {
        if (!busy) onClose();
      }}
    >
      <div
        className={styles.panel}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        aria-describedby={message ? "confirm-modal-message" : undefined}
        onClick={(event) => event.stopPropagation()}
      >
        <div
          className={`${styles.iconWrap} ${
            variant === "danger" ? styles.iconWrapDanger : styles.iconWrapDefault
          }`}
        >
          <ModalIcon variant={variant} />
        </div>

        <h2 id="confirm-modal-title" className={styles.title}>
          {title}
        </h2>

        {message ? (
          <p id="confirm-modal-message" className={styles.message}>
            {message}
          </p>
        ) : null}

        <div className={isSplit ? styles.actionsSplit : styles.actions}>
          <button
            type="button"
            className={`${styles.cancelBtn} ${isSplit ? styles.cancelBtnSplit : ""}`}
            onClick={onClose}
            disabled={busy}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`${styles.confirmBtn} ${
              variant === "danger" ? styles.confirmBtnDanger : ""
            } ${isSplit ? styles.confirmBtnSplit : ""}`}
            onClick={onConfirm}
            disabled={busy}
            autoFocus
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ConfirmModal;
