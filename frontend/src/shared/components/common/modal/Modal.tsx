import React, { useEffect, useRef, useState, useCallback } from "react";
import CloseIcon from "@/shared/components/common/icons/CloseIcon";
import styles from "./Modal.module.css";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: string; // e.g., '500px', '800px', '90%'
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = "500px",
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleClose = useCallback(() => {
    setIsAnimating(false);
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    // Add gentle animation delay before closing
    timeoutRef.current = setTimeout(() => {
      // Check if component is still mounted before calling onClose
      if (modalRef.current) {
        onClose();
      }
    }, 200);
  }, [onClose]);

  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = "hidden";
      document.addEventListener("keydown", handleEscapeKey);
      setIsAnimating(true);
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
      document.body.style.overflow = "unset"; // Ensure overflow is reset on unmount
      // Clear timeout on cleanup
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isOpen, handleClose]);

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (modalRef.current && e.target === modalRef.current) {
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={`${styles.modalOverlay} ${isAnimating ? styles.modalOverlayActive : styles.modalOverlayClosing}`}
      onClick={handleOverlayClick}
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "modal-title" : undefined}
    >
      <div
        className={`${styles.modalContainer} ${isAnimating ? styles.modalContainerActive : styles.modalContainerClosing}`}
        style={{ maxWidth }}
      >
        <button
          type="button"
          onClick={handleClose}
          className={`${styles.modalClose} iconCloseHit`}
          aria-label="Close modal"
        >
          <CloseIcon size={14} />
        </button>
        {children}
      </div>
    </div>
  );
};

export default Modal;
