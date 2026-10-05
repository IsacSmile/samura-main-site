import React from "react";
import { ChevronDown } from "lucide-react";

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options?: Array<{ label: string; value: string | number }>;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      options,
      children,
      className = "",
      id,
      ...props
    },
    ref
  ) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-xs font-semibold text-ink uppercase tracking-wider"
          >
            {label}
          </label>
        )}

        <div className="relative">
          <select
            id={selectId}
            ref={ref}
            className={`w-full appearance-none bg-blush/40 hover:bg-blush/70 focus:bg-white border rounded-2xl py-2.5 pl-4 pr-10 text-sm text-ink transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand disabled:opacity-50 cursor-pointer ${
              error
                ? "border-red-400 bg-red-50/30"
                : "border-pink-light"
            } ${className}`}
            {...props}
          >
            {options
              ? options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))
              : children}
          </select>

          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-muted">
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>

        {error && (
          <p className="text-xs text-red-500 font-medium pl-1">{error}</p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";
