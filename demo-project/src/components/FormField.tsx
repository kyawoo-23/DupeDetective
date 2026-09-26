// FormField.tsx
// Sprint 6 — another dev needed an input for the settings page.
// Passes the raw onChange event instead of the value string,
// adds a `hint` prop, drops the `type` prop (always text).
// Functionally near-identical to TextInput.tsx.

import React from "react";

interface FormFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
  placeholder?: string;
  /** Helper text shown below the input */
  hint?: string;
  /** Error message replaces hint when set */
  errorMessage?: string;
  required?: boolean;
}

/** Labelled input field — near-duplicate of TextInput. */
export function FormField({
  id,
  label,
  value,
  onChange,
  placeholder,
  hint,
  errorMessage,
  required,
}: FormFieldProps) {
  const hasError = Boolean(errorMessage);
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">
        {label}{required && " *"}
      </label>
      <input
        id={id}
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        aria-describedby={hint || errorMessage ? `${id}-desc` : undefined}
        aria-invalid={hasError}
        className={`block w-full rounded-md border bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm outline-none focus:ring-2 focus:ring-indigo-500 ${
          hasError ? "border-red-400" : "border-slate-300"
        }`}
      />
      {(hint || errorMessage) && (
        <p
          id={`${id}-desc`}
          className={`text-xs ${hasError ? "text-red-600" : "text-slate-400"}`}
        >
          {errorMessage || hint}
        </p>
      )}
    </div>
  );
}
