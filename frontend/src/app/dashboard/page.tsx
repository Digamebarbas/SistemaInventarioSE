"use client";
import ProtectedRoute from "@/components/ProtectedRoute";
import Sidebar from "@/components/Sidebar";
import PageShell from "@/components/PageShell";
import apiClient from "@/lib/api";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

interface Metrics {
  total_products: number;
  total_stock: number;
  critical_products: number;
  movements_today: number;
  is_admin?: boolean;
  top_products?: Array<{
    product__id: number;
    product__name: string;
    product__sku: string;
    total: number;
  }>;
}

interface Movement {
  id: number;
  movement_type: string;
  movement_type_label?: string;
  quantity: number;
  product_name?: string;
  supplier_name?: string;
  customer_name?: string;
  created_by_username?: string;
  created_at: string;
}

interface ProductSummary {
  id: number;
  name: string;
  category?: string;
  sku: string;
  stock_actual: number;
  stock_minimo: number;
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [recentMovements, setRecentMovements] = useState<Movement[]>([]);
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [loadError, setLoadError] = useState("");
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    const loadDashboard = async () => {
      try {
        const metricsRes = await apiClient.get("/metrics/dashboard/");
        const metricsData: Metrics = metricsRes.data;
        if (!isMounted) return;

        setMetrics(metricsData);
        setLoadError("");

        const [movementsRes, productsRes] = await Promise.all([
          apiClient.get("/inventory/movements/"),
          apiClient.get("/inventory/products/"),
        ]);

        const movementsRaw = Array.isArray(movementsRes.data)
          ? movementsRes.data
          : Array.isArray(movementsRes.data?.results)
            ? movementsRes.data.results
            : [];

        const productsRaw = Array.isArray(productsRes.data)
          ? productsRes.data
          : Array.isArray(productsRes.data?.results)
            ? productsRes.data.results
            : [];

        if (isMounted) {
          setRecentMovements((movementsRaw as Movement[]).slice(0, 10));
          setProducts(productsRaw as ProductSummary[]);
        }
      } catch {
        if (isMounted) {
          setLoadError("No se pudo cargar el dashboard. Verifica que el backend esté activo.");
        }
      }
    };

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    router.push("/login");
  };

  const lowStockProducts = useMemo(() => {
    return products
      .filter((product) => product.stock_actual <= product.stock_minimo)
      .sort((a, b) => a.stock_actual - b.stock_actual)
      .slice(0, 8);
  }, [products]);

  const categorySummary = useMemo(() => {
    const summary = new Map<string, { count: number; stock: number }>();
    for (const product of products) {
      const key = product.category || "otros";
      const existing = summary.get(key) || { count: 0, stock: 0 };
      summary.set(key, {
        count: existing.count + 1,
        stock: existing.stock + product.stock_actual,
      });
    }
    return Array.from(summary.entries())
      .map(([category, values]) => ({ category, ...values }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [products]);

  return (
    <ProtectedRoute>
      <Sidebar>
        <PageShell>
            <div className="mb-8 flex items-center justify-between">
              <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
              <button
                className="rounded-lg bg-gradient-to-r from-slate-700 to-slate-800 px-4 py-2 font-medium text-white shadow-lg transition hover:from-slate-800 hover:to-slate-900 hover:shadow-xl"
                onClick={handleLogout}
              >
                Cerrar Sesión
              </button>
            </div>

            {loadError && (
              <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {loadError}
              </div>
            )}

            {metrics ? (
              <div className="space-y-6">
                <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
                  <div className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md dark:border-slate-700 dark:bg-slate-900">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-600">Total Productos</p>
                        <p className="mt-2 text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">{metrics.total_products}</p>
                      </div>
                      <div className="rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 p-3 group-hover:from-blue-200 group-hover:to-blue-300 transition">
                        <svg className="h-8 w-8 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <rect x="3" y="3" width="7" height="7" />
                          <rect x="14" y="3" width="7" height="7" />
                          <rect x="14" y="14" width="7" height="7" />
                          <rect x="3" y="14" width="7" height="7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md dark:border-slate-700 dark:bg-slate-900">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-600">Stock Global</p>
                        <p className="mt-2 text-3xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">{metrics.total_stock}</p>
                      </div>
                      <div className="rounded-xl bg-gradient-to-br from-green-100 to-green-200 p-3 group-hover:from-green-200 group-hover:to-green-300 transition">
                        <svg className="h-8 w-8 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M12 2L2 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" fill="currentColor" opacity="0.1" />
                          <path d="M12 2L2 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md dark:border-slate-700 dark:bg-slate-900">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-600">Críticos</p>
                        <p className="mt-2 text-3xl font-bold bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent">{metrics.critical_products}</p>
                      </div>
                      <div className="rounded-xl bg-gradient-to-br from-red-100 to-red-200 p-3 group-hover:from-red-200 group-hover:to-red-300 transition">
                        <svg className="h-8 w-8 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <circle cx="12" cy="12" r="10" />
                          <path d="M12 8v4M12 16h.01" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md dark:border-slate-700 dark:bg-slate-900">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-600">Movimientos Hoy</p>
                        <p className="mt-2 text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent">{metrics.movements_today}</p>
                      </div>
                      <div className="rounded-xl bg-gradient-to-br from-purple-100 to-purple-200 p-3 group-hover:from-purple-200 group-hover:to-purple-300 transition">
                        <svg className="h-8 w-8 text-purple-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6m0 0v3m0-3H13" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="mb-4 text-xl font-semibold text-slate-900">Actividad reciente</h2>
                    {recentMovements.length > 0 ? (
                      <div className="max-h-80 space-y-2 overflow-auto pr-1">
                        {recentMovements.map((movement) => (
                          <div key={movement.id} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 transition hover:bg-slate-100">
                            <p className="text-sm font-semibold text-slate-800">
                              {movement.movement_type_label || movement.movement_type} - Cantidad {movement.quantity}
                            </p>
                            <p className="text-xs text-slate-600">
                              Producto: {movement.product_name || `Producto #${movement.id}`}
                            </p>
                            <p className="text-xs text-slate-600">
                              Cliente/Proveedor: {movement.customer_name || movement.supplier_name || "No aplica"}
                            </p>
                            <p className="text-xs text-slate-600">
                              Usuario: {movement.created_by_username || "Sin usuario"}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-600">Sin movimientos recientes.</p>
                    )}
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="mb-4 text-xl font-semibold text-slate-900">Productos con alerta</h2>
                    {lowStockProducts.length > 0 ? (
                      <div className="max-h-80 space-y-2 overflow-auto pr-1">
                        {lowStockProducts.map((product) => (
                          <div key={product.id} className="rounded-lg border border-red-200 bg-red-50 px-3 py-2">
                            <p className="text-sm font-semibold text-slate-900">{product.name}</p>
                            <p className="text-xs text-slate-700">
                              SKU: {product.sku} | Stock: {product.stock_actual} | Min: {product.stock_minimo}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-600">No hay productos en nivel crítico.</p>
                    )}
                  </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="mb-4 text-xl font-semibold text-slate-900">Top productos con salida</h2>
                    {metrics.top_products && metrics.top_products.length > 0 ? (
                      <div className="space-y-2">
                        {metrics.top_products.map((item, index) => (
                          <div key={item.product__id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                            <p className="text-sm font-semibold text-slate-800">
                              {index + 1}. {item.product__name}
                            </p>
                            <p className="text-sm text-slate-700">{item.total} uds</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-600">Aún no hay salidas registradas para calcular ranking.</p>
                    )}
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="mb-4 text-xl font-semibold text-slate-900">Resumen por categoría</h2>
                    {categorySummary.length > 0 ? (
                      <div className="space-y-2">
                        {categorySummary.map((item) => (
                          <div key={item.category} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                            <p className="text-sm font-semibold text-slate-800">{item.category}</p>
                            <p className="text-sm text-slate-700">{item.count} productos | Stock {item.stock}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-600">No hay productos cargados para resumir.</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-white/30 bg-gradient-to-br from-white to-slate-50 p-5 shadow-lg backdrop-blur-sm">
                <p className="text-slate-700">Cargando métricas...</p>
              </div>
            )}
        </PageShell>
      </Sidebar>
    </ProtectedRoute>
  );
}
