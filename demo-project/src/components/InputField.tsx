// InputField.tsx
// Sprint 8 — yet another input component, this time with an icon slot
// and a `size` prop. Still does the same job as TextInput and FormField.
// Three devs, three sessions, three inputs.

import React from "react";

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  errorMsg?: string;
  icon?: React.ReactNode;
  inputSize?: "sm" | "md";
}

/** Input with optional leading icon — third near-duplicate of TextInput. */
export function InputField({
  label,
  id,
  errorMsg,
  icon,
  inputSize = "md",
  className = "",
  ...rest
}: InputFieldProps) {
  const pad = inputSize === "sm" ? "px-2.5 py-1.5 text-xs" : "px-3 py-2 text-sm";
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            {icon}
          </span>
        )}
        <input
          id={id}
          {...rest}
          className={`w-full rounded-lg border ${icon ? "pl-8" : ""} ${pad} outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
            errorMsg ? "border-red-400 bg-red-50" : "border-slate-300"
          } ${className}`}
        />
      </div>
      {errorMsg && (
        <p className="text-xs text-red-500">{errorMsg}</p>
      )}
    </div>
  );
}
