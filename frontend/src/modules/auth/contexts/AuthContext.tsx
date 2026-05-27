"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { AuthService } from "../../../shared/services/authService";
import { User } from "../../../shared/types/user";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isLoggingOut: boolean;
  login: (user: User, token: string) => void;
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
    // Check if user is already logged in on app start
    const initializeAuth = async () => {
      try {
        const token = AuthService.getToken();
        const savedUser = AuthService.getUser();

        if (token && savedUser) {
          // Set user immediately from localStorage for better UX
          setUser(savedUser);

          // Verify token is still valid by making an API call
          try {
            const response = await AuthService.getProfile();
            if (response.success && response.data) {
              // Update user data from server if different
              if (
                JSON.stringify(savedUser) !== JSON.stringify(response.data.user)
              ) {
                setUser(response.data.user);
                AuthService.saveUser(response.data.user);
              }
            } else {
              // Token is invalid, clear local storage and state
              AuthService.removeToken();
              AuthService.removeUser();
              setUser(null);
            }
          } catch (profileError) {
            console.warn(
              "Profile verification failed, keeping local user data:",
              profileError
            );
            // Keep the local user data if network error, don't logout user
          }
        } else {
          // No token or user data, ensure clean state
          setUser(null);
        }
      } catch (initError) {
        console.error("Auth initialization error:", initError);
        // Error during initialization, clear local storage
        AuthService.removeToken();
        AuthService.removeUser();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = (user: User, token: string) => {
    AuthService.saveToken(token);
    AuthService.saveUser(user);
    setUser(user);
  };

  const logout = async () => {
    setIsLoggingOut(true);
    try {
      // Call backend logout endpoint
      await AuthService.logout();
    } catch (error) {
      console.error("Logout API call failed:", error);
    } finally {
      // Always clear local state and storage
      AuthService.removeToken();
      AuthService.removeUser();
      setUser(null);
      setIsLoggingOut(false);
      // Hard redirect to guarantee fresh unauthenticated app state.
      window.location.replace("/signin");
    }
  };

  const updateUser = (updatedUser: User) => {
    AuthService.saveUser(updatedUser);
    setUser(updatedUser);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    isLoggingOut,
    login,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
