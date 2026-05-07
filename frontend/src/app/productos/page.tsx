"use client";
import ProtectedRoute from "@/components/ProtectedRoute";
import Sidebar from "@/components/Sidebar";
import PageShell from "@/components/PageShell";
import { ToastContainer } from "@/components/Toast";
import { useNotification } from "@/lib/useNotification";
import apiClient from "@/lib/api";
import QRBarcodeScanner from "@/components/QRBarcodeScanner";
import { useEffect, useState } from "react";

interface Product {
  id: number;
  name: string;
  category: string;
  sku: string;
  barcode: string;
  qr_code: string;
  description: string;
  stock_actual: number;
  stock_minimo: number;
  stock_maximo: number;
  unit: string;
  fecha_compra: string | null;
  fecha_vencimiento: string | null;
  periodo_garantia_meses: number | null;
  uses_warranty_period: boolean;
  is_active: boolean;
}

const COMMON_UNITS = [
  "unidad",
  "litro",
  "mililitro",
  "gramo",
  "kilogramo",
  "onza",
  "libra",
  "metro",
  "centimetro",
  "caja",
  "paquete",
  "botella",
  "bolsa",
  "lata",
  "docena",
];

const PRODUCT_CATEGORIES = [
  "celular",
  "laptop",
  "tablet",
  "audio",
  "wearable",
  "mouse",
  "teclado",
  "camara",
  "monitor",
  "red",
  "almacenamiento",
  "memoria",
  "impresora",
  "energia",
  "ferreteria",
  "tornilleria",
  "clavos",
  "tuercas y arandelas",
  "herrajes",
  "seguridad",
  "herramientas",
  "corte y perforacion",
  "cables y cadenas",
  "anclajes",
  "aislamiento electrico",
  "quimicos",
  "otros",
];

const capitalizeFirst = (value: string) => {
  if (!value) return "";
  return value.charAt(0).toUpperCase() + value.slice(1);
};

type CachedMe = {
  is_admin?: boolean;
  roles?: string[];
  company?: { slug?: string; uses_warranty_period?: boolean };
};

const readCachedMe = (): CachedMe => {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const raw = localStorage.getItem("auth_me_cache");
    return raw ? (JSON.parse(raw) as CachedMe) : {};
  } catch {
    return {};
  }
};

const isAdminFromCachedMe = (cachedMe: CachedMe) => {
  const cachedRoles = Array.isArray(cachedMe.roles) ? cachedMe.roles : [];
  return Boolean(cachedMe.is_admin) || cachedRoles.includes("Admin");
};

const createEmptyFormData = () => ({
  name: "",
  category: "otros",
  sku: "",
  barcode: "",
  qr_code: "",
  description: "",
  unit: "unidad",
  stock_minimo: 10,
  stock_maximo: 0,
  stock_actual: 0,
  fecha_compra: "",
  fecha_vencimiento: "",
  periodo_garantia_meses: "",
});

export default function ProductosPage() {
  const cachedMe = readCachedMe();
  const { toasts, removeNotification, success, error } = useNotification();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [isAdmin, setIsAdmin] = useState(isAdminFromCachedMe(cachedMe));
  const [usesWarrantyPeriod, setUsesWarrantyPeriod] = useState(Boolean(cachedMe.company?.uses_warranty_period));
  const [currentCompanySlug, setCurrentCompanySlug] = useState(cachedMe.company?.slug || "global");
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [searchCode, setSearchCode] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 100;
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [scannerMode, setScannerMode] = useState<"barcode" | "qr" | null>(null);
  const [formData, setFormData] = useState(createEmptyFormData);

  const PRODUCTS_CACHE_KEY = `products_cache_${currentCompanySlug}`;

  const readProductsCache = () => {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(PRODUCTS_CACHE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as Product[];
      return Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  };

  const writeProductsCache = (items: Product[]) => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify(items));
    } catch {
      // Ignore storage quota or serialization issues.
    }
  };

  const loadProducts = async () => {
    const cached = readProductsCache();
    if (cached && cached.length > 0) {
      setProducts(cached);
      setFilteredProducts(cached);
    }

    try {
      const res = await apiClient.get("/inventory/products/");
      setProducts(res.data);
      setFilteredProducts(res.data);
      writeProductsCache(res.data);
    } catch (error) {
      console.error("Error loading products:", error);
    }
  };

  const loadMe = async () => {
    if (cachedMe.company?.slug) {
      setCurrentCompanySlug(cachedMe.company.slug);
      setIsAdmin(isAdminFromCachedMe(cachedMe));
      setUsesWarrantyPeriod(Boolean(cachedMe.company.uses_warranty_period));
    }

    try {
      const res = await apiClient.get("/auth/me/");
      const nextCachedMe = {
        is_admin: Boolean(res.data?.is_admin),
        roles: Array.isArray(res.data?.roles) ? res.data.roles : [],
        company: {
          slug: String(res.data?.company?.slug || "global"),
          uses_warranty_period: Boolean(res.data?.company?.uses_warranty_period),
        },
      };
      setCurrentCompanySlug(nextCachedMe.company.slug || "global");
      setIsAdmin(isAdminFromCachedMe(nextCachedMe));
      setUsesWarrantyPeriod(Boolean(nextCachedMe.company.uses_warranty_period));
    } catch {
      setCurrentCompanySlug("global");
      setIsAdmin(false);
      setUsesWarrantyPeriod(false);
    }
  };

  const resetForm = () => {
    setEditingProductId(null);
    setFormData(createEmptyFormData());
  };

  const handleCreateToggle = () => {
    if (showForm) {
      resetForm();
      setShowForm(false);
      return;
    }
    resetForm();
    setShowForm(true);
  };

  const handleEdit = (product: Product) => {
    setEditingProductId(product.id);
    setFormData({
      name: product.name,
      category: product.category || "otros",
      sku: product.sku,
      barcode: product.barcode || "",
      qr_code: product.qr_code || "",
      description: product.description || "",
      unit: product.unit || "unidad",
      stock_minimo: product.stock_minimo,
      stock_maximo: product.stock_maximo,
      stock_actual: product.stock_actual,
      fecha_compra: product.fecha_compra || "",
      fecha_vencimiento: product.fecha_vencimiento || "",
      periodo_garantia_meses: product.periodo_garantia_meses ? String(product.periodo_garantia_meses) : "",
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleToggleProductStatus = async (product: Product) => {
    const nextStatus = !product.is_active;
    const actionLabel = nextStatus ? "activar" : "deshabilitar";
    if (!confirm(`¿Seguro que deseas ${actionLabel} este producto? El historial de movimientos se conservará.`)) {
      return;
    }

    try {
      await apiClient.patch(`/inventory/products/${product.id}/`, { is_active: nextStatus });
      success(`Producto ${nextStatus ? "activado" : "deshabilitado"} exitosamente`);
      loadProducts();
    } catch {
      error(`No se pudo ${actionLabel} el producto`);
    }
  };

  useEffect(() => {
    void loadMe();
  }, []);

  useEffect(() => {
    void loadProducts();
  }, [currentCompanySlug]);

  useEffect(() => {
    if (searchCode.trim() === "") {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter(
        (p) =>
          p.name?.toLowerCase().includes(searchCode.toLowerCase()) ||
          p.category?.toLowerCase().includes(searchCode.toLowerCase()) ||
          p.barcode?.toLowerCase().includes(searchCode.toLowerCase()) ||
          p.qr_code?.toLowerCase().includes(searchCode.toLowerCase()) ||
          p.sku?.toLowerCase().includes(searchCode.toLowerCase())
      );
      setFilteredProducts(filtered);
    }
  }, [searchCode, products]);

  const clearSearch = () => {
    setSearchCode("");
    setFilteredProducts(products);
    setCurrentPage(1);
  };

  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProductId) {
        if (formData.stock_maximo && formData.stock_maximo < formData.stock_minimo) {
          error("El stock maximo debe ser mayor o igual al stock minimo");
          return;
        }
        await apiClient.patch(`/inventory/products/${editingProductId}/`, {
          name: formData.name,
          category: formData.category,
          sku: formData.sku,
          barcode: formData.barcode,
          qr_code: formData.qr_code,
          description: formData.description,
          unit: formData.unit,
          stock_minimo: formData.stock_minimo,
          stock_maximo: formData.stock_maximo,
          fecha_compra: formData.fecha_compra || null,
          fecha_vencimiento: usesWarrantyPeriod ? null : (formData.fecha_vencimiento || null),
          periodo_garantia_meses: usesWarrantyPeriod
            ? (formData.periodo_garantia_meses ? Number(formData.periodo_garantia_meses) : null)
            : null,
        });
        success("Producto actualizado exitosamente");
      } else {
        if (formData.stock_maximo && formData.stock_maximo < formData.stock_minimo) {
          error("El stock maximo debe ser mayor o igual al stock minimo");
          return;
        }
        await apiClient.post("/inventory/products/", {
          ...formData,
          fecha_compra: formData.fecha_compra || null,
          fecha_vencimiento: usesWarrantyPeriod ? null : (formData.fecha_vencimiento || null),
          periodo_garantia_meses: usesWarrantyPeriod
            ? (formData.periodo_garantia_meses ? Number(formData.periodo_garantia_meses) : null)
            : null,
        });
        success("Producto creado exitosamente");
      }
      setShowForm(false);
      resetForm();
      await loadProducts();
    } catch {
      error(editingProductId ? "Error al actualizar producto" : "Error al crear producto");
    }
  };

  const handleImportProducts = async () => {
    if (!importFile) {
      error("Selecciona un archivo CSV para importar");
      return;
    }

    const data = new FormData();
    data.append("file", importFile);

    try {
      setIsImporting(true);
      const res = await apiClient.post("/inventory/products/import_file/", data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const created = res.data?.created ?? 0;
      const errors = Array.isArray(res.data?.errors) ? res.data.errors : [];

      if (errors.length > 0) {
        success(`Importación completada. Creados: ${created}. Errores: ${errors.length}`);
      } else {
        success(`Importación exitosa. ${created} productos creados`);
      }

      setImportFile(null);
      await loadProducts();
    } catch {
      error("Error al importar productos");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <ProtectedRoute>
      <Sidebar>
        <ToastContainer toasts={toasts} onClose={removeNotification} />
        <PageShell>
            <div className="mb-8 flex items-center justify-between">
              <h1 className="text-3xl font-bold text-slate-900">Productos</h1>
              {isAdmin && (
                <button
                  onClick={handleCreateToggle}
                  className="rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2 font-medium text-white shadow-lg transition hover:from-blue-700 hover:to-blue-800 hover:shadow-xl"
                >
                  {showForm ? "Cancelar" : "Nuevo Producto"}
                </button>
              )}
            </div>

            {!isAdmin && (
              <div className="mb-6 rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-amber-100/50 p-4 text-sm text-amber-800 backdrop-blur-sm">
                Solo el administrador puede crear y editar productos.
              </div>
            )}

            {/* Buscador */}
            <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <input
                type="text"
                placeholder="Buscar por nombre, código QR, código de barras o SKU..."
                className="w-full flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 placeholder:text-slate-500 outline-none transition focus:border-blue-500"
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value)}
              />
              {searchCode && (
                <button
                  onClick={clearSearch}
                  className="rounded-lg bg-slate-700 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
                >
                  Limpiar
                </button>
              )}
            </div>
            {searchCode && (
              <p className="mt-2 text-sm text-slate-600">
                Mostrando {filteredProducts.length} de {products.length} productos
              </p>
            )}
          </div>

          {scannerMode && (
            <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">
                  Escanear {scannerMode === "barcode" ? "Código de Barras" : "Código QR"}
                </h3>
                <button
                  onClick={() => setScannerMode(null)}
                  className="rounded-lg bg-slate-600 px-3 py-1 text-sm font-medium text-white transition hover:bg-slate-700"
                >
                  Cerrar
                </button>
              </div>
              <QRBarcodeScanner
                onScan={(data) => {
                  if (scannerMode === "barcode") {
                    setFormData({ ...formData, barcode: data });
                  } else {
                    setFormData({ ...formData, qr_code: data });
                  }
                  setScannerMode(null);
                }}
                onClose={() => setScannerMode(null)}
              />
            </div>
          )}

          {showForm && isAdmin && (
            <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-5 text-xl font-semibold text-slate-900">
                {editingProductId ? "Editar Producto" : "Nuevo Producto"}
              </h2>
              <div className="mb-6 rounded border border-gray-200 p-4">
                <h3 className="mb-2 text-lg font-medium text-gray-900">Importar archivo</h3>
                <p className="mb-3 text-sm text-gray-700">
                  Carga un CSV con columnas: name, category, sku, barcode, qr_code, description, unit, stock_minimo, stock_maximo, stock_actual, fecha_compra, fecha_vencimiento, periodo_garantia_meses
                </p>
                <div className="flex flex-col gap-3 md:flex-row md:items-center">
                  <input
                    type="file"
                    accept=".csv"
                    className="w-full rounded border px-3 py-2 text-gray-900 md:w-auto"
                    onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                  />
                  <button
                    type="button"
                    onClick={handleImportProducts}
                    disabled={isImporting || !importFile}
                    className="rounded bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-400"
                  >
                    {isImporting ? "Importando..." : "Importar Productos"}
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-900">Nombre *</label>
                  <input
                    type="text"
                    placeholder="Ej: Laptop Dell"
                    required
                    className="w-full rounded border px-3 py-2 text-gray-900 placeholder:text-gray-500"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-900">SKU *</label>
                  <input
                    type="text"
                    placeholder="Ej: LAP-001"
                    required
                    className="w-full rounded border px-3 py-2 text-gray-900 placeholder:text-gray-500"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-900">Categoría *</label>
                  <select
                    required
                    className="w-full rounded border px-3 py-2 text-gray-900"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    {PRODUCT_CATEGORIES.map((categoryOption) => (
                      <option key={categoryOption} value={categoryOption}>
                        {capitalizeFirst(categoryOption)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-900">Código de Barras</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Ej: 7501234567890"
                      className="flex-1 rounded border px-3 py-2 text-gray-900 placeholder:text-gray-500"
                      value={formData.barcode}
                      onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    />
                    <button
                      type="button"
                      onClick={() => setScannerMode("barcode")}
                      className="rounded bg-blue-600 px-3 py-2 text-white hover:bg-blue-700 flex items-center gap-2"
                      title="Escanear código de barras"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.219A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22a2 2 0 001.664.89H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-900">Código QR</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Ej: QR-LAP-001"
                      className="flex-1 rounded border px-3 py-2 text-gray-900 placeholder:text-gray-500"
                      value={formData.qr_code}
                      onChange={(e) => setFormData({ ...formData, qr_code: e.target.value })}
                    />
                    <button
                      type="button"
                      onClick={() => setScannerMode("qr")}
                      className="rounded bg-blue-600 px-3 py-2 text-white hover:bg-blue-700 flex items-center gap-2"
                      title="Escanear código QR"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.219A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22a2 2 0 001.664.89H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-900">Unidad de Medida</label>
                  <select
                    className="w-full rounded border px-3 py-2 text-gray-900"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  >
                    {COMMON_UNITS.map((unitOption) => (
                      <option key={unitOption} value={unitOption}>
                        {capitalizeFirst(unitOption)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-900">Stock Mínimo</label>
                  <input
                    type="number"
                    placeholder="0"
                    className="w-full rounded border px-3 py-2 text-gray-900 placeholder:text-gray-500"
                    value={formData.stock_minimo}
                    onChange={(e) => setFormData({ ...formData, stock_minimo: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-900">Stock Máximo</label>
                  <input
                    type="number"
                    placeholder="0"
                    className="w-full rounded border px-3 py-2 text-gray-900 placeholder:text-gray-500"
                    value={formData.stock_maximo}
                    onChange={(e) => setFormData({ ...formData, stock_maximo: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-900">Stock</label>
                  <input
                    type="number"
                    placeholder="Stock actual"
                    disabled={Boolean(editingProductId)}
                    className="w-full rounded border px-3 py-2 text-gray-900 placeholder:text-gray-500 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                    value={formData.stock_actual}
                    onChange={(e) => setFormData({ ...formData, stock_actual: Number(e.target.value) })}
                  />
                  {editingProductId && (
                    <p className="mt-1 text-xs text-slate-500">
                      El stock actual se mueve desde Movimientos para conservar la trazabilidad.
                    </p>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-900">Fecha de Compra <span className="text-slate-400 font-normal">(opcional)</span></label>
                  <input
                    type="date"
                    className="w-full rounded border px-3 py-2 text-gray-900"
                    value={formData.fecha_compra}
                    onChange={(e) => setFormData({ ...formData, fecha_compra: e.target.value })}
                  />
                </div>
                {usesWarrantyPeriod ? (
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-900">Periodo de Garantia (meses) <span className="text-slate-400 font-normal">(opcional)</span></label>
                    <input
                      type="number"
                      min={0}
                      className="w-full rounded border px-3 py-2 text-gray-900"
                      value={formData.periodo_garantia_meses}
                      onChange={(e) => setFormData({ ...formData, periodo_garantia_meses: e.target.value })}
                    />
                  </div>
                ) : (
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-900">Fecha de Vencimiento <span className="text-slate-400 font-normal">(opcional)</span></label>
                    <input
                      type="date"
                      className="w-full rounded border px-3 py-2 text-gray-900"
                      value={formData.fecha_vencimiento}
                      onChange={(e) => setFormData({ ...formData, fecha_vencimiento: e.target.value })}
                    />
                  </div>
                )}
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-gray-900">Descripción (opcional)</label>
                  <textarea
                    placeholder="Detalles adicionales del producto..."
                    rows={3}
                    className="w-full rounded border px-3 py-2 text-gray-900 placeholder:text-gray-500"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <button
                  type="submit"
                  className="rounded-lg bg-green-600 px-4 py-2 font-medium text-white transition hover:bg-green-700 md:col-span-2"
                >
                  {editingProductId ? "Guardar Cambios" : "Guardar Producto"}
                </button>
              </form>
            </div>
          )}

          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-gray-900">Nombre</th>
                    <th className="px-4 py-3 text-left text-gray-900">Categoría</th>
                    <th className="px-4 py-3 text-left text-gray-900">SKU</th>
                    <th className="px-4 py-3 text-left text-gray-900">Stock</th>
                    <th className="px-4 py-3 text-left text-gray-900">Stock Mín</th>
                    <th className="px-4 py-3 text-left text-gray-900">Stock Máx</th>
                    <th className="px-4 py-3 text-left text-gray-900">Unidad</th>
                    <th className="px-4 py-3 text-left text-gray-900">Fecha Compra</th>
                    <th className="px-4 py-3 text-left text-gray-900">Vencimiento</th>
                    <th className="px-4 py-3 text-left text-gray-900">Garantía</th>
                    <th className="px-4 py-3 text-left text-gray-900">Estado</th>
                    {isAdmin && <th className="px-4 py-3 text-left text-gray-900">Acciones</th>}
                  </tr>
                </thead>
                <tbody>
                  {paginatedProducts.map((product) => (
                    <tr key={product.id} className={`border-t border-slate-100 hover:bg-slate-50 ${!product.is_active ? "bg-slate-50/70" : ""}`}>
                      <td className="px-4 py-3 text-gray-900">{product.name}</td>
                      <td className="px-4 py-3 text-gray-900">{capitalizeFirst(product.category || "otros")}</td>
                      <td className="px-4 py-3 text-gray-900">{product.sku}</td>
                      <td className={`px-4 py-3 font-semibold ${
                        product.stock_actual <= product.stock_minimo ? "text-red-600" : "text-green-600"
                      }`}>
                        {product.stock_actual}
                      </td>
                      <td className="px-4 py-3 text-gray-900">{product.stock_minimo}</td>
                      <td className="px-4 py-3 text-gray-900">{product.stock_maximo || "-"}</td>
                      <td className="px-4 py-3 text-gray-900">{capitalizeFirst(product.unit)}</td>
                      <td className="px-4 py-3 text-gray-900">
                        {product.fecha_compra ? new Date(product.fecha_compra).toLocaleDateString("es-CO") : "-"}
                      </td>
                      <td className="px-4 py-3 text-gray-900">
                        {product.fecha_vencimiento ? (
                          <span className={`rounded px-2 py-1 text-xs font-medium ${
                            new Date(product.fecha_vencimiento) < new Date()
                              ? "bg-red-100 text-red-800"
                              : new Date(product.fecha_vencimiento) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                              ? "bg-amber-100 text-amber-800"
                              : "bg-green-100 text-green-800"
                          }`}>
                            {new Date(product.fecha_vencimiento).toLocaleDateString("es-CO")}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-900">{product.periodo_garantia_meses ?? "-"}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded px-2 py-1 text-xs ${
                          product.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                        }`}>
                          {product.is_active ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      {isAdmin && (
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleEdit(product)}
                              className="rounded bg-slate-600 px-3 py-1.5 text-sm text-white transition hover:bg-slate-700"
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleProductStatus(product)}
                              className={`rounded px-3 py-1.5 text-sm text-white transition ${
                                product.is_active
                                  ? "bg-amber-600 hover:bg-amber-700"
                                  : "bg-emerald-600 hover:bg-emerald-700"
                              }`}
                            >
                              {product.is_active ? "Deshabilitar" : "Activar"}
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredProducts.length === 0 && (
                <p className="p-4 text-center text-slate-700">
                  {searchCode ? "No hay productos que coincidan con la búsqueda" : "No hay productos registrados"}
                </p>
              )}
            </div>
            {filteredProducts.length > 0 && (
              <div className="flex items-center justify-between border-t border-slate-200 px-4 py-4">
                <p className="text-sm text-slate-700">
                  Página {currentPage} de {totalPages} | Mostrando {paginatedProducts.length} de {filteredProducts.length} productos
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="rounded-lg bg-slate-600 px-4 py-2 font-medium text-white transition disabled:opacity-50 hover:bg-slate-700 disabled:cursor-not-allowed"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="rounded-lg bg-slate-600 px-4 py-2 font-medium text-white transition disabled:opacity-50 hover:bg-slate-700 disabled:cursor-not-allowed"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </div>
        </PageShell>
      </Sidebar>
    </ProtectedRoute>
  );
}
