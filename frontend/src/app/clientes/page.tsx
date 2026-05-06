"use client";
import ProtectedRoute from "@/components/ProtectedRoute";
import Sidebar from "@/components/Sidebar";
import PageShell from "@/components/PageShell";
import CSVImporter from "@/components/CSVImporter";
import { ToastContainer } from "@/components/Toast";
import { useNotification } from "@/lib/useNotification";
import apiClient from "@/lib/api";
import { useEffect, useState, useMemo } from "react";

interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  tax_id: string;
}

export default function ClientesPage() {
  const { toasts, removeNotification, success, error } = useNotification();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
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

  const loadCustomers = async () => {
    const res = await apiClient.get("/crm/customers/");
    setCustomers(res.data);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadCustomers();
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  const filteredCustomers = useMemo(() => {
    if (searchTerm.trim() === "") {
      return customers;
    }
    return customers.filter(
      (c) =>
        c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.tax_id?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, customers]);

  const paginatedCustomers = useMemo(() => {
    return filteredCustomers.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
  }, [filteredCustomers, currentPage]);

  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);

  const openNewForm = () => {
    setEditingCustomer(null);
    setFormData({ name: "", email: "", phone: "", address: "", tax_id: "" });
    setShowForm(true);
  };

  const openEditForm = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      tax_id: customer.tax_id,
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingCustomer(null);
    setFormData({ name: "", email: "", phone: "", address: "", tax_id: "" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCustomer) {
        await apiClient.patch(`/crm/customers/${editingCustomer.id}/`, formData);
        success("Cliente actualizado exitosamente");
      } else {
        await apiClient.post("/crm/customers/", formData);
        success("Cliente creado exitosamente");
      }
      closeForm();
      void loadCustomers();
    } catch {
      error(editingCustomer ? "Error al actualizar cliente" : "Error al crear cliente");
    }
  };

  return (
    <ProtectedRoute>
      <Sidebar>
        <ToastContainer toasts={toasts} onClose={removeNotification} />
        <PageShell>
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900">Clientes</h1>
            <p className="mt-2 text-slate-600">Administra tu cartera de clientes</p>
          </div>

          {/* Illustration Header */}
          <div className="mb-8 rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h2 className="mb-2 text-xl font-semibold text-slate-900">Gestión de Clientes</h2>
                <p className="text-slate-600">Mantén información detallada de todos tus clientes</p>
              </div>
              <svg className="h-32 w-32 opacity-80" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="50" cy="30" r="12" fill="#3b82f6" opacity="0.2" stroke="#3b82f6" strokeWidth="2" />
                <path d="M35 50 Q50 45 65 50" fill="#3b82f6" opacity="0.2" stroke="#3b82f6" strokeWidth="2" />
                <path d="M30 60 L30 75 Q30 80 35 80 L65 80 Q70 80 70 75 L70 60" fill="none" stroke="#3b82f6" strokeWidth="2" />
              </svg>
            </div>
          </div>

          <div className="mb-8 flex items-center justify-between gap-3">
            <button
              onClick={showForm ? closeForm : openNewForm}
              className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-700"
            >
              {showForm ? "Cancelar" : "Nuevo Cliente"}
            </button>
            <CSVImporter
              endpoint="/crm/customers/"
              entityName="cliente"
              columns={["name", "email", "phone", "address", "tax_id"]}
              onSuccess={loadCustomers}
            />
          </div>

          {/* Buscador */}
          <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <input
                type="text"
                placeholder="Buscar por nombre o cédula/NIT..."
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
                Mostrando {filteredCustomers.length} de {customers.length} clientes
              </p>
            )}
          </div>

          {showForm && (
            <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-5 text-xl font-semibold text-slate-900">
                {editingCustomer ? "Editar Cliente" : "Nuevo Cliente"}
              </h2>
              <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-900">Nombre *</label>
                  <input
                    type="text"
                    placeholder="Ej: Juan Pérez"
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
                    placeholder="ejemplo@correo.com"
                    className="w-full rounded border px-3 py-2 text-gray-900 placeholder:text-gray-500"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-900">Teléfono</label>
                  <input
                    type="text"
                    placeholder="300 123 4567"
                    className="w-full rounded border px-3 py-2 text-gray-900 placeholder:text-gray-500"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-900">NIT/Cédula</label>
                  <input
                    type="text"
                    placeholder="123456789"
                    className="w-full rounded border px-3 py-2 text-gray-900 placeholder:text-gray-500"
                    value={formData.tax_id}
                    onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-gray-900">Dirección</label>
                  <input
                    type="text"
                    placeholder="Calle 123 #45-67"
                    className="w-full rounded border px-3 py-2 text-gray-900 placeholder:text-gray-500"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
                <button type="submit" className="rounded-lg bg-green-600 px-4 py-2 font-medium text-white transition hover:bg-green-700 md:col-span-2">
                  {editingCustomer ? "Guardar cambios" : "Guardar"}
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
                  <th className="px-4 py-3 text-left text-gray-900">NIT/CC</th>
                  <th className="px-4 py-3 text-left text-gray-900">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {paginatedCustomers.map((customer) => (
                  <tr key={customer.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 text-gray-900">{customer.name}</td>
                    <td className="px-4 py-3 text-gray-900">{customer.email || "-"}</td>
                    <td className="px-4 py-3 text-gray-900">{customer.phone || "-"}</td>
                    <td className="px-4 py-3 text-gray-900">{customer.tax_id || "-"}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => openEditForm(customer)}
                        className="rounded bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700 transition hover:bg-blue-200"
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredCustomers.length === 0 && (
              <p className="p-4 text-center text-slate-700">
                {searchTerm ? "No hay clientes que coincidan con la búsqueda" : "No hay clientes registrados"}
              </p>
            )}
          </div>
          {filteredCustomers.length > 0 && (
            <div className="flex items-center justify-between border-t border-slate-200 px-4 py-4">
              <p className="text-sm text-slate-700">
                Página {currentPage} de {totalPages} | Mostrando {paginatedCustomers.length} de {filteredCustomers.length} clientes
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
