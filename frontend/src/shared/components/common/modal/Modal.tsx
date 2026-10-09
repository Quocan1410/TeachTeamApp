import React, { useEffect, useRef, useState, useCallback } from "react";
import CloseIcon from "@/shared/components/common/icons/CloseIcon";
import { lockBodyScroll, unlockBodyScroll } from "@/shared/utils/bodyScrollLock";
import styles from "./Modal.module.css";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: string;
  closeVariant?: "default" | "danger" | "icon";
}

const CLOSE_MS = 220;

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = "500px",
  closeVariant = "default",
}) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const [phase, setPhase] = useState<"from" | "open" | "leave">("from");
  const [spinning, setSpinning] = useState(false);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const beginClose = useCallback(() => {
    setSpinning(true);
    setPhase("leave");
  }, []);

  useEffect(() => {
    if (phase !== "leave") return;
    const timer = window.setTimeout(() => {
      onCloseRef.current();
    }, CLOSE_MS);
    return () => window.clearTimeout(timer);
  }, [phase]);

  useEffect(() => {
    if (!isOpen) return;

    setPhase("from");
    setSpinning(false);
    const frame = window.requestAnimationFrame(() => {
      setPhase("open");
    });

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") beginClose();
    };
    document.addEventListener("keydown", handleEscapeKey);
    lockBodyScroll();

    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("keydown", handleEscapeKey);
      unlockBodyScroll();
    };
  }, [isOpen, beginClose]);

  if (!isOpen) return null;

  const shown = phase === "open";

  return (
    <div
      className={`${styles.modalOverlay} ${shown ? styles.modalOverlayOpen : ""}`}
      onClick={(event) => {
        if (event.target === overlayRef.current) beginClose();
      }}
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "modal-title" : undefined}
    >
      <div
        className={`${styles.modalContainer} ${shown ? styles.modalContainerOpen : ""}`}
        style={{ maxWidth }}
      >
        <button
          type="button"
          onClick={beginClose}
          className={`${styles.modalClose} iconCloseHit iconCloseCircle ${
            closeVariant === "danger" ? styles.modalCloseDanger : ""
          } ${spinning ? styles.modalCloseSpin : ""}`}
          aria-label="Close modal"
        >
          <CloseIcon size={14} />
        </button>
        {title ? (
          <h2 id="modal-title" className="sr-only">
            {title}
          </h2>
        ) : null}
        {children}
      </div>
    </div>
  );
};

export default Modal;
