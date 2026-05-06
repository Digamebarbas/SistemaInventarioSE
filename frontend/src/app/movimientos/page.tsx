"use client";
import ProtectedRoute from "@/components/ProtectedRoute";
import Sidebar from "@/components/Sidebar";
import PageShell from "@/components/PageShell";
import { ToastContainer } from "@/components/Toast";
import { useNotification } from "@/lib/useNotification";
import apiClient from "@/lib/api";
import { useEffect, useMemo, useRef, useState } from "react";

interface Product {
  id: number;
  name: string;
  category?: string;
  sku: string;
  barcode: string;
  qr_code: string;
  stock_actual: number;
}

interface Customer {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  tax_id?: string;
}

interface Supplier {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  tax_id?: string;
}

interface Movement {
  id: number;
  product: number;
  movement_type: string;
  quantity: number;
  previous_stock: number;
  new_stock: number;
  reason: string;
  created_by_username?: string;
  created_at: string;
}

export default function MovimientosPage() {
  const { toasts, removeNotification, success, error } = useNotification();
  const [movements, setMovements] = useState<Movement[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [isOperator, setIsOperator] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    specificDate: "",
    movementType: "",
    product: "",
  });
  const [selectedMovement, setSelectedMovement] = useState<Movement | null>(null);
  const [formData, setFormData] = useState({
    product: "",
    movement_type: "IN",
    quantity: 0,
    reason: "",
    supplier: "",
    customer: "",
  });
  const [productSearch, setProductSearch] = useState("");
  const [productDropdownOpen, setProductDropdownOpen] = useState(false);
  const [filterProductSearch, setFilterProductSearch] = useState("");
  const productDropdownRef = useRef<HTMLDivElement | null>(null);
  const [showQuickCustomer, setShowQuickCustomer] = useState(false);
  const [showQuickSupplier, setShowQuickSupplier] = useState(false);
  const [quickCustomerForm, setQuickCustomerForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    tax_id: "",
  });
  const [quickSupplierForm, setQuickSupplierForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    tax_id: "",
  });
  const [creatingCustomer, setCreatingCustomer] = useState(false);
  const [creatingSupplier, setCreatingSupplier] = useState(false);

  const PRODUCTS_CACHE_KEY = "products_cache_all_technology";

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

  const loadMovements = async () => {
    try {
      const res = await apiClient.get("/inventory/movements/");
      setMovements(res.data);
    } catch (error) {
      console.error("Error loading movements:", error);
    }
  };

  const loadProducts = async () => {
    const cached = readProductsCache();
    if (cached && cached.length > 0) {
      setProducts(cached);
    }

    try {
      const res = await apiClient.get("/inventory/products/");
      setProducts(res.data);
      writeProductsCache(res.data);
    } catch (error) {
      console.error("Error loading products:", error);
    }
  };

  const loadCustomers = async () => {
    try {
      const res = await apiClient.get("/crm/customers/");
      setCustomers(res.data);
    } catch (error) {
      console.error("Error loading customers:", error);
    }
  };

  const loadSuppliers = async () => {
    try {
      const res = await apiClient.get("/crm/suppliers/");
      setSuppliers(res.data);
    } catch (error) {
      console.error("Error loading suppliers:", error);
    }
  };

  const loadMe = async () => {
    try {
      const res = await apiClient.get("/auth/me/");
      const roles = Array.isArray(res.data?.roles) ? res.data.roles : [];
      const admin = Boolean(res.data?.is_admin) || roles.includes("Admin");
      setIsAdmin(admin);
      setIsOperator(roles.includes("Usuario"));
    } catch {
      setIsAdmin(false);
      setIsOperator(false);
    }
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadMe();
      void loadMovements();
      void loadProducts();
      void loadCustomers();
      void loadSuppliers();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    if (!productDropdownOpen) return;

    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (productDropdownRef.current && !productDropdownRef.current.contains(target)) {
        setProductDropdownOpen(false);
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setProductDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscapeKey);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [productDropdownOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.product) {
      error("Debes seleccionar un producto");
      return;
    }

    try {
      await apiClient.post("/inventory/movements/", formData);
      success("Movimiento registrado exitosamente");
      setShowForm(false);
      setFormData({
        product: "",
        movement_type: "IN",
        quantity: 0,
        reason: "",
        supplier: "",
        customer: "",
      });
      setProductSearch("");
      setProductDropdownOpen(false);
      loadMovements();
      loadProducts();
      loadCustomers();
      loadSuppliers();
    } catch (err) {
      const errObj = err as { response?: { data?: { detail?: string } } };
      error(errObj.response?.data?.detail || "Error al crear movimiento");
    }
  };

  const getMovementTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      IN: "Entrada",
      OUT: "Salida",
      ADJ: "Ajuste",
    };
    return types[type] || type;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("es-ES");
  };

  const handleMovementTypeChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      movement_type: value,
      supplier: value === "OUT" ? "" : prev.supplier,
      customer: value === "OUT" ? prev.customer : "",
    }));
  };

  const canCreateMovements = isAdmin || isOperator;

  const handleQuickCreateCustomer = async () => {
    const name = quickCustomerForm.name.trim();
    if (!name) {
      error("Ingresa el nombre del cliente");
      return;
    }

    try {
      setCreatingCustomer(true);
      const res = await apiClient.post("/crm/customers/", {
        name,
        email: quickCustomerForm.email.trim(),
        phone: quickCustomerForm.phone.trim(),
        address: quickCustomerForm.address.trim(),
        tax_id: quickCustomerForm.tax_id.trim(),
      });
      const created = res.data as Customer;
      setCustomers((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      setFormData((prev) => ({ ...prev, customer: String(created.id) }));
      setQuickCustomerForm({ name: "", email: "", phone: "", address: "", tax_id: "" });
      setShowQuickCustomer(false);
      success("Cliente creado y seleccionado");
    } catch {
      error("No se pudo crear el cliente");
    } finally {
      setCreatingCustomer(false);
    }
  };

  const handleQuickCreateSupplier = async () => {
    const name = quickSupplierForm.name.trim();
    if (!name) {
      error("Ingresa el nombre del proveedor");
      return;
    }

    try {
      setCreatingSupplier(true);
      const res = await apiClient.post("/crm/suppliers/", {
        name,
        email: quickSupplierForm.email.trim(),
        phone: quickSupplierForm.phone.trim(),
        address: quickSupplierForm.address.trim(),
        tax_id: quickSupplierForm.tax_id.trim(),
      });
      const created = res.data as Supplier;
      setSuppliers((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      setFormData((prev) => ({ ...prev, supplier: String(created.id) }));
      setQuickSupplierForm({ name: "", email: "", phone: "", address: "", tax_id: "" });
      setShowQuickSupplier(false);
      success("Proveedor creado y seleccionado");
    } catch {
      error("No se pudo crear el proveedor");
    } finally {
      setCreatingSupplier(false);
    }
  };

  const filteredMovements = useMemo(() => {
    const getDateKey = (value: string) => {
      const date = new Date(value);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    return movements.filter((movement) => {
      const movementDate = getDateKey(movement.created_at);

      if (filters.movementType && movement.movement_type !== filters.movementType) {
        return false;
      }

      if (filters.product && movement.product !== Number(filters.product)) {
        return false;
      }

      if (filters.specificDate) {
        return movementDate === filters.specificDate;
      }

      if (filters.startDate && movementDate < filters.startDate) {
        return false;
      }

      if (filters.endDate && movementDate > filters.endDate) {
        return false;
      }

      return true;
    });
  }, [movements, filters]);

  const searchableProductsForForm = useMemo(() => {
    const term = productSearch.trim().toLowerCase();
    if (!term) return products;
    return products.filter((product) => {
      const inferredBrand = product.name.split(" ")[0]?.toLowerCase() || "";
      return (
        product.name.toLowerCase().includes(term) ||
        (product.category || "").toLowerCase().includes(term) ||
        inferredBrand.includes(term) ||
        product.sku.toLowerCase().includes(term) ||
        product.barcode.toLowerCase().includes(term) ||
        product.qr_code.toLowerCase().includes(term)
      );
    });
  }, [products, productSearch]);

  const selectedProductLabel = useMemo(() => {
    if (!formData.product) return "Seleccionar...";
    const selected = products.find((p) => p.id === Number(formData.product));
    if (!selected) return "Seleccionar...";
    return `${selected.name} - ${selected.sku} (Stock: ${selected.stock_actual})`;
  }, [products, formData.product]);

  const searchableProductsForFilter = useMemo(() => {
    const term = filterProductSearch.trim().toLowerCase();
    if (!term) return products;
    return products.filter((product) => {
      const inferredBrand = product.name.split(" ")[0]?.toLowerCase() || "";
      return (
        product.name.toLowerCase().includes(term) ||
        (product.category || "").toLowerCase().includes(term) ||
        inferredBrand.includes(term) ||
        product.sku.toLowerCase().includes(term) ||
        product.barcode.toLowerCase().includes(term) ||
        product.qr_code.toLowerCase().includes(term)
      );
    });
  }, [products, filterProductSearch]);

  return (
    <ProtectedRoute>
      <Sidebar>
        <ToastContainer toasts={toasts} onClose={removeNotification} />
        <PageShell>
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900">Movimientos de Inventario</h1>
            <p className="mt-2 text-slate-600">Registra y monitorea entradas, salidas y ajustes</p>
          </div>

          {/* Illustration Header */}
          <div className="mb-8 rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h2 className="mb-2 text-xl font-semibold text-slate-900">Control de Movimientos</h2>
                <p className="text-slate-600">Mantén un registro detallado de todas las operaciones de inventario</p>
              </div>
              <svg className="h-32 w-32 opacity-80" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="20" y="20" width="25" height="30" fill="#3b82f6" opacity="0.2" stroke="#3b82f6" strokeWidth="2" />
                <rect x="55" y="20" width="25" height="30" fill="#3b82f6" opacity="0.2" stroke="#3b82f6" strokeWidth="2" />
                <path d="M32.5 55 L67.5 55" stroke="#333" strokeWidth="2" strokeLinecap="round" />
                <circle cx="32.5" cy="55" r="3" fill="#333" />
                <circle cx="67.5" cy="55" r="3" fill="#333" />
                <path d="M42.5 65 Q50 75 57.5 65" stroke="#10b981" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
          </div>

          <div className="mb-8 flex items-center justify-between">
            {canCreateMovements && (
              <button
                onClick={() => setShowForm(!showForm)}
                className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-700"
              >
                {showForm ? "Cancelar" : "Nuevo Movimiento"}
              </button>
            )}
          </div>

          {showForm && canCreateMovements && (
            <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-5 text-xl font-semibold text-slate-900">Nuevo Movimiento</h2>
              <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-900">Producto *</label>
                  <div ref={productDropdownRef} className="relative">
                    <button
                      type="button"
                      className="w-full rounded border px-3 py-2 text-left text-gray-900"
                      onClick={() => setProductDropdownOpen((prev) => !prev)}
                    >
                      {selectedProductLabel}
                    </button>

                    {productDropdownOpen && (
                      <div className="absolute z-20 mt-1 w-full rounded border border-slate-300 bg-white p-2 shadow-lg">
                        <input
                          autoFocus
                          type="text"
                          placeholder="Buscar por nombre, marca o categoria..."
                          className="mb-2 w-full rounded border px-3 py-2 text-gray-900 placeholder:text-gray-500"
                          value={productSearch}
                          onChange={(e) => setProductSearch(e.target.value)}
                        />
                        <div className="max-h-56 overflow-auto rounded border border-slate-200">
                          {searchableProductsForForm.length === 0 && (
                            <p className="px-3 py-2 text-sm text-slate-500">Sin resultados</p>
                          )}
                          {searchableProductsForForm.map((product) => (
                            <button
                              key={product.id}
                              type="button"
                              className="block w-full px-3 py-2 text-left text-sm text-slate-800 hover:bg-slate-100"
                              onClick={() => {
                                setFormData({ ...formData, product: String(product.id) });
                                setProductDropdownOpen(false);
                              }}
                            >
                              {product.name}
                              {product.category ? ` [${product.category}]` : ""} - {product.sku} (Stock: {product.stock_actual})
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-900">Tipo de Movimiento *</label>
                  <select
                    className="w-full rounded border px-3 py-2 text-gray-900"
                    value={formData.movement_type}
                    onChange={(e) => handleMovementTypeChange(e.target.value)}
                  >
                    <option value="IN">Entrada</option>
                    <option value="OUT">Salida</option>
                    <option value="ADJ">Ajuste</option>
                  </select>
                </div>
                {formData.movement_type === "OUT" && (
                  <div>
                    <div className="mb-1 flex items-center justify-between gap-3">
                      <label className="block text-sm font-medium text-gray-900">Cliente *</label>
                      <button
                        type="button"
                        className="text-xs font-semibold text-blue-700 hover:text-blue-800"
                        onClick={() => setShowQuickCustomer(true)}
                      >
                        + Nuevo cliente
                      </button>
                    </div>
                    <select
                      required
                      className="w-full rounded border px-3 py-2 text-gray-900"
                      value={formData.customer}
                      onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
                    >
                      <option value="">Seleccionar cliente...</option>
                      {customers.map((customer) => (
                        <option key={customer.id} value={customer.id}>
                          {customer.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                {formData.movement_type !== "OUT" && (
                  <div>
                    <div className="mb-1 flex items-center justify-between gap-3">
                      <label className="block text-sm font-medium text-gray-900">Proveedor *</label>
                      <button
                        type="button"
                        className="text-xs font-semibold text-blue-700 hover:text-blue-800"
                        onClick={() => setShowQuickSupplier(true)}
                      >
                        + Nuevo proveedor
                      </button>
                    </div>
                    <select
                      required
                      className="w-full rounded border px-3 py-2 text-gray-900"
                      value={formData.supplier}
                      onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                    >
                      <option value="">Seleccionar proveedor...</option>
                      {suppliers.map((supplier) => (
                        <option key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-900">Cantidad *</label>
                  <input
                    type="number"
                    placeholder="0"
                    required
                    min="1"
                    className="w-full rounded border px-3 py-2 text-gray-900 placeholder:text-gray-500"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-900">Motivo (opcional)</label>
                  <input
                    type="text"
                    placeholder="Ej: Compra, Venta, Ajuste por inventario"
                    className="w-full rounded border px-3 py-2 text-gray-900 placeholder:text-gray-500"
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  />
                </div>
                <button
                  type="submit"
                  className="rounded-lg bg-green-600 px-4 py-2 font-medium text-white transition hover:bg-green-700 md:col-span-2"
                >
                  Registrar Movimiento
                </button>
              </form>
            </div>
          )}

          <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-semibold text-slate-900">Filtros</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-900">Fecha específica</label>
                <input
                  type="date"
                  className="w-full rounded border px-3 py-2 text-gray-900"
                  value={filters.specificDate}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      specificDate: e.target.value,
                      startDate: e.target.value ? "" : prev.startDate,
                      endDate: e.target.value ? "" : prev.endDate,
                    }))
                  }
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-900">Desde</label>
                <input
                  type="date"
                  disabled={Boolean(filters.specificDate)}
                  className="w-full rounded border px-3 py-2 text-gray-900 disabled:cursor-not-allowed disabled:bg-gray-100"
                  value={filters.startDate}
                  onChange={(e) => setFilters((prev) => ({ ...prev, startDate: e.target.value }))}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-900">Hasta</label>
                <input
                  type="date"
                  disabled={Boolean(filters.specificDate)}
                  className="w-full rounded border px-3 py-2 text-gray-900 disabled:cursor-not-allowed disabled:bg-gray-100"
                  value={filters.endDate}
                  onChange={(e) => setFilters((prev) => ({ ...prev, endDate: e.target.value }))}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-900">Tipo de movimiento</label>
                <select
                  className="w-full rounded border px-3 py-2 text-gray-900"
                  value={filters.movementType}
                  onChange={(e) => setFilters((prev) => ({ ...prev, movementType: e.target.value }))}
                >
                  <option value="">Todos</option>
                  <option value="IN">Entrada</option>
                  <option value="OUT">Salida</option>
                  <option value="ADJ">Ajuste</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-900">Producto</label>
                <input
                  type="text"
                  placeholder="Buscar por nombre, marca o categoria"
                  className="mb-2 w-full rounded border px-3 py-2 text-gray-900 placeholder:text-gray-500"
                  value={filterProductSearch}
                  onChange={(e) => setFilterProductSearch(e.target.value)}
                />
                <select
                  className="w-full rounded border px-3 py-2 text-gray-900"
                  value={filters.product}
                  onChange={(e) => setFilters((prev) => ({ ...prev, product: e.target.value }))}
                >
                  <option value="">Todos</option>
                  {searchableProductsForFilter.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                className="rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-700 transition hover:bg-slate-100"
                onClick={() => {
                  setFilters({
                    startDate: "",
                    endDate: "",
                    specificDate: "",
                    movementType: "",
                    product: "",
                  });
                  setFilterProductSearch("");
                }}
              >
                Limpiar filtros
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-gray-900">Producto</th>
                    <th className="px-4 py-3 text-left text-gray-900">Tipo</th>
                    <th className="px-4 py-3 text-left text-gray-900">Cantidad</th>
                    <th className="px-4 py-3 text-left text-gray-900">Stock Anterior</th>
                    <th className="px-4 py-3 text-left text-gray-900">Stock Nuevo</th>
                    <th className="px-4 py-3 text-left text-gray-900">Usuario</th>
                    <th className="px-4 py-3 text-left text-gray-900">Motivo</th>
                    <th className="px-4 py-3 text-left text-gray-900">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMovements.map((movement) => (
                    <tr key={movement.id} className="border-t border-slate-100 cursor-pointer hover:bg-cyan-50" onClick={() => setSelectedMovement(movement)}>
                      <td className="px-4 py-3 text-gray-900">
                        {products.find((p) => p.id === movement.product)?.name || `ID: ${movement.product}`}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded px-2 py-1 text-xs ${
                          movement.movement_type === "IN"
                            ? "bg-green-100 text-green-800"
                            : movement.movement_type === "OUT"
                            ? "bg-red-100 text-red-800"
                            : "bg-blue-100 text-blue-800"
                        }`}>
                          {getMovementTypeLabel(movement.movement_type)}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-900">{movement.quantity}</td>
                      <td className="px-4 py-3 text-gray-900">{movement.previous_stock}</td>
                      <td className="px-4 py-3 text-gray-900">{movement.new_stock}</td>
                      <td className="px-4 py-3 text-gray-900">{movement.created_by_username || "Sin usuario"}</td>
                      <td className="px-4 py-3 text-gray-900">{movement.reason || "-"}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{formatDate(movement.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredMovements.length === 0 && (
                <p className="p-4 text-center text-slate-700">No hay movimientos para los filtros seleccionados</p>
              )}
            </div>
          </div>

          {showQuickCustomer && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="relative w-full max-w-2xl rounded-xl bg-white p-6 shadow-2xl">
                <button
                  onClick={() => setShowQuickCustomer(false)}
                  className="absolute right-4 top-4 text-gray-500 hover:text-gray-700"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                <h2 className="mb-5 text-xl font-semibold text-slate-900">Nuevo Cliente</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-900">Nombre *</label>
                    <input
                      type="text"
                      placeholder="Ej: Juan Perez"
                      required
                      className="w-full rounded border px-3 py-2 text-gray-900 placeholder:text-gray-500"
                      value={quickCustomerForm.name}
                      onChange={(e) => setQuickCustomerForm({ ...quickCustomerForm, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-900">Email</label>
                    <input
                      type="email"
                      placeholder="ejemplo@correo.com"
                      className="w-full rounded border px-3 py-2 text-gray-900 placeholder:text-gray-500"
                      value={quickCustomerForm.email}
                      onChange={(e) => setQuickCustomerForm({ ...quickCustomerForm, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-900">Telefono</label>
                    <input
                      type="text"
                      placeholder="300 123 4567"
                      className="w-full rounded border px-3 py-2 text-gray-900 placeholder:text-gray-500"
                      value={quickCustomerForm.phone}
                      onChange={(e) => setQuickCustomerForm({ ...quickCustomerForm, phone: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-900">NIT/Cedula</label>
                    <input
                      type="text"
                      placeholder="123456789"
                      className="w-full rounded border px-3 py-2 text-gray-900 placeholder:text-gray-500"
                      value={quickCustomerForm.tax_id}
                      onChange={(e) => setQuickCustomerForm({ ...quickCustomerForm, tax_id: e.target.value })}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="mb-1 block text-sm font-medium text-gray-900">Direccion</label>
                    <input
                      type="text"
                      placeholder="Calle 123 #45-67"
                      className="w-full rounded border px-3 py-2 text-gray-900 placeholder:text-gray-500"
                      value={quickCustomerForm.address}
                      onChange={(e) => setQuickCustomerForm({ ...quickCustomerForm, address: e.target.value })}
                    />
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-2">
                  <button
                    type="button"
                    className="rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:bg-slate-100"
                    onClick={() => setShowQuickCustomer(false)}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                    onClick={handleQuickCreateCustomer}
                    disabled={creatingCustomer}
                  >
                    {creatingCustomer ? "Creando..." : "Crear Cliente"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {showQuickSupplier && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="relative w-full max-w-2xl rounded-xl bg-white p-6 shadow-2xl">
                <button
                  onClick={() => setShowQuickSupplier(false)}
                  className="absolute right-4 top-4 text-gray-500 hover:text-gray-700"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                <h2 className="mb-5 text-xl font-semibold text-slate-900">Nuevo Proveedor</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-900">Nombre *</label>
                    <input
                      type="text"
                      placeholder="Ej: Distribuidora XYZ"
                      required
                      className="w-full rounded border px-3 py-2 text-gray-900 placeholder:text-gray-500"
                      value={quickSupplierForm.name}
                      onChange={(e) => setQuickSupplierForm({ ...quickSupplierForm, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-900">Email</label>
                    <input
                      type="email"
                      placeholder="ventas@proveedor.com"
                      className="w-full rounded border px-3 py-2 text-gray-900 placeholder:text-gray-500"
                      value={quickSupplierForm.email}
                      onChange={(e) => setQuickSupplierForm({ ...quickSupplierForm, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-900">Telefono</label>
                    <input
                      type="text"
                      placeholder="601 234 5678"
                      className="w-full rounded border px-3 py-2 text-gray-900 placeholder:text-gray-500"
                      value={quickSupplierForm.phone}
                      onChange={(e) => setQuickSupplierForm({ ...quickSupplierForm, phone: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-900">NIT</label>
                    <input
                      type="text"
                      placeholder="900123456-7"
                      className="w-full rounded border px-3 py-2 text-gray-900 placeholder:text-gray-500"
                      value={quickSupplierForm.tax_id}
                      onChange={(e) => setQuickSupplierForm({ ...quickSupplierForm, tax_id: e.target.value })}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="mb-1 block text-sm font-medium text-gray-900">Direccion</label>
                    <input
                      type="text"
                      placeholder="Carrera 45 #78-90"
                      className="w-full rounded border px-3 py-2 text-gray-900 placeholder:text-gray-500"
                      value={quickSupplierForm.address}
                      onChange={(e) => setQuickSupplierForm({ ...quickSupplierForm, address: e.target.value })}
                    />
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-2">
                  <button
                    type="button"
                    className="rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:bg-slate-100"
                    onClick={() => setShowQuickSupplier(false)}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                    onClick={handleQuickCreateSupplier}
                    disabled={creatingSupplier}
                  >
                    {creatingSupplier ? "Creando..." : "Crear Proveedor"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modal de Detalles */}
          {selectedMovement && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="relative w-full max-w-2xl rounded-xl bg-white p-8 shadow-2xl">
                <button
                  onClick={() => setSelectedMovement(null)}
                  className="absolute right-4 top-4 text-gray-500 hover:text-gray-700"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                <h2 className="mb-6 text-2xl font-bold text-slate-900">Detalles del Movimiento</h2>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="rounded-lg bg-slate-50 p-4">
                    <p className="text-sm text-slate-600">Producto</p>
                    <p className="text-lg font-semibold text-slate-900">
                      {products.find((p) => p.id === selectedMovement.product)?.name || `ID: ${selectedMovement.product}`}
                    </p>
                  </div>

                  <div className="rounded-lg bg-slate-50 p-4">
                    <p className="text-sm text-slate-600">Tipo de Movimiento</p>
                    <div className="mt-1">
                      <span className={`inline-block rounded px-3 py-1 text-sm font-semibold ${
                        selectedMovement.movement_type === "IN"
                          ? "bg-green-100 text-green-800"
                          : selectedMovement.movement_type === "OUT"
                          ? "bg-red-100 text-red-800"
                          : "bg-blue-100 text-blue-800"
                      }`}>
                        {getMovementTypeLabel(selectedMovement.movement_type)}
                      </span>
                    </div>
                  </div>

                  <div className="rounded-lg bg-slate-50 p-4">
                    <p className="text-sm text-slate-600">Cantidad Movida</p>
                    <p className="text-lg font-semibold text-slate-900">{selectedMovement.quantity}</p>
                  </div>

                  <div className="rounded-lg bg-slate-50 p-4">
                    <p className="text-sm text-slate-600">Stock Anterior</p>
                    <p className="text-lg font-semibold text-slate-900">{selectedMovement.previous_stock}</p>
                  </div>

                  <div className="rounded-lg bg-slate-50 p-4">
                    <p className="text-sm text-slate-600">Stock Nuevo</p>
                    <p className="text-lg font-semibold text-slate-900">{selectedMovement.new_stock}</p>
                  </div>

                  <div className="rounded-lg bg-slate-50 p-4">
                    <p className="text-sm text-slate-600">Motivo</p>
                    <p className="text-lg font-semibold text-slate-900">{selectedMovement.reason || "-"}</p>
                  </div>

                  <div className="rounded-lg bg-slate-50 p-4">
                    <p className="text-sm text-slate-600">Usuario</p>
                    <p className="text-lg font-semibold text-slate-900">{selectedMovement.created_by_username || "Sin usuario"}</p>
                  </div>

                  <div className="md:col-span-2 rounded-lg bg-slate-50 p-4">
                    <p className="text-sm text-slate-600">Fecha y Hora</p>
                    <p className="text-lg font-semibold text-slate-900">{formatDate(selectedMovement.created_at)}</p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedMovement(null)}
                  className="mt-6 w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-700"
                >
                  Cerrar
                </button>
              </div>
            </div>
          )}
        </PageShell>
      </Sidebar>
    </ProtectedRoute>
  );
}
