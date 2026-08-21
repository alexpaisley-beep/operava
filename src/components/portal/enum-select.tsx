import type { SelectHTMLAttributes } from "react";

import { Field } from "@/components/ui/field";

const control =
  "w-full appearance-none rounded-md border bg-surface px-3.5 py-2.5 pr-10 text-[0.9rem] text-ink " +
  "border-line-2 transition-colors duration-150 hover:border-navy-200 " +
  "focus:border-navy-600 focus:outline-none focus:ring-2 focus:ring-navy-600/20";

/** Select over value/label pairs — for enum-backed fields. */
export function EnumSelect({
  id,
  name,
  label,
  options,
  defaultValue,
  allowEmpty,
  className,
  ...rest
}: {
  id: string;
  name: string;
  label: string;
  options: readonly { value: string; label: string }[];
  defaultValue?: string;
  /** Adds a leading empty option with this placeholder text. */
  allowEmpty?: string;
  className?: string;
} & Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  "id" | "name" | "className" | "defaultValue"
>) {
  return (
    <Field id={id} label={label} className={className}>
      <div className="relative">
        <select id={id} name={name} defaultValue={defaultValue} className={control} {...rest}>
          {allowEmpty !== undefined ? <option value="">{allowEmpty}</option> : null}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
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

export function toOptions<T extends string>(
  values: readonly T[],
  labels: Record<T, string>,
): { value: string; label: string }[] {
  return values.map((value) => ({ value, label: labels[value] }));
}
