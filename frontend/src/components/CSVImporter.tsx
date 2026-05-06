"use client";

import { useState } from "react";
import apiClient from "@/lib/api";

interface ImporterProps {
  endpoint: string;
  entityName: string;
  onSuccess: () => void;
  columns: string[];
}

export default function CSVImporter({ endpoint, entityName, onSuccess, columns }: ImporterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    created?: number;
    skipped?: number;
    errors?: string[];
  } | null>(null);
  const [error, setError] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith(".csv")) {
        setError("Por favor selecciona un archivo CSV válido.");
        setFile(null);
        return;
      }
      setFile(selectedFile);
      setError("");
    }
  };

  const downloadTemplate = () => {
    const header = columns.join(",");
    const csv = header + "\nEjemplo Nombre,ejemplo@correo.com,300123456,Calle 123,123456789";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `plantilla_${entityName.toLowerCase()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Por favor selecciona un archivo.");
      return;
    }

    setIsLoading(true);
    setError("");
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await apiClient.post(`${endpoint}import_csv/`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setResult(response.data);
      if (response.data.created > 0 || response.data.skipped > 0) {
        await onSuccess();
        // Small delay to ensure async operations complete before closing
        setTimeout(() => {
          setIsOpen(false);
        }, 800);
      }
    } catch (err) {
      const apiErr = err as { response?: { data?: { detail?: string } } };
      setError(apiErr.response?.data?.detail || "Error al importar archivo.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => {
          setIsOpen(true);
          setFile(null);
          setError("");
          setResult(null);
        }}
        className="rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-700 transition hover:bg-slate-50"
      >
        Importar CSV
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Importar {entityName}</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1 transition hover:bg-slate-100"
              >
                <svg className="h-5 w-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className="mt-2 text-sm text-slate-600">
              Carga un archivo CSV con columnas: {columns.join(", ")}
            </p>

            <div className="mt-4 space-y-4">
              <div className="rounded-lg border-2 border-dashed border-slate-300 p-4">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="w-full cursor-pointer"
                />
                {file && <p className="mt-2 text-sm text-emerald-600">✓ {file.name}</p>}
              </div>

              <button
                onClick={downloadTemplate}
                className="w-full rounded-lg border border-blue-600 px-4 py-2 text-sm font-medium text-blue-600 transition hover:bg-blue-50"
              >
                Descargar plantilla
              </button>

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {result && (
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                  <p className="text-sm font-medium text-blue-900">
                    Importación completada ✓
                  </p>
                  {result.created && (
                    <p className="text-sm text-blue-800">
                      {result.created} {entityName.toLowerCase()} creado{result.created > 1 ? "s" : ""}
                    </p>
                  )}
                  {result.skipped && result.skipped > 0 && (
                    <p className="text-sm text-blue-800">
                      {result.skipped} fila{result.skipped > 1 ? "s" : ""} omitida{result.skipped > 1 ? "s" : ""}
                    </p>
                  )}
                  {result.errors && result.errors.length > 0 && (
                    <div className="mt-2 max-h-32 overflow-y-auto rounded bg-white p-2">
                      {result.errors.map((err, i) => (
                        <p key={i} className="text-xs text-red-600">
                          {err}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => setIsOpen(false)}
                  className="flex-1 rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Cerrar
                </button>
                <button
                  onClick={handleUpload}
                  disabled={!file || isLoading}
                  className="flex-1 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isLoading ? "Importando..." : "Importar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
