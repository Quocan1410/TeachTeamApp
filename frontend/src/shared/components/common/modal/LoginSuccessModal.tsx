"use client";

import React, { useState, useEffect, useCallback } from "react";
import { User } from "../../../types/user";
import { getUserDisplayName } from "@/shared/utils/personDisplayName";
import styles from "./LoginSuccessModal.module.css";

interface LoginSuccessModalProps {
  user: User;
  isVisible: boolean;
  onHide: () => void;
  duration?: number; // Duration to show the modal in milliseconds
  isPreparing?: boolean;
}

export const LoginSuccessModal: React.FC<LoginSuccessModalProps> = ({
  user,
  isVisible,
  onHide,
  duration = 3000,
  isPreparing = false,
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [showFireworks, setShowFireworks] = useState(false);

  const handleHide = useCallback(() => {
    if (isPreparing) return;
    setShowFireworks(false);
    // Navigate immediately to avoid a brief white gap between modal and route loading.
    onHide();
  }, [isPreparing, onHide]);

  const handleContinueClick = useCallback(() => {
    if (isPreparing) return;
    setShowFireworks(true);
    setTimeout(() => {
      handleHide();
    }, 1500);
  }, [handleHide, isPreparing]);

  // Start animation when modal becomes visible
  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
    }
  }, [isVisible]);

  // Auto-continue once prefetch finishes (same path as the Continue button).
  useEffect(() => {
    if (!isVisible || isPreparing) return;

    const timer = setTimeout(() => {
      handleContinueClick();
    }, duration);

    return () => clearTimeout(timer);
  }, [isVisible, isPreparing, duration, handleContinueClick]);

  // Enter on keyboard uses the same handler as clicking Continue.
  useEffect(() => {
    if (!isVisible) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Enter") return;
      event.preventDefault();
      handleContinueClick();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isVisible, handleContinueClick]);

  const getWelcomeMessage = () => {
    return `Welcome back, ${getUserDisplayName(user)}!`;
  };

  if (!isVisible) {
    return null;
  }

  return (
    <>
      {/* Modal Overlay */}
      <div
        className={`${styles.modalOverlay} ${isAnimating ? styles.visible : styles.hidden}`}
        onClick={isPreparing ? undefined : handleHide}
      >
        {/* Modal Content */}
        <div 
          className={`${styles.modalContent} ${isAnimating ? styles.animated : ''}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Success Icon with Enhanced Checkmark */}
          <div className={styles.successIcon}>
            <div className={styles.checkmark}>
              <svg viewBox="0 0 52 52" className={styles.checkmarkSvg}>
                <circle 
                  className={styles.checkmarkCircle} 
                  cx="26" 
                  cy="26" 
                  r="25" 
                  fill="none"
                />
                <path 
                  className={styles.checkmarkCheck} 
                  fill="none" 
                  d="m14.1 27.2l7.1 7.2 16.7-16.8"
                />
              </svg>
            </div>
            {/* Pulse rings for enhanced effect */}
            <div className={styles.pulseRing}></div>
            <div className={styles.pulseRing} style={{ animationDelay: '0.3s' }}></div>
          </div>

          {/* Simplified Message Section */}
          <div className={styles.messageSection}>
            <h2 className={styles.welcomeTitle}>Success!</h2>
            <h3 className={styles.welcomeMessage}>{getWelcomeMessage()}</h3>
          </div>

          {/* Continue Button with Fireworks Effect */}
          <div className={styles.buttonContainer}>
            <button
              type="button"
              className={`${styles.continueButton} ${showFireworks ? styles.fireworksActive : ''}`}
              onClick={handleContinueClick}
              aria-label="Continue to dashboard"
              disabled={isPreparing}
              autoFocus={!isPreparing}
            >
              <span className={styles.buttonText}>
                {isPreparing ? "Preparing dashboard..." : "Continue"}
              </span>
              {showFireworks && (
                <div className={styles.fireworksContainer}>
                  {[...Array(8)].map((_, i) => (
                    <div 
                      key={i} 
                      className={styles.firework} 
                      style={{ 
                        '--angle': `${i * 45}deg`,
                        '--delay': `${i * 0.1}s` 
                      } as React.CSSProperties}
                    />
                  ))}
                </div>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}; 