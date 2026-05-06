"use client";
import ProtectedRoute from "@/components/ProtectedRoute";
import Sidebar from "@/components/Sidebar";
import PageShell from "@/components/PageShell";
import apiClient from "@/lib/api";
import { useEffect, useState } from "react";

interface Alert {
  id: number;
  product: number;
  message: string;
  is_resolved: boolean;
  created_at: string;
}

export default function AlertasPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);

  const loadAlerts = async () => {
    const res = await apiClient.get("/alerts/");
    setAlerts(res.data);
  };

  useEffect(() => {
    let isMounted = true;

    void apiClient.get("/alerts/").then((res) => {
      if (isMounted) {
        setAlerts(res.data);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleResolve = async (id: number) => {
    await apiClient.patch(`/alerts/${id}/resolve/`);
    loadAlerts();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("es-ES");
  };

  return (
    <ProtectedRoute>
      <Sidebar>
        <PageShell>
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-slate-900">Alertas de Stock</h1>
              <p className="mt-2 text-slate-600">Productos que requieren atención inmediata</p>
            </div>

            {/* Illustration Header */}
            <div className="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="mb-1 text-xl font-semibold text-slate-900">Estado de Inventario</h2>
                <p className="text-slate-600">Monitorea y resuelve alertas de stock crítico</p>
              </div>
              <svg className="h-20 w-20 opacity-90" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="50" cy="30" r="15" fill="#ff4444" opacity="0.2" />
                <circle cx="50" cy="30" r="15" stroke="#ff4444" strokeWidth="2" />
                <path d="M50 20 L50 40" stroke="#ff4444" strokeWidth="2" strokeLinecap="round" />
                <circle cx="50" cy="50" r="2" fill="#ff4444" />
                <line x1="35" y1="65" x2="65" y2="65" stroke="#333" strokeWidth="2" />
                <rect x="30" y="65" width="40" height="20" rx="2" fill="none" stroke="#333" strokeWidth="2" />
                <path d="M40 75 L50 80 L60 75" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>

          <div className="grid gap-5">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`rounded-xl border p-5 shadow-sm ${alert.is_resolved ? "border-slate-200 bg-slate-100" : "border-red-200 bg-red-50"}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">{alert.message}</p>
                    <p className="text-sm text-slate-700">{formatDate(alert.created_at)}</p>
                  </div>
                  {!alert.is_resolved && (
                    <button
                      onClick={() => handleResolve(alert.id)}
                      className="rounded-lg bg-green-600 px-4 py-2 font-medium text-white transition hover:bg-green-700"
                    >
                      Marcar como Resuelto
                    </button>
                  )}
                  {alert.is_resolved && (
                    <span className="rounded bg-green-100 px-3 py-1 text-sm text-green-800">Resuelto</span>
                  )}
                </div>
              </div>
            ))}
            {alerts.length === 0 && (
              <p className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-700 shadow-sm">
                No hay alertas activas
              </p>
            )}
            </div>
        </PageShell>
      </Sidebar>
    </ProtectedRoute>
  );
}
