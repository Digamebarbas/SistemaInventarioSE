"use client";
import apiClient from "@/lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";

type CompanyOption = {
  id: number;
  name: string;
  slug: string;
};

const getInitialRememberedUsername = () => {
  if (typeof window === "undefined") {
    return "";
  }
  return localStorage.getItem("remembered_username") || "";
};

export default function LoginPage() {
  const initialRememberedUsername = getInitialRememberedUsername();
  const [username, setUsername] = useState(initialRememberedUsername);
  const [password, setPassword] = useState("");
  const [rememberUser, setRememberUser] = useState(Boolean(initialRememberedUsername));
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [companySlug, setCompanySlug] = useState("");
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const loadCompanies = async () => {
      try {
        const res = await apiClient.get("/auth/companies/");
        const loadedCompanies = Array.isArray(res.data) ? (res.data as CompanyOption[]) : [];
        const onboardingCompanySlug = localStorage.getItem("onboarding_company_slug") || "";
        const onboardingAdminEmail = localStorage.getItem("onboarding_admin_email") || "";
        const onboardingAdminPassword = localStorage.getItem("onboarding_admin_default_password") || "";

        setCompanies(loadedCompanies);
        if (loadedCompanies.length > 0) {
          const foundCreatedCompany = loadedCompanies.find((company) => company.slug === onboardingCompanySlug);
          setCompanySlug(foundCreatedCompany?.slug || loadedCompanies[0].slug);
        }

        if (onboardingAdminEmail && !initialRememberedUsername) {
          setUsername(onboardingAdminEmail);
        }
        if (onboardingAdminPassword) {
          setPassword(onboardingAdminPassword);
        }
      } catch {
        setCompanies([]);
      } finally {
        setLoadingCompanies(false);
      }
    };

    loadCompanies();
  }, [initialRememberedUsername]);

  const canSubmit = useMemo(() => {
    return Boolean(username.trim() && password.trim() && companySlug.trim() && !loadingCompanies);
  }, [username, password, companySlug, loadingCompanies]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    const normalizedUsername = username.trim().toLowerCase();

    try {
      const res = await apiClient.post("/auth/token/", {
        username: normalizedUsername,
        password,
        company_slug: companySlug,
      });
      localStorage.setItem("access_token", res.data.access);
      localStorage.setItem("refresh_token", res.data.refresh);
      if (res.data?.company?.slug) {
        localStorage.setItem("active_company_slug", String(res.data.company.slug));
      }
      if (res.data?.company?.name) {
        localStorage.setItem("active_company_name", String(res.data.company.name));
      }
      const mustChangePassword = Boolean(res.data?.must_change_password);
      if (mustChangePassword) {
        localStorage.setItem("must_change_password", "true");
        router.push("/cambiar-contrasena");
        return;
      }
      localStorage.removeItem("must_change_password");

      if (rememberUser) {
        localStorage.setItem("remembered_username", normalizedUsername);
      } else {
        localStorage.removeItem("remembered_username");
      }

      router.push("/dashboard");
    } catch (err) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || "Error al iniciar sesión");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4 py-8">
      <div className="w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="grid gap-0 lg:grid-cols-2">
          {/* Left Side - Branding & Illustration */}
          <div className="hidden flex-col justify-between bg-gradient-to-br from-blue-600 to-blue-700 p-12 text-white lg:flex">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 backdrop-blur-sm">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="4" y="6" width="16" height="12" fill="none" stroke="currentColor" strokeWidth="1.5" rx="1"/>
                  <path d="M4 10h16M12 6v12" stroke="currentColor" strokeWidth="1.5"/>
                </svg>
                <span className="text-sm font-medium">Sistema de Inventario</span>
              </div>
              <h2 className="mt-8 text-4xl font-bold leading-tight">Sistema de Inventario y Trazabilidad</h2>
              <p className="mt-6 text-base text-blue-100 leading-relaxed">
                Administra entradas, salidas y stock crítico en una plataforma clara y centralizada. Control total de tu inventario en tiempo real.
              </p>
            </div>

            {/* SVG Illustration */}
            <svg className="h-48 w-full" viewBox="0 0 300 300" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Warehouse/Boxes Illustration */}
              <rect x="40" y="120" width="60" height="70" fill="rgba(255,255,255,0.1)" stroke="white" strokeWidth="2" rx="4" />
              <rect x="120" y="100" width="60" height="90" fill="rgba(255,255,255,0.15)" stroke="white" strokeWidth="2" rx="4" />
              <rect x="200" y="130" width="60" height="60" fill="rgba(255,255,255,0.1)" stroke="white" strokeWidth="2" rx="4" />
              
              {/* Box Labels */}
              <line x1="60" y1="140" x2="100" y2="140" stroke="white" strokeWidth="1.5" strokeDasharray="2,2" opacity="0.6" />
              <line x1="140" y1="130" x2="180" y2="130" stroke="white" strokeWidth="1.5" strokeDasharray="2,2" opacity="0.6" />
              <line x1="220" y1="150" x2="260" y2="150" stroke="white" strokeWidth="1.5" strokeDasharray="2,2" opacity="0.6" />
              
              {/* Arrow showing flow */}
              <path d="M 80 200 Q 120 220 160 200" stroke="white" strokeWidth="2.5" fill="none" markerEnd="url(#arrowhead)" opacity="0.8" />
              <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                  <polygon points="0 0, 10 3, 0 6" fill="white" />
                </marker>
              </defs>
              
              {/* Checkmark */}
              <circle cx="220" cy="60" r="25" stroke="white" strokeWidth="2" fill="none" opacity="0.8" />
              <path d="M 210 60 L 218 68 L 235 50" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          {/* Right Side - Login Form */}
          <form onSubmit={handleSubmit} className="flex flex-col justify-center p-8 md:p-12">
            <div className="mb-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h1 className="text-3xl font-bold text-slate-900">Iniciar sesión</h1>
                <Link
                  href="/configuracion-inicial"
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  Crear nueva empresa
                </Link>
              </div>
              <p className="mt-2 text-slate-600">Ingresa tus credenciales para continuar.</p>
            </div>

            {error && (
              <div className="mb-6 flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                <svg className="h-5 w-5 flex-shrink-0 text-red-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-800">Empresa</label>
                <select
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  value={companySlug}
                  onChange={(e) => setCompanySlug(e.target.value)}
                  disabled={loadingCompanies}
                >
                  {loadingCompanies && <option value="">Cargando empresas...</option>}
                  {!loadingCompanies && companies.length === 0 && <option value="">No hay empresas disponibles</option>}
                  {!loadingCompanies &&
                    companies.map((company) => (
                      <option key={company.id} value={company.slug}>
                        {company.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-800">Usuario</label>
                <input
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  type="text"
                  placeholder="admin"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-800">Contraseña</label>
                <input
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <label className="flex items-center gap-3 text-sm text-slate-700 font-medium cursor-pointer hover:text-slate-900 transition">
                <input
                  type="checkbox"
                  checked={rememberUser}
                  onChange={(e) => setRememberUser(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <span>Recordar usuario</span>
              </label>
            </div>

            <button 
              type="submit"
              disabled={!canSubmit}
              className="mt-8 w-full rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 py-3 font-semibold text-white transition shadow-md hover:shadow-lg hover:to-blue-800 focus:ring-4 focus:ring-blue-200 active:scale-95"
            >
              Entrar
            </button>

            <p className="mt-6 text-center text-xs text-slate-600">
              © 2026 Sistema de Inventario y Trazabilidad. Todos los derechos reservados.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
