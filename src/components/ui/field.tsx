import type {
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
  InputHTMLAttributes,
} from "react";

/* -------------------------------------------------------------------------
   Shared field chrome
------------------------------------------------------------------------- */

const control =
  "w-full rounded-md border bg-surface px-3.5 py-3 text-[0.95rem] text-ink " +
  "placeholder:text-ink-3/70 transition-colors duration-150 " +
  "border-line-2 hover:border-navy-200 " +
  "focus:border-navy-600 focus:outline-none focus:ring-2 focus:ring-navy-600/20 " +
  "aria-[invalid=true]:border-danger aria-[invalid=true]:bg-danger-bg";

function describedBy(id: string, hint?: ReactNode, error?: string) {
  const ids = [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean);
  return ids.length > 0 ? ids.join(" ") : undefined;
}

export function Field({
  id,
  label,
  hint,
  error,
  optional,
  children,
  className = "",
}: {
  id: string;
  label: string;
  hint?: ReactNode;
  error?: string;
  optional?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={id} className="text-[0.875rem] font-medium text-ink">
        {label}
        {optional ? <span className="ml-1.5 font-normal text-ink-3">(optional)</span> : null}
      </label>
      {hint ? (
        <p id={`${id}-hint`} className="text-[0.8125rem] leading-snug text-ink-3">
          {hint}
        </p>
      ) : null}
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-[0.8125rem] font-medium text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------------------
   Controls
------------------------------------------------------------------------- */

type BaseProps = {
  id: string;
  name: string;
  label: string;
  hint?: ReactNode;
  error?: string;
  optional?: boolean;
  className?: string;
};

export function TextInput({
  id,
  name,
  label,
  hint,
  error,
  optional,
  className,
  ...rest
}: BaseProps & Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "name" | "className">) {
  return (
    <Field
      id={id}
      label={label}
      hint={hint}
      error={error}
      optional={optional}
      className={className}
    >
      <input
        id={id}
        name={name}
        className={control}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        {...rest}
      />
    </Field>
  );
}

export function TextArea({
  id,
  name,
  label,
  hint,
  error,
  optional,
  className,
  rows = 4,
  ...rest
}: BaseProps & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "id" | "name" | "className">) {
  return (
    <Field
      id={id}
      label={label}
      hint={hint}
      error={error}
      optional={optional}
      className={className}
    >
      <textarea
        id={id}
        name={name}
        rows={rows}
        className={`${control} resize-y min-h-[7rem]`}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        {...rest}
      />
    </Field>
  );
}

export function Select({
  id,
  name,
  label,
  hint,
  error,
  optional,
  className,
  options,
  placeholder = "Select one",
  ...rest
}: BaseProps & { options: readonly string[]; placeholder?: string } & Omit<
    SelectHTMLAttributes<HTMLSelectElement>,
    "id" | "name" | "className"
  >) {
  return (
    <Field
      id={id}
      label={label}
      hint={hint}
      error={error}
      optional={optional}
      className={className}
    >
      <div className="relative">
        <select
          id={id}
          name={name}
          className={`${control} appearance-none pr-10`}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, hint, error)}
          {...rest}
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <svg
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
          className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3"
        >
          <path
            d="M4 6.5 8 10.5l4-4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </Field>
  );
}

/** Segmented choice, rendered as real radios so keyboard and SR behaviour is native. */
export function RadioCards({
  name,
  legend,
  hint,
  error,
  options,
  defaultValue,
  className = "",
}: {
  name: string;
  legend: string;
  hint?: ReactNode;
  error?: string;
  options: readonly string[];
  defaultValue?: string;
  className?: string;
}) {
  return (
    <fieldset
      className={`flex flex-col gap-1.5 ${className}`}
      aria-describedby={describedBy(name, hint, error)}
    >
      <legend className="text-[0.875rem] font-medium text-ink">{legend}</legend>
      {hint ? (
        <p id={`${name}-hint`} className="text-[0.8125rem] leading-snug text-ink-3">
          {hint}
        </p>
      ) : null}
      <div className="mt-0.5 flex flex-wrap gap-2">
        {options.map((option) => (
          <label
            key={option}
            className="relative inline-flex cursor-pointer items-center rounded-md border border-line-2 bg-surface px-4 py-2.5 text-[0.9rem] text-ink-2 transition-colors duration-150 hover:border-navy-200 has-[:checked]:border-navy-700 has-[:checked]:bg-navy-700 has-[:checked]:text-white has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-navy-600/30"
          >
            <input
              type="radio"
              name={name}
              value={option}
              defaultChecked={defaultValue === option}
              className="absolute h-px w-px opacity-0"
            />
            {option}
          </label>
        ))}
      </div>
      {error ? (
        <p id={`${name}-error`} className="text-[0.8125rem] font-medium text-danger">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}

/** Bot bait. Visually gone, off the tab order, ignored by screen readers. */
export function Honeypot({ name }: { name: string }) {
  return (
    <div aria-hidden="true" className="absolute left-[-9999px] top-0 h-px w-px overflow-hidden">
      <label htmlFor={name}>Do not fill this in</label>
      <input
        id={name}
        name={name}
        type="text"
        tabIndex={-1}
        autoComplete="off"
        defaultValue=""
      />
    </div>
  );
}
