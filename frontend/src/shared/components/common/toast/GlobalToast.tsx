"use client";

import React from "react";
import Toast from "./toast";
import { useTheme } from "@/shared/contexts/ThemeContext";

interface GlobalToastProps {
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
}

const GlobalToast: React.FC<GlobalToastProps> = (props) => {
  const { isDarkMode } = useTheme();

  return <Toast {...props} darkMode={isDarkMode} />;
};

export default GlobalToast; 