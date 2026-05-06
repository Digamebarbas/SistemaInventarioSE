"use client";
import ProtectedRoute from "@/components/ProtectedRoute";
import Sidebar from "@/components/Sidebar";
import PageShell from "@/components/PageShell";
import { ToastContainer } from "@/components/Toast";
import CSVImporter from "@/components/CSVImporter";
import { useNotification } from "@/lib/useNotification";
import apiClient from "@/lib/api";
import { useEffect, useState, useMemo } from "react";

interface Supplier {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  tax_id: string;
}

export default function ProveedoresPage() {
  const { toasts, removeNotification, success, error } = useNotification();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 100;
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    tax_id: "",
  });

  const loadSuppliers = async () => {
    const res = await apiClient.get("/crm/suppliers/");
    setSuppliers(res.data);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadSuppliers();
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  const filteredSuppliers = useMemo(() => {
    if (searchTerm.trim() === "") {
      return suppliers;
    }
    return suppliers.filter(
      (s) =>
        s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.tax_id?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, suppliers]);

  const paginatedSuppliers = useMemo(() => {
    return filteredSuppliers.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
  }, [filteredSuppliers, currentPage]);

  const totalPages = Math.ceil(filteredSuppliers.length / itemsPerPage);

  const openNewForm = () => {
    setEditingSupplier(null);
    setFormData({ name: "", email: "", phone: "", address: "", tax_id: "" });
    setShowForm(true);
  };

  const openEditForm = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      email: supplier.email,
      phone: supplier.phone,
      address: supplier.address,
      tax_id: supplier.tax_id,
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingSupplier(null);
    setFormData({ name: "", email: "", phone: "", address: "", tax_id: "" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSupplier) {
        await apiClient.patch(`/crm/suppliers/${editingSupplier.id}/`, formData);
        success("Proveedor actualizado exitosamente");
      } else {
        await apiClient.post("/crm/suppliers/", formData);
        success("Proveedor creado exitosamente");
      }
      closeForm();
      void loadSuppliers();
    } catch {
      error(editingSupplier ? "Error al actualizar proveedor" : "Error al crear proveedor");
    }
  };

  return (
    <ProtectedRoute>
      <Sidebar>
        <ToastContainer toasts={toasts} onClose={removeNotification} />
        <PageShell>
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900">Proveedores</h1>
            <p className="mt-2 text-slate-600">Administra tu red de proveedores</p>
          </div>

          {/* Illustration Header */}
          <div className="mb-8 rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h2 className="mb-2 text-xl font-semibold text-slate-900">Gestión de Proveedores</h2>
                <p className="text-slate-600">Controla y optimiza tus relaciones con proveedores</p>
              </div>
              <svg className="h-32 w-32 opacity-80" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 70 L20 30 Q20 20 30 20 L70 20 Q80 20 80 30 L80 70" fill="#f59e0b" opacity="0.1" stroke="#f59e0b" strokeWidth="2" />
                <line x1="30" y1="20" x2="30" y2="70" stroke="#f59e0b" strokeWidth="1.5" />
                <line x1="50" y1="20" x2="50" y2="70" stroke="#f59e0b" strokeWidth="1.5" />
                <line x1="70" y1="20" x2="70" y2="70" stroke="#f59e0b" strokeWidth="1.5" />
                <line x1="20" y1="45" x2="80" y2="45" stroke="#f59e0b" strokeWidth="1.5" />
              </svg>
            </div>
          </div>

          <div className="mb-8 flex items-center justify-between gap-3">
            <button
              onClick={showForm ? closeForm : openNewForm}
              className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-700"
            >
              {showForm ? "Cancelar" : "Nuevo Proveedor"}
            </button>
            <CSVImporter
              endpoint="/crm/suppliers/"
              entityName="proveedor"
              columns={["name", "email", "phone", "address", "tax_id"]}
              onSuccess={() => {
                loadSuppliers();
                success("Archivo importado exitosamente");
              }}
            />
          </div>

          {/* Buscador */}
          <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <input
                type="text"
                placeholder="Buscar por nombre o NIT..."
                className="w-full flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 placeholder:text-slate-500 outline-none transition focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="rounded-lg bg-slate-700 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
                >
                  Limpiar
                </button>
              )}
            </div>
            {searchTerm && (
              <p className="mt-2 text-sm text-slate-600">
                Mostrando {filteredSuppliers.length} de {suppliers.length} proveedores
              </p>
            )}
          </div>

          {showForm && (
            <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-5 text-xl font-semibold text-slate-900">
                {editingSupplier ? "Editar Proveedor" : "Nuevo Proveedor"}
              </h2>
              <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-900">Nombre *</label>
                  <input
                    type="text"
                    placeholder="Ej: Distribuidora XYZ"
                    required
                    className="w-full rounded border px-3 py-2 text-gray-900 placeholder:text-gray-500"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-900">Email</label>
                  <input
                    type="email"
                    placeholder="ventas@proveedor.com"
                    className="w-full rounded border px-3 py-2 text-gray-900 placeholder:text-gray-500"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-900">Teléfono</label>
                  <input
                    type="text"
                    placeholder="601 234 5678"
                    className="w-full rounded border px-3 py-2 text-gray-900 placeholder:text-gray-500"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-900">NIT</label>
                  <input
                    type="text"
                    placeholder="900123456-7"
                    className="w-full rounded border px-3 py-2 text-gray-900 placeholder:text-gray-500"
                    value={formData.tax_id}
                    onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-gray-900">Dirección</label>
                  <input
                    type="text"
                    placeholder="Carrera 45 #78-90"
                    className="w-full rounded border px-3 py-2 text-gray-900 placeholder:text-gray-500"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
                <button type="submit" className="rounded-lg bg-green-600 px-4 py-2 font-medium text-white transition hover:bg-green-700 md:col-span-2">
                  {editingSupplier ? "Guardar cambios" : "Guardar"}
                </button>
              </form>
            </div>
          )}

          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full">
              <thead className="bg-slate-100">
                <tr>
                  <th className="px-4 py-3 text-left text-gray-900">Nombre</th>
                  <th className="px-4 py-3 text-left text-gray-900">Email</th>
                  <th className="px-4 py-3 text-left text-gray-900">Teléfono</th>
                  <th className="px-4 py-3 text-left text-gray-900">NIT</th>
                  <th className="px-4 py-3 text-left text-gray-900">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {paginatedSuppliers.map((supplier) => (
                  <tr key={supplier.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 text-gray-900">{supplier.name}</td>
                    <td className="px-4 py-3 text-gray-900">{supplier.email || "-"}</td>
                    <td className="px-4 py-3 text-gray-900">{supplier.phone || "-"}</td>
                    <td className="px-4 py-3 text-gray-900">{supplier.tax_id || "-"}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => openEditForm(supplier)}
                        className="rounded bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700 transition hover:bg-blue-200"
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredSuppliers.length === 0 && (
              <p className="p-4 text-center text-slate-700">
                {searchTerm ? "No hay proveedores que coincidan con la búsqueda" : "No hay proveedores registrados"}
              </p>
            )}
          </div>
          {filteredSuppliers.length > 0 && (
            <div className="flex items-center justify-between border-t border-slate-200 px-4 py-4">
              <p className="text-sm text-slate-700">
                Página {currentPage} de {totalPages} | Mostrando {paginatedSuppliers.length} de {filteredSuppliers.length} proveedores
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
        </PageShell>
      </Sidebar>
    </ProtectedRoute>
  );
}
