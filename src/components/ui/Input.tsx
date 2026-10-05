import React from "react";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      className = "",
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold text-ink uppercase tracking-wider"
          >
            {label}
          </label>
        )}

        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3.5 text-muted pointer-events-none flex items-center">
              {leftIcon}
            </div>
          )}

          <input
            id={inputId}
            ref={ref}
            className={`w-full bg-blush/40 hover:bg-blush/70 focus:bg-white border rounded-2xl py-2.5 px-4 text-sm text-ink placeholder:text-muted/60 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand disabled:opacity-50 disabled:bg-gray-100 ${
              leftIcon ? "pl-10" : ""
            } ${rightIcon ? "pr-10" : ""} ${
              error
                ? "border-red-400 bg-red-50/30 focus:border-red-500 focus:ring-red-200"
                : "border-pink-light"
            } ${className}`}
            {...props}
          />

          {rightIcon && (
            <div className="absolute right-3.5 text-muted flex items-center">
              {rightIcon}
            </div>
          )}
        </div>

        {error && (
          <p className="text-xs text-red-500 font-medium pl-1">{error}</p>
        )}
        {!error && helperText && (
          <p className="text-xs text-muted pl-1">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
