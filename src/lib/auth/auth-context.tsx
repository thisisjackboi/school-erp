"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { login as loginApi } from "@/lib/api/auth.api";
import { API_BASE_URL } from "@/lib/api/config";
import type { AuthUser, LoginRequest } from "@/lib/types/auth";

interface AuthContextType {
  accessToken: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessTokenState] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("accessToken");
    }
    return null;
  });

  const [user, setUserState] = useState<AuthUser | null>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("authUser");
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {
          return null;
        }
      }
    }
    return null;
  });

  const [isLoading, setIsLoading] = useState(true);

  const saveAuthData = (token: string | null, userData: AuthUser | null) => {
    setAccessTokenState(token);
    setUserState(userData);

    if (typeof window !== "undefined") {
      if (token) {
        localStorage.setItem("accessToken", token);
      } else {
        localStorage.removeItem("accessToken");
      }

      if (userData) {
        localStorage.setItem("authUser", JSON.stringify(userData));
      } else {
        localStorage.removeItem("authUser");
      }
    }
  };

  const login = useCallback(async (credentials: LoginRequest) => {
    setIsLoading(true);

    try {
      const result = await loginApi(credentials);
      saveAuthData(result.data.accessToken, result.data.user);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshAccessToken = useCallback(async (): Promise<string | null> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        // Fallback to currently stored localStorage token if available
        const currentToken = localStorage.getItem("accessToken");
        if (currentToken) {
          return currentToken;
        }
        saveAuthData(null, null);
        return null;
      }

      saveAuthData(result.data.accessToken, result.data.user);
      return result.data.accessToken;
    } catch {
      const currentToken = localStorage.getItem("accessToken");
      if (currentToken) {
        return currentToken;
      }
      saveAuthData(null, null);
      return null;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: "DELETE",
        credentials: "include",
      });
    } finally {
      saveAuthData(null, null);
    }
  }, []);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        await refreshAccessToken();
      } finally {
        setIsLoading(false);
      }
    };

    void initializeAuth();
  }, [refreshAccessToken]);

  return (
    <AuthContext.Provider
      value={{
        accessToken,
        user,
        isAuthenticated: Boolean(accessToken && user),
        isLoading,
        login,
        logout,
        refreshAccessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
