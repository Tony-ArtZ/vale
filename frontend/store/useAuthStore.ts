import { create } from "zustand";
import { persist } from "zustand/middleware";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

interface User {
  userId: string;
  userName: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  _hasHydrated: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (username: string, email: string, pass: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  refreshAccessToken: () => Promise<boolean>;
}

const authApi = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      _hasHydrated: false,

      setTokens: (accessToken, refreshToken) => {
        set({
          accessToken,
          refreshToken,
          isAuthenticated: true,
        });
      },

      refreshAccessToken: async () => {
        const { refreshToken, logout } = get();

        if (!refreshToken) {
          logout();
          return false;
        }

        try {
          const response = await authApi.post("/auth/refreshtoken", {
            refreshToken,
          });

          const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
            response.data;

          if (!newAccessToken || !newRefreshToken) {
            throw new Error("Invalid refresh response");
          }

          set({
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
            isAuthenticated: true,
          });

          return true;
        } catch (error) {
          console.error("Token refresh failed:", error);
          logout();
          return false;
        }
      },

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.post("/auth/login", {
            email,
            password,
          });
          const { accessToken, refreshToken } = response.data;

          if (!accessToken) throw new Error("Invalid response");

          set({
            accessToken,
            refreshToken,
            isAuthenticated: true,
            isLoading: false,
          });

          // Fetch user info immediately after login
          try {
            const userRes = await authApi.get("/auth/user", {
              headers: { Authorization: `Bearer ${accessToken}` },
            });
            set({ user: userRes.data });
          } catch (e) {
            console.error("Failed to fetch user details", e);
          }
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error && "response" in error
              ? (error as { response?: { data?: { message?: string } } })
                  .response?.data?.message || "Login failed"
              : "Login failed";
          set({
            error: errorMessage,
            isLoading: false,
          });
          throw error;
        }
      },

      register: async (userName, email, password) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.post("/auth/register", {
            userName,
            email,
            password,
          });
          const { accessToken, refreshToken } = response.data;

          if (!accessToken) throw new Error("Invalid response");

          set({
            accessToken,
            refreshToken,
            isAuthenticated: true,
            isLoading: false,
          });

          // Fetch user info
          try {
            const userRes = await authApi.get("/auth/user", {
              headers: { Authorization: `Bearer ${accessToken}` },
            });
            set({ user: userRes.data });
          } catch {
            // Fallback to just the username
            set({ user: { userId: "", userName } });
          }
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error && "response" in error
              ? (error as { response?: { data?: { message?: string } } })
                  .response?.data?.message || "Registration failed"
              : "Registration failed";
          set({
            error: errorMessage,
            isLoading: false,
          });
          throw error;
        }
      },

      logout: () => {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          error: null,
        });
        // Clear persisted storage
        if (typeof window !== "undefined") {
          localStorage.removeItem("auth-storage");
        }
      },

      setUser: (user) => set({ user }),
    }),
    {
      name: "auth-storage",
      onRehydrateStorage: () => {
        return () => {
          // This is called after rehydration completes
          // We set the flag after the store is created
          setHasHydrated(true);
        };
      },
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
        user: state.user,
      }),
    }
  )
);

// Helper to set hydration state after store is created
const setHasHydrated = (value: boolean) => {
  useAuthStore.setState({ _hasHydrated: value });
};
