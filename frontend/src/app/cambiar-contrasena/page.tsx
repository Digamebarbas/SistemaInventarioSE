"use client";

import apiClient from "@/lib/api";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

export default function CambiarContraseniaPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("Admin123");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const mustChange = localStorage.getItem("must_change_password");
    const token = localStorage.getItem("access_token");
    if (!mustChange || !token) {
      router.push("/login");
      return;
    }
    setIsAuthorized(true);
  }, [router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    if (newPassword.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    setLoading(true);

    try {
      await apiClient.post("/auth/change-password/", {
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });

      localStorage.removeItem("must_change_password");
      router.push("/dashboard");
    } catch (err) {
      const apiErr = err as { response?: { data?: { detail?: string } } };
      setError(apiErr.response?.data?.detail || "Error al cambiar contraseña. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100 px-4 py-8">
      <div className="w-full max-w-md rounded-3xl border border-amber-300 bg-white shadow-2xl">
        <div className="border-b border-amber-200 bg-gradient-to-r from-amber-500 to-orange-500 px-8 py-8 text-white">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-white/20">
            <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="5" y="11" width="14" height="8" rx="2" stroke="currentColor" strokeWidth="1.5" />
              <path d="M8 11V7C8 5 9 4 11 4H13C15 4 16 5 16 7V11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="12" cy="15" r="0.8" fill="currentColor" />
            </svg>
          </div>
          <h1 className="mt-4 text-3xl font-bold">Cambiar Contraseña</h1>
          <p className="mt-2 text-amber-100">Este es tu primer acceso. Establece una contraseña segura.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8">
          {error && (
            <div className="mb-6 flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
              <svg className="h-5 w-5 flex-shrink-0 text-red-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
                <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-800">Contraseña actual</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                autoComplete="current-password"
              />
              <p className="mt-1 text-xs text-slate-500">Esta es tu contraseña inicial: Admin123</p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-800">Nueva contraseña *</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                autoComplete="new-password"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-800">Confirmar contraseña *</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repite tu nueva contraseña"
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                autoComplete="new-password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !newPassword || !confirmPassword}
            className="mt-8 w-full rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 py-3 font-semibold text-white transition shadow-md hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Actualizando..." : "Actualizar Contraseña"}
          </button>

          <p className="mt-4 text-center text-xs text-slate-600">
            Una vez cambies tu contraseña, accederás al dashboard.
          </p>
        </form>
      </div>
    </div>
  );
}
