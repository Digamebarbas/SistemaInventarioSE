"use client";
import { Html5Qrcode } from "html5-qrcode";
import { useEffect, useRef, useState } from "react";

interface QRBarcodeScannerProps {
  onScan: (result: string) => void;
  onClose: () => void;
}

export default function QRBarcodeScanner({ onScan, onClose }: QRBarcodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const hasStarted = useRef(false);

  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    const scanner = new Html5Qrcode("qr-reader");
    scannerRef.current = scanner;

    const startScanner = async () => {
      try {
        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText) => {
            onScan(decodedText);
            stopScanner();
          },
          () => {
            // Error callback - ignorar errores de escaneo continuo
          }
        );
        setIsScanning(true);
      } catch (err) {
        console.error("Error iniciando escáner:", err);
        alert("No se pudo acceder a la cámara. Verifica los permisos.");
        onClose();
      }
    };

    const stopScanner = async () => {
      try {
        if (scannerRef.current?.isScanning) {
          await scannerRef.current.stop();
          await scannerRef.current.clear();
        }
        setIsScanning(false);
        onClose();
      } catch (err) {
        console.error("Error deteniendo escáner:", err);
      }
    };

    startScanner();

    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, [onScan, onClose]);

  const handleClose = async () => {
    if (scannerRef.current?.isScanning) {
      await scannerRef.current.stop();
      await scannerRef.current.clear();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
      <div className="relative w-full max-w-md rounded-lg bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Escanear Código</h2>
          <button
            onClick={handleClose}
            className="rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600"
          >
            Cerrar
          </button>
        </div>
        
        <div className="mb-4 text-center text-sm text-gray-700">
          {isScanning
            ? "Apunta la cámara hacia el código QR o de barras"
            : "Iniciando cámara..."}
        </div>

        <div id="qr-reader" className="overflow-hidden rounded"></div>

        <div className="mt-4 space-y-2 text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4 text-green-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <p>Soporta códigos QR y de barras</p>
          </div>
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4 text-green-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <p>Formatos: CODE-128, CODE-39, EAN-13, EAN-8, UPC</p>
          </div>
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4 text-green-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <p>Asegúrate de tener buena iluminación</p>
          </div>
        </div>
      </div>
    </div>
  );
}
