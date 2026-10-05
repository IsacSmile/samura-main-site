"use client";

import React, { useEffect } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export interface ToastProps {
  id?: string;
  type?: "success" | "error" | "info";
  title?: string;
  message: string;
  durationMs?: number;
  onClose: () => void;
}

export function Toast({
  type = "success",
  title,
  message,
  durationMs = 4000,
  onClose,
}: ToastProps) {
  useEffect(() => {
    if (durationMs > 0) {
      const timer = setTimeout(onClose, durationMs);
      return () => clearTimeout(timer);
    }
  }, [durationMs, onClose]);

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-success shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-brand shrink-0" />,
    info: <Info className="w-5 h-5 text-blue-500 shrink-0" />,
  };

  const borders = {
    success: "border-emerald-200 bg-white",
    error: "border-red-200 bg-white",
    info: "border-blue-200 bg-white",
  };

  return (
    <div
      className={`fixed bottom-6 left-6 z-50 flex items-start gap-3 p-4 rounded-2xl shadow-xl border ${borders[type]} max-w-sm animate-in slide-in-from-bottom-5 duration-300`}
      role="alert"
    >
      {icons[type]}
      <div className="flex-1 space-y-0.5">
        {title && (
          <h4 className="font-heading font-semibold text-xs text-ink">
            {title}
          </h4>
        )}
        <p className="text-xs text-muted leading-relaxed">{message}</p>
      </div>
      <button
        onClick={onClose}
        className="text-muted hover:text-brand p-1 -mr-1 transition-colors"
        aria-label="Dismiss toast"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
