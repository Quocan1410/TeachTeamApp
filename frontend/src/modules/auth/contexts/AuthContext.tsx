"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { AuthService } from "../../../shared/services/authService";
import { User } from "../../../shared/types/user";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isLoggingOut: boolean;
  login: (user: User) => void;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const initializeAuth = async () => {
      try {
        const response = await AuthService.getProfile();
        if (cancelled) return;

        if (response.success && response.data) {
          setUser(response.data.user);
          AuthService.saveUser(response.data.user);
          return;
        }

        AuthService.removeUser();
        setUser(null);
      } catch (initError) {
        if (cancelled) return;
        console.error("Auth initialization error:", initError);
        AuthService.removeUser();
        setUser(null);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void initializeAuth();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback((loggedInUser: User) => {
    AuthService.saveUser(loggedInUser);
    setUser(loggedInUser);
  }, []);

  const logout = useCallback(async () => {
    setIsLoggingOut(true);
    try {
      await AuthService.logout();
    } catch (error) {
      console.error("Logout API call failed:", error);
    } finally {
      AuthService.removeUser();
      setUser(null);
      setIsLoggingOut(false);
      window.location.replace("/signin");
    }
  }, []);

  const updateUser = useCallback((updatedUser: User) => {
    AuthService.saveUser(updatedUser);
    setUser(updatedUser);
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading,
      isLoggingOut,
      login,
      logout,
      updateUser,
    }),
    [user, isLoading, isLoggingOut, login, logout, updateUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
