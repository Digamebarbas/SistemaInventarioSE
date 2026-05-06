"use client";
import apiClient from "@/lib/api";
import { ToastContainer } from "@/components/Toast";
import { useNotification } from "@/lib/useNotification";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, useEffect, useMemo, useState } from "react";

type CachedMe = {
  roles?: string[];
  is_admin?: boolean;
  username?: string;
  company?: { name?: string };
};

const readCachedMe = (): CachedMe => {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const raw = localStorage.getItem("auth_me_cache");
    if (!raw) {
      return {};
    }
    return JSON.parse(raw) as CachedMe;
  } catch {
    return {};
  }
};

const navigation = [
  { name: "Dashboard", href: "/dashboard", adminOnly: false },
  { name: "Movimientos", href: "/movimientos", adminOnly: false },
  { name: "Clientes", href: "/clientes", adminOnly: false },
  { name: "Proveedores", href: "/proveedores", adminOnly: false },
  { name: "Productos", href: "/productos", adminOnly: false },
  { name: "Alertas", href: "/alertas", adminOnly: false },
  { name: "Reportes", href: "/reportes", adminOnly: true },
  { name: "Usuarios", href: "/usuarios", adminOnly: true },
];

interface AlertItem {
  id: number;
  message: string;
  is_resolved: boolean;
}

export default function Sidebar({ children }: { children: ReactNode }) {
  const { toasts, removeNotification, warning } = useNotification();
  const cachedMe = readCachedMe();
  const pathname = usePathname();
  const [roles, setRoles] = useState<string[]>(
    Array.isArray(cachedMe.roles) ? cachedMe.roles : []
  );
  const [isAdminFlag, setIsAdminFlag] = useState(Boolean(cachedMe.is_admin));
  const [currentUsername, setCurrentUsername] = useState(String(cachedMe.username || ""));
  const [currentCompanyName, setCurrentCompanyName] = useState(
    String(cachedMe.company?.name || "")
  );
  const [seenAlertIds, setSeenAlertIds] = useState<number[]>([]);
  const [activeAlertCount, setActiveAlertCount] = useState(0);

  useEffect(() => {
    const hasUsableCache = Boolean(cachedMe.username) && (
      Boolean(cachedMe.is_admin) || (Array.isArray(cachedMe.roles) && cachedMe.roles.length > 0)
    );
    if (hasUsableCache) {
      return;
    }

    const loadMe = async () => {
      try {
        const res = await apiClient.get("/auth/me/");
        const loadedRoles = Array.isArray(res.data?.roles) ? res.data.roles : [];
        setRoles(loadedRoles);
        setIsAdminFlag(Boolean(res.data?.is_admin));
        setCurrentUsername(String(res.data?.username || ""));
        setCurrentCompanyName(String(res.data?.company?.name || ""));
        localStorage.setItem("auth_me_cache", JSON.stringify(res.data || {}));
      } catch {
        setRoles([]);
        setIsAdminFlag(false);
        setCurrentUsername("");
        setCurrentCompanyName("");
      }
    };

    loadMe();
  }, [cachedMe.is_admin, cachedMe.roles, cachedMe.username]);

  useEffect(() => {
    let isMounted = true;
    let isFirstRun = true;

    const pollAlerts = async () => {
      try {
        const res = await apiClient.get("/alerts/");
        const raw = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.results)
            ? res.data.results
            : [];

        const activeAlerts: AlertItem[] = (raw as AlertItem[]).filter((alert) => !alert.is_resolved);

        if (!isMounted) return;

        setActiveAlertCount(activeAlerts.length);

        if (isFirstRun) {
          // En el primer polling, mostrar toasts para alertas preexistentes
          for (const alert of activeAlerts) {
            warning(`Alerta de stock bajo: ${alert.message}`);
          }
          setSeenAlertIds(activeAlerts.map((alert) => alert.id));
          isFirstRun = false;
          return;
        }

        setSeenAlertIds((prev) => {
          const next = [...prev];
          for (const alert of activeAlerts) {
            if (!next.includes(alert.id)) {
              warning(`Alerta de stock bajo: ${alert.message}`);
              next.push(alert.id);
            }
          }
          return next;
        });
      } catch {
        // Silent fail to avoid interrupting navigation UX.
      }
    };

    void pollAlerts();
    const intervalId = window.setInterval(() => {
      void pollAlerts();
    }, 10000);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, [warning, pathname]);

  const isAdmin = useMemo(() => isAdminFlag || roles.includes("Admin"), [isAdminFlag, roles]);
  const roleLabel = isAdmin ? "Administrador" : "Usuario";
  const visibleNavigation = useMemo(
    () => navigation.filter((item) => isAdmin || !item.adminOnly),
    [isAdmin]
  );

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <ToastContainer toasts={toasts} onClose={removeNotification} />
      <aside className="w-72 border-r border-slate-200 bg-white text-slate-900 shadow-xl dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100">
        <div className="border-b border-slate-200 px-6 py-6 dark:border-slate-700">
          <h2 className="text-xl font-semibold">Sistema Inventario</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Control y trazabilidad</p>
          {currentUsername && (
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-200">
              Sesión: {currentUsername} ({roleLabel})
              {currentCompanyName ? ` - ${currentCompanyName}` : ""}
            </p>
          )}
        </div>
        <nav className="space-y-1 px-3 py-4">
          {visibleNavigation.map((item) => {
            const isActive = pathname === item.href;
            const showBadge = item.name === "Alertas" && activeAlertCount > 0;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center justify-between rounded-lg px-4 py-3 text-sm font-medium transition ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white"
                }`}
              >
                <span>{item.name}</span>
                {showBadge && (
                  <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-red-500 rounded-full">
                    {activeAlertCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </aside>
      <main className="flex-1 overflow-auto bg-slate-50 dark:bg-slate-950">{children}</main>
    </div>
  );
}
