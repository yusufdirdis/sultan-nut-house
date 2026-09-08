import type { ComponentPropsWithoutRef } from "react";
import { clsx } from "clsx";

type TextFieldProps = ComponentPropsWithoutRef<"input"> & {
  label: string;
  error?: string;
};

export function TextField({ label, error, id, className, ...props }: TextFieldProps) {
  const fieldId = id ?? props.name;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={fieldId} className="text-sm font-medium text-espresso">
        {label}
      </label>
      <input
        id={fieldId}
        className={clsx(
          "h-12 rounded-xl border border-espresso/20 bg-white px-4 text-base text-espresso outline-none transition-colors placeholder:text-espresso-soft/50 focus:border-brass",
          error && "border-red-400",
          className,
        )}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${fieldId}-error` : undefined}
        {...props}
      />
      {error && (
        <p id={`${fieldId}-error`} className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
