"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  login as loginApi,
  getProfile,
} from "@/lib/api/auth.api";
import { API_BASE_URL } from "@/lib/api/config";
import type {
  AuthUser,
  AuthUserRole,
  AuthUserPermission,
  LoginRequest,
} from "@/lib/types/auth";

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

/**
 * The backend `/auth/profile` endpoint returns the user resolved by the
 * JWT strategy, whose `roles` and `permissions` are string arrays
 * (e.g. `["SUPER_ADMIN"]` and `["students.read", ...]`). This function
 * normalizes them into the object shapes the frontend role system expects.
 */
function normalizeProfile(profile: any): {
  roles: AuthUserRole[];
  permissions: AuthUserPermission[];
} {
  const roles: AuthUserRole[] = Array.isArray(profile.roles)
    ? profile.roles.map((r: any) =>
        typeof r === "string" ? { id: r, name: r } : r,
      )
    : [];

  const permissions: AuthUserPermission[] = Array.isArray(
    profile.permissions,
  )
    ? profile.permissions.map((p: any) =>
        typeof p === "string"
          ? { id: p, code: p, module: p.split(".")[0] }
          : p,
      )
    : [];

  return { roles, permissions };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessTokenState] = useState<string | null>(
    () => {
      if (typeof window !== "undefined") {
        return localStorage.getItem("accessToken");
      }
      return null;
    },
  );

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

  const userRef = useRef<AuthUser | null>(null);

  const saveAuthData = (
    token: string | null,
    userData: AuthUser | null,
  ) => {
    userRef.current = userData;
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

  /**
   * Fetch the authenticated user's real roles + permissions from the
   * database via `/auth/profile`. This is the single source of truth for
   * the RBAC checks performed across the UI.
   */
  const enrichUserWithProfile = useCallback(
    async (
      token: string | null,
      baseUser: AuthUser,
    ): Promise<AuthUser> => {
      try {
        const profile = await getProfile(token);
        const { roles, permissions } = normalizeProfile(profile);
        return {
          ...baseUser,
          employeeId:
            profile.employeeId ??
            baseUser.employeeId ??
            null,
          roles,
          permissions,
        };
      } catch (error) {
        console.error("Failed to load user profile", error);
        return baseUser;
      }
    },
    [],
  );

  const login = useCallback(
    async (credentials: LoginRequest) => {
      setIsLoading(true);

      try {
        const result = await loginApi(credentials);
        const token = result.data.accessToken;
        const baseUser = result.data.user;

        saveAuthData(token, baseUser);

        const enriched = await enrichUserWithProfile(token, baseUser);
        saveAuthData(token, enriched);
      } finally {
        setIsLoading(false);
      }
    },
    [enrichUserWithProfile],
  );

  const refreshAccessToken = useCallback(async (): Promise<string | null> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        const currentToken = localStorage.getItem("accessToken");
        if (currentToken) {
          return currentToken;
        }
        saveAuthData(null, null);
        return null;
      }

      const token = result.data.accessToken;
      const baseUser = result.data.user ?? userRef.current;

      saveAuthData(token, baseUser);

      if (baseUser) {
        const enriched = await enrichUserWithProfile(token, baseUser);
        saveAuthData(token, enriched);
      }

      return token;
    } catch {
      const currentToken = localStorage.getItem("accessToken");
      if (currentToken) {
        return currentToken;
      }
      saveAuthData(null, null);
      return null;
    }
  }, [enrichUserWithProfile]);

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