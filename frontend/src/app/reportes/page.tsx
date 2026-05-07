"use client";
import ProtectedRoute from "@/components/ProtectedRoute";
import Sidebar from "@/components/Sidebar";
import PageShell from "@/components/PageShell";
import apiClient from "@/lib/api";
import { useEffect, useState } from "react";

export default function ReportesPage() {
  const [reportType, setReportType] = useState("");
  const [selectedReportId, setSelectedReportId] = useState("");
  const [reportData, setReportData] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const loadMe = async () => {
      try {
        const res = await apiClient.get("/auth/me/");
        const roles = Array.isArray(res.data?.roles) ? res.data.roles : [];
        setIsAdmin(Boolean(res.data?.is_admin) || roles.includes("Admin"));
      } catch {
        setIsAdmin(false);
      }
    };

    loadMe();
  }, []);

  const loadReport = async (endpoint: string) => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/reports/${endpoint}/`);
      setReportData(res.data);
    } catch {
      alert("Error al cargar reporte");
    } finally {
      setLoading(false);
    }
  };

  const exportReportCsv = async () => {
    if (!selectedReportId) return;
    try {
      const response = await apiClient.get(`/reports/${selectedReportId}/?export=csv`, {
        responseType: "blob",
      });
      const blob = new Blob([response.data], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${selectedReportId}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert("No se pudo exportar el reporte a CSV");
    }
  };

  const reports = [
    { id: "current-stock", name: "Existencias Actuales" },
    { id: "low-stock", name: "Productos con Bajo Stock" },
    { id: "top-products", name: "Top 10 Productos Más Vendidos" },
    { id: "entries-by-supplier", name: "Entradas por Proveedor" },
    { id: "exits-by-customer", name: "Salidas por Cliente" },
  ];

  return (
    <ProtectedRoute>
      <Sidebar>
        <PageShell>
          <div className="mb-8 rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h2 className="mb-2 text-xl font-semibold text-slate-900">Reportes</h2>
                <p className="text-slate-600">Genera y analiza reportes detallados del inventario</p>
              </div>
              <svg className="h-32 w-32 opacity-80" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Bar Chart Background */}
                <rect x="15" y="50" width="14" height="35" fill="none" stroke="#06B6D4" strokeWidth="2" rx="2"/>
                <rect x="35" y="35" width="14" height="50" fill="none" stroke="#06B6D4" strokeWidth="2" rx="2"/>
                <rect x="55" y="25" width="14" height="60" fill="none" stroke="#06B6D4" strokeWidth="2" rx="2"/>
                <rect x="75" y="40" width="14" height="45" fill="none" stroke="#06B6D4" strokeWidth="2" rx="2"/>
                
                {/* Grid Lines */}
                <line x1="10" y1="85" x2="95" y2="85" stroke="#E2E8F0" strokeWidth="1"/>
                <line x1="10" y1="15" x2="95" y2="15" stroke="#E2E8F0" strokeWidth="1"/>
                
                {/* Data Points */}
                <circle cx="22" cy="50" r="2" fill="#06B6D4"/>
                <circle cx="42" cy="35" r="2" fill="#06B6D4"/>
                <circle cx="62" cy="25" r="2" fill="#06B6D4"/>
                <circle cx="82" cy="40" r="2" fill="#06B6D4"/>
                
                {/* Connecting Line */}
                <path d="M 22 50 L 42 35 L 62 25 L 82 40" stroke="#06B6D4" strokeWidth="1.5" fill="none" strokeDasharray="3,2"/>
                
                {/* Axis */}
                <line x1="10" y1="85" x2="10" y2="15" stroke="#94A3B8" strokeWidth="1.5"/>
                <line x1="8" y1="85" x2="95" y2="85" stroke="#94A3B8" strokeWidth="1.5"/>
              </svg>
            </div>
          </div>

          {!isAdmin && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-amber-800">
              Solo el administrador puede generar reportes.
            </div>
          )}

          {isAdmin && <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <label className="mb-3 block font-semibold text-slate-900">Seleccionar Reporte:</label>
            <div className="grid gap-3 md:grid-cols-3">
              {reports.map((report) => (
                <button
                  key={report.id}
                  onClick={() => {
                    setReportType(report.name);
                    setSelectedReportId(report.id);
                    loadReport(report.id);
                  }}
                  className="rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-700"
                >
                  {report.name}
                </button>
              ))}
            </div>
          </div>}

          {isAdmin && loading && <p className="rounded-xl border border-slate-200 bg-white p-5 text-center text-slate-700 shadow-sm">Cargando reporte...</p>}

          {isAdmin && reportType && !loading && (
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 p-5">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-xl font-semibold text-slate-900">{reportType}</h2>
                  <button
                    type="button"
                    onClick={exportReportCsv}
                    className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
                  >
                    Exportar CSV
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-100">
                    <tr>
                      {reportData.length > 0 &&
                        Object.keys(reportData[0]).map((key) => (
                          <th key={key} className="px-4 py-3 text-left text-slate-900">
                            {key.replace(/_/g, " ").toUpperCase()}
                          </th>
                        ))}
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.map((row, idx) => (
                      <tr key={idx} className="border-t border-slate-100 hover:bg-slate-50">
                        {Object.values(row).map((value, i) => (
                          <td key={i} className="px-4 py-3 text-slate-900">
                            {value !== null ? String(value) : "-"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {reportData.length === 0 && (
                  <p className="p-4 text-center text-slate-700">No hay datos para este reporte</p>
                )}
              </div>
            </div>
          )}
        </PageShell>
      </Sidebar>
    </ProtectedRoute>
  );
}
