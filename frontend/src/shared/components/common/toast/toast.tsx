import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./toast.module.css";

interface ToastProps {
  message: string;
  visible: boolean;
  type?: "success" | "error" | "info" | "warning";
  onClose: () => void;
  variant?: "toast" | "inline";
  position?: "bottom-left" | "top-right" | "top-center" | "bottom-center";
  autoClose?: boolean;
  autoCloseDelay?: number;
  showCloseButton?: boolean;
  className?: string;
  title?: string;
  darkMode?: boolean;
}

const Toast: React.FC<ToastProps> = ({
  message,
  visible,
  type = "success",
  onClose,
  variant = "toast",
  position = "bottom-left",
  autoClose = true,
  autoCloseDelay = 3000,
  showCloseButton = true,
  className = "",
  title,
  darkMode = false,
}) => {
  const [timerKey, setTimerKey] = React.useState(0);

  React.useEffect(() => {
    if (visible && autoClose) {
      setTimerKey((key) => key + 1);
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseDelay);
      return () => clearTimeout(timer);
    }
  }, [visible, autoClose, autoCloseDelay, onClose, message]);

  // Get default title based on type
  const getDefaultTitle = () => {
    switch (type) {
      case "success": return "Success";
      case "error": return "Error";
      case "info": return "Informative";
      case "warning": return "Warning";
      default: return "Notification";
    }
  };

  const icons = {
    success: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={3.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M5 13l4 4L19 7"
        />
      </svg>
    ),
    error: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={3.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    ),
    info: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={3.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
    warning: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={3.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
        />
      </svg>
    ),
  };

  // Build CSS classes dynamically
  const getTypeClassName = () => {
    switch (type) {
      case "success": return styles.toast__toastSuccess;
      case "error": return styles.toast__toastError;
      case "info": return styles.toast__toastInfo;
      case "warning": return styles.toast__toastWarning;
      default: return styles.toast__toastSuccess;
    }
  };

  const variantClass =
    variant === "inline" ? styles["toast--inline"] : styles["toast--toast"];
  const positionClass =
    variant === "toast" ? styles[`toast--${position}`] : "";

  const containerClass = `
    ${styles.toast__toastNotification}
    ${getTypeClassName()}
    ${variantClass}
    ${positionClass}
    ${darkMode ? styles["toast--darkMode"] : ""}
    ${className}
  `.trim();

  // Animation variants based on position and variant
  const getAnimationVariants = () => {
    if (variant === "inline") {
      return {
        initial: { opacity: 0, height: 0, marginBottom: 0 },
        animate: { opacity: 1, height: "auto", marginBottom: "1rem" },
        exit: { opacity: 0, height: 0, marginBottom: 0 },
      };
    }

    // Toast variant animations based on position
    const isLeft = position.includes("left");
    const isRight = position.includes("right");
    const isTop = position.includes("top");
    const isBottom = position.includes("bottom");

    return {
      initial: { 
        opacity: 0, 
        x: isLeft ? -100 : isRight ? 100 : 0,
        y: isTop ? -100 : isBottom ? 100 : 0 
      },
      animate: { opacity: 1, x: 0, y: 0 },
      exit: { 
        opacity: 0, 
        x: isLeft ? -100 : isRight ? 100 : 0,
        y: isTop ? -100 : isBottom ? 100 : 0 
      },
    };
  };

  const animationVariants = getAnimationVariants();

  const keywordLines = message
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const stackedKeywords = !title && keywordLines.length > 1;

  const effectiveTitle = stackedKeywords
    ? ""
    : title ??
      (type === "error" && message.trim()
        ? message.trim()
        : getDefaultTitle());
  const effectiveMessage = stackedKeywords
    ? keywordLines.join("\n")
    : type === "error" && message.trim() && !title
      ? ""
      : message;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className={containerClass}
          initial={animationVariants.initial}
          animate={animationVariants.animate}
          exit={animationVariants.exit}
          transition={{ duration: 0.3 }}
        >
          {/* Floating icon at the top */}
          <div className={styles.toast__toastFloatingIcon}>
            {icons[type]}
          </div>
          
          {/* Main content wrapper */}
          <div className={styles.toast__toastInner}>
            {/* Left side with decorative circles */}
            <div className={styles.toast__toastDecorative}>
              <div className={styles.toast__circle1}></div>
              <div className={styles.toast__circle2}></div>
              <div className={styles.toast__circle3}></div>
            </div>
            
            {/* Content */}
            <div className={styles.toast__toastContentArea}>
              {effectiveTitle ? (
                <div className={styles.toast__toastHeader}>
                  <h2 className={styles.toast__toastTitle}>{effectiveTitle}</h2>
                </div>
              ) : null}
              {effectiveMessage ? (
                <p
                  className={`${styles.toast__toastMessage} ${
                    stackedKeywords ? styles["toast__toastMessage--keywords"] : ""
                  }`}
                >
                  {stackedKeywords
                    ? keywordLines.map((line) => <span key={line}>{line}</span>)
                    : effectiveMessage}
                </p>
              ) : null}
            </div>
            
            {/* Close button at top right corner */}
            {autoClose && (
              <span
                key={timerKey}
                className={styles.toast__toastTimer}
                style={{ animationDuration: `${autoCloseDelay}ms` }}
              />
            )}

            {showCloseButton && (
              <button
                type="button"
                className={`${styles.toast__toastClose} iconClose__hit iconClose__circle`}
                onClick={onClose}
                aria-label="Close toast"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Toast;