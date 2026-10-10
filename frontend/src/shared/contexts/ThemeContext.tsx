"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { AuthService } from "@/shared/services/authService";

interface ThemeContextType {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  isHydrated: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const applyDomTheme = (dark: boolean) => {
  if (typeof document === "undefined") return;
  if (dark) {
    document.documentElement.setAttribute("data-theme", "dark");
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.setAttribute("data-theme", "light");
    document.documentElement.classList.remove("dark");
  }
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user, isAuthenticated, updateUser } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isHydrated, setIsHydrated] = useState(false);
  const appliedTheme = useRef<"light" | "dark" | null>(null);
  const pendingTheme = useRef<"light" | "dark" | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      if (appliedTheme.current !== "dark") {
        appliedTheme.current = "dark";
        setIsDarkMode(true);
        applyDomTheme(true);
      }
      setIsHydrated(true);
      return;
    }

    if (pendingTheme.current) {
      if (user.theme === pendingTheme.current) {
        pendingTheme.current = null;
      }
      setIsHydrated(true);
      return;
    }

    if (user.theme !== "light" && user.theme !== "dark") {
      setIsHydrated(true);
      return;
    }

    if (appliedTheme.current === user.theme) {
      setIsHydrated(true);
      return;
    }

    appliedTheme.current = user.theme;
    const dark = user.theme === "dark";
    setIsDarkMode(dark);
    applyDomTheme(dark);
    setIsHydrated(true);
  }, [isAuthenticated, user]);

  const toggleDarkMode = async () => {
    const next = !isDarkMode;
    const theme = next ? "dark" : "light";
    const previous = appliedTheme.current;
    pendingTheme.current = theme;
    appliedTheme.current = theme;
    setIsDarkMode(next);
    applyDomTheme(next);

    if (!isAuthenticated || !user) {
      pendingTheme.current = null;
      return;
    }

    const res = await AuthService.updateTheme(theme);
    if (res.success && res.data?.user) {
      updateUser({ ...res.data.user, theme });
      return;
    }

    pendingTheme.current = null;
    const revert = previous === "light" ? "light" : "dark";
    appliedTheme.current = revert;
    setIsDarkMode(revert === "dark");
    applyDomTheme(revert === "dark");
  };

  return (
    <ThemeContext.Provider
      value={{ isDarkMode, toggleDarkMode, isHydrated }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
