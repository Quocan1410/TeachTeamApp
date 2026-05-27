"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
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

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setIsDarkMode(true);
      applyDomTheme(true);
      setIsHydrated(true);
      return;
    }
    const dark = (user.theme ?? "dark") === "dark";
    setIsDarkMode(dark);
    applyDomTheme(dark);
    setIsHydrated(true);
  }, [isAuthenticated, user]);

  const toggleDarkMode = async () => {
    const next = !isDarkMode;
    setIsDarkMode(next);
    applyDomTheme(next);

    if (isAuthenticated && user) {
      const theme = next ? "dark" : "light";
      const res = await AuthService.updateTheme(theme);
      if (res.success && res.data?.user) {
        AuthService.saveUser(res.data.user);
        updateUser(res.data.user);
      }
    }
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
