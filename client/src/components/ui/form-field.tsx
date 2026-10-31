import type { ReactNode } from "react";

type FormFieldProps = {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
};

export function FormField({ label, htmlFor, hint, error, required = false, children }: FormFieldProps) {
  const hintId = hint ? `${htmlFor}-hint` : undefined;
  const errorId = error ? `${htmlFor}-error` : undefined;

  return (
    <div className="space-y-2">
      <label htmlFor={htmlFor} className="inline-flex items-center gap-1 text-sm font-semibold text-ink">
        {label}
        {required ? <span className="text-brand-strong" aria-hidden="true">*</span> : null}
      </label>
      {children}
      {hint ? <p id={hintId} className="text-xs leading-5 text-muted">{hint}</p> : null}
      {error ? <p id={errorId} className="text-xs font-medium text-red-700" role="alert">{error}</p> : null}
    </div>
  );
}
