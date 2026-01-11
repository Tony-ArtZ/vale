"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import api from "@/lib/api";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const access = searchParams.get("access_token");
    const refresh = searchParams.get("refresh_token");

    if (access && refresh) {
      console.log("Received tokens from OAuth callback");

      // Update Zustand store
      useAuthStore.setState({
        accessToken: access,
        refreshToken: refresh,
        isAuthenticated: true,
        isLoading: false,
      });

      // Fetch user data with the new token
      api
        .get("/auth/user", {
          headers: {
            Authorization: `Bearer ${access}`,
          },
        })
        .then((res) => {
          console.log("User data fetched:", res.data);
          useAuthStore.setState({ user: res.data });
          router.push("/");
        })
        .catch((err) => {
          console.error("Failed to fetch user data:", err);
          router.push("/login");
        });
    } else {
      console.error("No tokens in callback URL");
      router.push("/login");
    }
  }, [searchParams, router]);

  return (
    <div className="h-screen w-full bg-black flex items-center justify-center text-white">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <p>Authenticating...</p>
      </div>
    </div>
  );
}

export default function AuthCallback() {
  return (
    <Suspense
      fallback={
        <div className="h-screen w-full bg-black flex items-center justify-center text-white">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <p>Loading...</p>
          </div>
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
