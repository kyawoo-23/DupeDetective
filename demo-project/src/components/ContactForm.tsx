import { useState, useRef, type FormEvent } from "react";
import { SectionHeader } from "./ButtonGroup";

interface FormState {
  name: string;
  email: string;
  role: string;
  bio: string;
  terms: boolean;
}

interface FormErrors {
  name?: string;
  email?: string;
  terms?: string;
}

const INITIAL: FormState = { name: "", email: "", bio: "", role: "", terms: false };

function Field({
  id,
  label,
  required,
  error,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-slate-700">
        {label}
        {required && <span aria-hidden="true" className="ml-0.5 text-red-500">*</span>}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-xs text-red-600 flex items-center gap-1">
          <span aria-hidden="true">✕</span> {error}
        </p>
      )}
    </div>
  );
}

/** Section: contact form with native constraint validation + React state. */
export default function ContactForm() {
  const [values, setValues] = useState<FormState>(INITIAL);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const firstErrorRef = useRef<HTMLInputElement>(null);

  const bioMax = 300;

  const validate = (): FormErrors => {
    const e: FormErrors = {};
    if (!values.name.trim()) e.name = "Name is required.";
    if (!values.email.trim()) {
      e.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
      e.email = "Enter a valid email address.";
    }
    if (!values.terms) e.terms = "You must accept the terms.";
    return e;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = type === "checkbox" ? (e.target as HTMLInputElement).checked : undefined;
    setValues((v) => ({ ...v, [name]: type === "checkbox" ? checked : value }));
    // Clear the error for this field as the user corrects it
    setErrors((err) => ({ ...err, [name]: undefined }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      // Focus first error field
      firstErrorRef.current?.focus();
      return;
    }
    setLoading(true);
    // Simulate async submission
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      setValues(INITIAL);
      setErrors({});
    }, 800);
  };

  if (submitted) {
    return (
      <section id="section-form" aria-labelledby="form-heading" className="scroll-mt-20">
        <SectionHeader
          title="Form with validation"
          desc="Native constraint API, :user-invalid, aria-invalid sync, and accessible error messages."
        />
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-8 text-center">
          <p className="text-emerald-700 font-semibold text-lg">✓ Submission received — thank you!</p>
          <button
            type="button"
            onClick={() => setSubmitted(false)}
            className="mt-4 text-sm text-emerald-600 hover:text-emerald-800 underline underline-offset-2"
          >
            Submit another
          </button>
        </div>
      </section>
    );
  }

  return (
    <section id="section-form" aria-labelledby="form-heading" className="scroll-mt-20">
      <SectionHeader
        title="Form with validation"
        desc="Native constraint API, :user-invalid, aria-invalid sync, and accessible error messages."
      />

      <form
        onSubmit={handleSubmit}
        noValidate
        className="bg-white rounded-xl border border-slate-200 p-6 space-y-5"
      >
        {/* Name + Email row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field id="f-name" label="Full name" required error={errors.name}>
            <input
              ref={errors.name ? firstErrorRef : undefined}
              id="f-name"
              name="name"
              type="text"
              value={values.name}
              onChange={handleChange}
              autoComplete="name"
              placeholder="Jane Smith"
              aria-invalid={!!errors.name}
              aria-errormessage={errors.name ? "f-name-error" : undefined}
              className={`rounded-lg border px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                errors.name ? "border-red-400 bg-red-50" : "border-slate-300 bg-white"
              }`}
            />
          </Field>

          <Field id="f-email" label="Email" required error={errors.email}>
            <input
              ref={errors.email && !errors.name ? firstErrorRef : undefined}
              id="f-email"
              name="email"
              type="email"
              value={values.email}
              onChange={handleChange}
              autoComplete="email"
              placeholder="jane@example.com"
              aria-invalid={!!errors.email}
              aria-errormessage={errors.email ? "f-email-error" : undefined}
              className={`rounded-lg border px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                errors.email ? "border-red-400 bg-red-50" : "border-slate-300 bg-white"
              }`}
            />
          </Field>
        </div>

        {/* Role */}
        <Field id="f-role" label="Role">
          <select
            id="f-role"
            name="role"
            value={values.role}
            onChange={handleChange}
            autoComplete="organization-title"
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">Select a role…</option>
            <option>Frontend developer</option>
            <option>Backend developer</option>
            <option>Designer</option>
            <option>Product manager</option>
          </select>
        </Field>

        {/* Bio */}
        <Field id="f-bio" label="Short bio">
          <textarea
            id="f-bio"
            name="bio"
            value={values.bio}
            onChange={handleChange}
            rows={3}
            maxLength={bioMax}
            placeholder="Tell us a bit about yourself…"
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 resize-y outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          <span className="text-xs text-slate-400 text-right">{values.bio.length}/{bioMax}</span>
        </Field>

        {/* Terms checkbox */}
        <div className="flex items-start gap-3">
          <input
            id="f-terms"
            name="terms"
            type="checkbox"
            checked={values.terms}
            onChange={handleChange}
            aria-invalid={!!errors.terms}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 accent-indigo-600"
          />
          <div>
            <label htmlFor="f-terms" className="text-sm text-slate-700">
              I agree to the{" "}
              <a href="#" className="text-indigo-600 underline underline-offset-2 hover:text-indigo-800">
                terms of service
              </a>
              <span aria-hidden="true" className="ml-0.5 text-red-500">*</span>
            </label>
            {errors.terms && (
              <p role="alert" className="text-xs text-red-600 mt-0.5 flex items-center gap-1">
                <span aria-hidden="true">✕</span> {errors.terms}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() => { setValues(INITIAL); setErrors({}); }}
            className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Reset
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60 disabled:pointer-events-none transition-colors"
          >
            {loading ? "Submitting…" : "Submit"}
          </button>
        </div>
      </form>
    </section>
  );
}
