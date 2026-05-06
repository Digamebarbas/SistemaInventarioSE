"use client";
import ProtectedRoute from "@/components/ProtectedRoute";
import Sidebar from "@/components/Sidebar";
import PageShell from "@/components/PageShell";
import apiClient from "@/lib/api";
import { useEffect, useMemo, useState } from "react";

interface AppUser {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  roles: string[];
}

export default function UsuariosPage() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentCompanyId, setCurrentCompanyId] = useState<number | null>(null);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    password: "",
    role: "Usuario",
    is_active: true,
  });

  const selectedRole = useMemo(() => formData.role, [formData.role]);

  const loadMe = async () => {
    const res = await apiClient.get("/auth/me/");
    const roles = Array.isArray(res.data?.roles) ? res.data.roles : [];
    setIsAdmin(Boolean(res.data?.is_admin) || roles.includes("Admin"));
    setCurrentCompanyId(typeof res.data?.company?.id === "number" ? res.data.company.id : null);
  };

  const loadUsers = async () => {
    const res = await apiClient.get("/auth/users/");
    setUsers(res.data);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadMe();
      loadUsers();
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  const resetForm = () => {
    setEditingUserId(null);
    setFormData({
      username: "",
      email: "",
      first_name: "",
      last_name: "",
      password: "",
      role: "Usuario",
      is_active: true,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Record<string, string | boolean | number[]> = {
      username: formData.username,
      email: formData.email,
      first_name: formData.first_name,
      last_name: formData.last_name,
      role: selectedRole,
      is_active: formData.is_active,
    };

    if (formData.password.trim()) {
      payload.password = formData.password;
    }

    try {
      if (editingUserId) {
        await apiClient.patch(`/auth/users/${editingUserId}/`, payload);
      } else {
        if (currentCompanyId) {
          payload.company_ids = [currentCompanyId];
        }
        if (!payload.password) {
          payload.password = "Temporal123*";
        }
        await apiClient.post("/auth/users/", payload);
      }

      setShowForm(false);
      resetForm();
      loadUsers();
    } catch (error) {
      const err = error as {
        response?: { data?: Record<string, string[] | string> };
      };

      const data = err.response?.data;
      if (!data) {
        alert("Error al guardar usuario");
        return;
      }

      const formatted = Object.entries(data)
        .map(([field, messages]) => {
          const value = Array.isArray(messages) ? messages.join(" ") : String(messages);
          return `${field}: ${value}`;
        })
        .join("\n");

      alert(formatted || "Error al guardar usuario");
    }
  };

  const handleEdit = (user: AppUser) => {
    setEditingUserId(user.id);
    setFormData({
      username: user.username,
      email: user.email || "",
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      password: "",
      role: user.roles.includes("Admin") ? "Admin" : "Usuario",
      is_active: user.is_active,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Seguro que deseas eliminar este usuario?")) {
      return;
    }

    try {
      const res = await apiClient.delete(`/auth/users/${id}/`);
      if (res.data?.detail) {
        alert(res.data.detail);
      }
      loadUsers();
    } catch (error) {
      const err = error as {
        response?: { data?: { detail?: string; error?: string } };
      };
      const detail = err.response?.data?.detail || "No se pudo eliminar el usuario";
      alert(detail);
    }
  };

  if (!isAdmin) {
    return (
      <ProtectedRoute>
        <Sidebar>
          <PageShell>
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h1 className="text-2xl font-semibold text-slate-900">Acceso restringido</h1>
                <p className="mt-2 text-slate-700">Solo el administrador puede gestionar usuarios.</p>
              </div>
          </PageShell>
        </Sidebar>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <Sidebar>
        <PageShell>
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900">Usuarios</h1>
            <p className="mt-2 text-slate-600">Administra usuarios y permisos del sistema</p>
          </div>

          {/* Illustration Header */}
          <div className="mb-8 rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h2 className="mb-2 text-xl font-semibold text-slate-900">Control de Acceso</h2>
                <p className="text-slate-600">Gestiona roles y permisos de usuarios</p>
              </div>
              <svg className="h-32 w-32 opacity-80" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="35" cy="30" r="10" fill="#8b5cf6" opacity="0.2" stroke="#8b5cf6" strokeWidth="2" />
                <path d="M25 45 L45 45 Q50 40 50 45 L50 60" fill="none" stroke="#8b5cf6" strokeWidth="2" />
                <circle cx="65" cy="30" r="10" fill="#8b5cf6" opacity="0.2" stroke="#8b5cf6" strokeWidth="2" />
                <path d="M55 45 L75 45 Q80 40 80 45 L80 60" fill="none" stroke="#8b5cf6" strokeWidth="2" />
              </svg>
            </div>
          </div>

          <div className="mb-8 flex items-center justify-between">
            <button
              onClick={() => {
                if (showForm) {
                  resetForm();
                }
                setShowForm(!showForm);
              }}
              className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-700"
            >
              {showForm ? "Cancelar" : "Nuevo Usuario"}
            </button>
          </div>

          {showForm && (
            <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-5 text-xl font-semibold text-slate-900">
                {editingUserId ? "Editar Usuario" : "Crear Usuario"}
              </h2>
              <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-900">Usuario *</label>
                  <input
                    required
                    type="text"
                    value={formData.username}
                    className="w-full rounded border px-3 py-2 text-slate-900"
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-900">Correo</label>
                  <input
                    type="email"
                    value={formData.email}
                    className="w-full rounded border px-3 py-2 text-slate-900"
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-900">Nombre</label>
                  <input
                    type="text"
                    value={formData.first_name}
                    className="w-full rounded border px-3 py-2 text-slate-900"
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-900">Apellido</label>
                  <input
                    type="text"
                    value={formData.last_name}
                    className="w-full rounded border px-3 py-2 text-slate-900"
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-900">
                    Contraseña {editingUserId ? "(opcional)" : "*"}
                  </label>
                  <input
                    type="password"
                    minLength={8}
                    value={formData.password}
                    className="w-full rounded border px-3 py-2 text-slate-900"
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                  <p className="mt-1 text-xs text-slate-500">Si la ingresas, debe tener al menos 8 caracteres.</p>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-900">Rol *</label>
                  <select
                    value={formData.role}
                    className="w-full rounded border px-3 py-2 text-slate-900"
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  >
                    <option value="Usuario">Usuario</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="flex items-center gap-2 text-sm text-slate-800">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    />
                    Usuario activo
                  </label>
                </div>
                <button
                  type="submit"
                  className="rounded-lg bg-green-600 px-4 py-2 font-medium text-white transition hover:bg-green-700 md:col-span-2"
                >
                  Guardar Usuario
                </button>
              </form>
            </div>
          )}

          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full">
              <thead className="bg-slate-100">
                <tr>
                  <th className="px-4 py-3 text-left text-slate-900">Usuario</th>
                  <th className="px-4 py-3 text-left text-slate-900">Nombre</th>
                  <th className="px-4 py-3 text-left text-slate-900">Rol</th>
                  <th className="px-4 py-3 text-left text-slate-900">Estado</th>
                  <th className="px-4 py-3 text-left text-slate-900">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-900">{user.username}</td>
                    <td className="px-4 py-3 text-slate-900">{`${user.first_name || ""} ${user.last_name || ""}`.trim() || "-"}</td>
                    <td className="px-4 py-3 text-slate-900">{user.roles.includes("Admin") ? "Admin" : "Usuario"}</td>
                    <td className="px-4 py-3 text-slate-900">{user.is_active ? "Activo" : "Inactivo"}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(user)}
                          className="rounded bg-slate-600 px-3 py-1.5 text-sm text-white hover:bg-slate-700"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="rounded bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && <p className="p-4 text-center text-slate-700">No hay usuarios registrados</p>}
          </div>
        </PageShell>
      </Sidebar>
    </ProtectedRoute>
  );
}
