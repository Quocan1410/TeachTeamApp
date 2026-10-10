"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { User } from "@/shared/types/user";
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
  const onHideRef = useRef(onHide);
  const preparingRef = useRef(isPreparing);
  onHideRef.current = onHide;
  preparingRef.current = isPreparing;

  const hideNow = useCallback(() => {
    if (preparingRef.current) return;
    setShowFireworks(false);
    onHideRef.current();
  }, []);

  const handleContinueClick = useCallback(() => {
    if (preparingRef.current) return;
    setShowFireworks(true);
  }, []);

  // Start animation when modal becomes visible
  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
    }
  }, [isVisible]);

  // Leave the success modal after the fireworks, even if the parent re-renders.
  useEffect(() => {
    if (!showFireworks) return;
    const timer = window.setTimeout(() => {
      setShowFireworks(false);
      onHideRef.current();
    }, 1500);
    return () => window.clearTimeout(timer);
  }, [showFireworks]);

  // Auto-continue once prefetch finishes (same path as the Continue button).
  useEffect(() => {
    if (!isVisible || isPreparing) return;

    const timer = window.setTimeout(() => {
      if (preparingRef.current) return;
      setShowFireworks(true);
    }, duration);

    return () => window.clearTimeout(timer);
  }, [isVisible, isPreparing, duration]);

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
        className={`${styles.loginSuccessModal__modalOverlay} ${isAnimating ? styles["loginSuccessModal--visible"] : styles["loginSuccessModal--hidden"]}`}
        onClick={isPreparing ? undefined : hideNow}
      >
        {/* Modal Content */}
        <div 
          className={`${styles.loginSuccessModal__modalContent} ${isAnimating ? styles["loginSuccessModal--animated"] : ''}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Success Icon with Enhanced Checkmark */}
          <div className={styles.loginSuccessModal__successIcon}>
            <div className={styles.loginSuccessModal__checkmark}>
              <svg viewBox="0 0 52 52" className={styles.loginSuccessModal__checkmarkSvg}>
                <circle 
                  className={styles.loginSuccessModal__checkmarkCircle} 
                  cx="26" 
                  cy="26" 
                  r="25" 
                  fill="none"
                />
                <path 
                  className={styles.loginSuccessModal__checkmarkCheck} 
                  fill="none" 
                  d="m14.1 27.2l7.1 7.2 16.7-16.8"
                />
              </svg>
            </div>
            {/* Pulse rings for enhanced effect */}
            <div className={styles.loginSuccessModal__pulseRing}></div>
            <div className={styles.loginSuccessModal__pulseRing} style={{ animationDelay: '0.3s' }}></div>
          </div>

          {/* Simplified Message Section */}
          <div className={styles.loginSuccessModal__messageSection}>
            <h2 className={styles.loginSuccessModal__welcomeTitle}>Success!</h2>
            <h3 className={styles.loginSuccessModal__welcomeMessage}>{getWelcomeMessage()}</h3>
          </div>

          {/* Continue Button with Fireworks Effect */}
          <div className={styles.loginSuccessModal__buttonContainer}>
            <button
              type="button"
              className={`${styles.loginSuccessModal__continueButton} ${showFireworks ? styles.fireworksActive : ''}`}
              onClick={handleContinueClick}
              aria-label="Continue to dashboard"
              disabled={isPreparing}
              autoFocus={!isPreparing}
            >
              <span className={styles.loginSuccessModal__buttonText}>
                {isPreparing ? "Preparing dashboard..." : "Continue"}
              </span>
              {showFireworks && (
                <div className={styles.loginSuccessModal__fireworksContainer}>
                  {[...Array(8)].map((_, i) => (
                    <div 
                      key={i} 
                      className={styles.loginSuccessModal__firework} 
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