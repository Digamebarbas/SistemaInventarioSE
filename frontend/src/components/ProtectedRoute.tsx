"use client";
import { useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import apiClient from "@/lib/api";

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const verifyAuth = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) {
        router.replace("/login");
        return;
      }

      try {
        const meResponse = await apiClient.get("/auth/me/");
        localStorage.setItem("auth_me_cache", JSON.stringify(meResponse.data || {}));
        setLoading(false);
      } catch {
        localStorage.clear();
        router.replace("/login");
      }
    };

    verifyAuth();
  }, [router]);

  if (loading) return <div>Cargando...</div>;

  return <>{children}</>;
}
