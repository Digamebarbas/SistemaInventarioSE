"use client";

import apiClient from "@/lib/api";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type InventoryType = string;

type InventoryCategory = {
  id: InventoryType;
  title: string;
  description: string;
  includes: string[];
  selectedClass: string;
  hoverClass: string;
  iconBgClass: string;
};

const INVENTORY_CATEGORIES: InventoryCategory[] = [
  {
    id: "general",
    title: "Inventario General",
    description: "Gestión mixta para distintos tipos de productos en una sola operación",
    includes: ["Stock por categorías", "Entradas y salidas", "Alertas de bajo inventario"],
    selectedClass: "border-sky-500 ring-2 ring-sky-100",
    hoverClass: "hover:border-sky-300",
    iconBgClass: "bg-sky-600",
  },
  {
    id: "alimentos",
    title: "Inventario de Alimentos",
    description: "Gestión de productos alimenticios con control de caducidad",
    includes: ["Fechas de caducidad", "Gestión de lotes", "Categorías específicas"],
    selectedClass: "border-emerald-500 ring-2 ring-emerald-100",
    hoverClass: "hover:border-emerald-300",
    iconBgClass: "bg-emerald-600",
  },
  {
    id: "electronicos",
    title: "Productos Electrónicos",
    description: "Gestión de equipos, componentes y accesorios tecnológicos",
    includes: ["Números de serie", "Control de garantías", "Trazabilidad por modelo"],
    selectedClass: "border-fuchsia-500 ring-2 ring-fuchsia-100",
    hoverClass: "hover:border-fuchsia-300",
    iconBgClass: "bg-fuchsia-600",
  },
  {
    id: "farmacia",
    title: "Inventario Farmacéutico",
    description: "Control de medicamentos e insumos con requerimientos sanitarios",
    includes: ["Lote y vencimiento", "Control por presentación", "Historial de movimientos"],
    selectedClass: "border-rose-500 ring-2 ring-rose-100",
    hoverClass: "hover:border-rose-300",
    iconBgClass: "bg-rose-600",
  },
  {
    id: "ferreteria",
    title: "Inventario de Ferretería",
    description: "Gestión de herramientas, repuestos y materiales por referencia",
    includes: ["SKU por referencia", "Control por unidad y caja", "Reposición por rotación"],
    selectedClass: "border-amber-500 ring-2 ring-amber-100",
    hoverClass: "hover:border-amber-300",
    iconBgClass: "bg-amber-600",
  },
  {
    id: "moda",
    title: "Inventario de Moda",
    description: "Gestión de prendas y calzado por talla, color y colección",
    includes: ["Variantes por talla/color", "Control por temporada", "Rotación por categoría"],
    selectedClass: "border-indigo-500 ring-2 ring-indigo-100",
    hoverClass: "hover:border-indigo-300",
    iconBgClass: "bg-indigo-600",
  },
];

export default function ConfiguracionInicialPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [companyName, setCompanyName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [inventoryType, setInventoryType] = useState<InventoryType | "">("");
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const canContinue = useMemo(() => {
    const email = adminEmail.trim();
    return companyName.trim().length >= 2 && email.length > 5 && email.includes("@");
  }, [companyName, adminEmail]);
  const canFinish = useMemo(() => inventoryType !== "", [inventoryType]);

  const goToStepTwo = () => {
    if (!canContinue) {
      return;
    }
    setErrorMessage("");
    setStep(2);
  };

  const finishSetup = async () => {
    if (!canFinish || isSaving) {
      return;
    }

    setIsSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await apiClient.post("/auth/companies/create/", {
        company_name: companyName.trim(),
        admin_email: adminEmail.trim().toLowerCase(),
        inventory_category: inventoryType,
      });

      localStorage.setItem("onboarding_company_name", String(response.data?.company?.name || companyName.trim()));
      localStorage.setItem("onboarding_company_slug", String(response.data?.company?.slug || ""));
      localStorage.setItem("onboarding_admin_email", adminEmail.trim().toLowerCase());
      localStorage.setItem("onboarding_inventory_type", inventoryType);
      localStorage.setItem("onboarding_done", "true");
      localStorage.setItem("onboarding_admin_default_password", "Admin123");

      setSuccessMessage("Empresa creada correctamente. Usuario administrador generado con clave Admin123.");
      router.push("/login");
    } catch (error) {
      const err = error as { response?: { data?: { detail?: string; company_name?: string[]; admin_email?: string[] } } };
      const backendData = err.response?.data;
      const message =
        backendData?.detail ||
        backendData?.company_name?.[0] ||
        backendData?.admin_email?.[0] ||
        "No se pudo crear la empresa. Intenta nuevamente.";
      setErrorMessage(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-10 md:py-14">
      <div className="mx-auto max-w-5xl">
        <header className="text-center">
          <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 shadow-sm">
            <svg className="h-8 w-8 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 3 4 7.5 12 12 20 7.5 12 3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
              <path d="M4 7.5V16.5L12 21V12" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
              <path d="M20 7.5V16.5L12 21" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-slate-900">Bienvenido a tu Sistema de Inventario</h1>
          <p className="mt-2 text-2xl text-slate-600">Configuremos tu sistema en pocos pasos</p>
        </header>

        <div className="mt-10 flex items-center justify-center gap-4 md:gap-6">
          <button
            type="button"
            onClick={() => setStep(1)}
            className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-lg font-semibold transition ${
              step >= 1 ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-600"
            }`}
          >
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-base">{step > 1 ? "✓" : "1"}</span>
            Información
          </button>

          <span className="h-px w-16 bg-slate-300 md:w-24" />

          <button
            type="button"
            onClick={() => canContinue && setStep(2)}
            className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-lg font-semibold transition ${
              step === 2 ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-600"
            }`}
          >
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-base">2</span>
            Tipo de Inventario
          </button>
        </div>

        {step === 1 && (
          <section className="mx-auto mt-10 max-w-4xl rounded-2xl border border-slate-300 bg-white px-7 py-8 shadow-sm md:px-10">
            <div className="flex items-start gap-3">
              <svg className="mt-1 h-6 w-6 text-blue-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.8" />
                <path d="M8 2V6M16 2V6M7 10H17M7 14H13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              <div>
                <h2 className="text-3xl font-semibold text-slate-900">Información de tu Empresa</h2>
                <p className="mt-1 text-2xl text-slate-500">Ingresa el nombre de tu empresa u organización</p>
              </div>
            </div>

            <div className="mt-8">
              <label className="block text-xl font-semibold text-slate-800">Nombre de la Empresa *</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Ej: Mi Empresa S.A."
                className="mt-3 w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-lg text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="mt-6">
              <label className="block text-xl font-semibold text-slate-800">Correo del Administrador *</label>
              <input
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="admin@empresa.com"
                className="mt-3 w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-lg text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {errorMessage && <p className="mt-4 text-base font-medium text-red-600">{errorMessage}</p>}

            <div className="mt-10 flex justify-end">
              <button
                type="button"
                onClick={goToStepTwo}
                disabled={!canContinue}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-6 py-3 text-lg font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Continuar
                <span aria-hidden>→</span>
              </button>
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="mt-10">
            <div className="mx-auto max-w-4xl rounded-2xl border border-slate-300 bg-white px-6 py-5 shadow-sm">
              <h2 className="text-3xl font-semibold text-slate-900">Selecciona la Categoría de Inventario</h2>
              <p className="mt-1 text-2xl text-slate-500">Elige la categoría que mejor se ajusta a tu operación</p>
            </div>

            <div className="mx-auto mt-7 grid max-w-5xl gap-6 md:grid-cols-2 xl:grid-cols-3">
              {INVENTORY_CATEGORIES.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setInventoryType(category.id)}
                  className={`rounded-3xl border bg-white p-7 text-left shadow-sm transition ${
                    inventoryType === category.id
                      ? category.selectedClass
                      : `border-slate-200 ${category.hoverClass}`
                  }`}
                >
                  <div className={`inline-flex h-16 w-16 items-center justify-center rounded-2xl p-3 text-white ${category.iconBgClass}`}>
                    <svg className="h-9 w-9" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="4" y="5" width="16" height="11" rx="2" stroke="currentColor" strokeWidth="1.8" />
                      <path d="M9 19H15M12 16V19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                  </div>
                  <h3 className="mt-5 text-3xl font-bold leading-tight text-slate-900">{category.title}</h3>
                  <p className="mt-2 text-xl text-slate-600">{category.description}</p>
                  <div className="my-4 h-px bg-slate-200" />
                  <p className="text-lg font-semibold text-slate-800">Incluye:</p>
                  <ul className="mt-2 space-y-1 text-lg text-slate-700">
                    {category.includes.map((item) => (
                      <li key={item}>✓ {item}</li>
                    ))}
                  </ul>
                </button>
              ))}
            </div>

            <div className="mx-auto mt-8 flex max-w-5xl items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-lg font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Atrás
              </button>

              <button
                type="button"
                onClick={finishSetup}
                disabled={!canFinish || isSaving}
                className="rounded-xl bg-slate-500 px-7 py-3 text-lg font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSaving ? "Creando empresa..." : "Finalizar Configuración ✓"}
              </button>
            </div>
            {errorMessage && <p className="mx-auto mt-4 max-w-5xl text-base font-medium text-red-600">{errorMessage}</p>}
            {successMessage && <p className="mx-auto mt-4 max-w-5xl text-base font-medium text-emerald-700">{successMessage}</p>}
          </section>
        )}
      </div>
    </div>
  );
}
