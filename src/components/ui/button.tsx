"use client";

import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

import { track } from "@/lib/analytics";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";
type Tone = "light" | "dark";

// No `whitespace-nowrap` here on purpose. A CTA label that cannot wrap sets a
// min-content floor on every flex and grid track it sits in, so on a narrow
// phone the button does not shrink — the page grows a horizontal scrollbar
// instead. Wrapping to a second line is the correct failure mode, and
// `text-center` already makes two lines look deliberate.
const base =
  "group inline-flex items-center justify-center gap-2 rounded-md font-medium " +
  "transition-[background-color,border-color,color,transform] duration-200 ease-out " +
  "active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60 " +
  "text-center";

const sizes: Record<Size, string> = {
  sm: "px-4 py-2 text-[0.875rem]",
  md: "px-5 py-3 text-[0.9375rem]",
  lg: "px-6 py-3.5 text-[1rem]",
};

const variants: Record<Tone, Record<Variant, string>> = {
  light: {
    primary: "bg-navy-700 text-white hover:bg-navy-800 shadow-sm",
    secondary:
      "border border-line-2 bg-surface text-navy-800 hover:border-navy-600 hover:bg-navy-50",
    ghost: "text-navy-700 hover:text-navy-800 hover:bg-navy-50",
  },
  dark: {
    primary: "bg-white text-navy-800 hover:bg-navy-50 shadow-sm",
    secondary: "border border-white/25 text-white hover:border-white/60 hover:bg-white/10",
    ghost: "text-navy-100 hover:text-white hover:bg-white/10",
  },
};

function Arrow() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className="h-3.5 w-3.5 shrink-0 transition-transform duration-200 ease-out group-hover:translate-x-0.5"
    >
      <path
        d="M3 8h9m0 0L8.5 4.5M12 8l-3.5 3.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type CtaProps = {
  href: string;
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  tone?: Tone;
  arrow?: boolean;
  className?: string;
  /** Where this click happened, e.g. "hero" or "pricing". */
  location: string;
} & Omit<ComponentProps<typeof Link>, "href" | "children" | "className" | "onClick">;

/**
 * Every call to action on the site. Fires a `cta_clicked` analytics event with
 * enough context to tell which placement is actually producing conversations.
 */
export function Cta({
  href,
  children,
  variant = "primary",
  size = "md",
  tone = "light",
  arrow = true,
  className = "",
  location,
  ...rest
}: CtaProps) {
  const label = typeof children === "string" ? children : location;

  return (
    <Link
      href={href}
      className={`${base} ${sizes[size]} ${variants[tone][variant]} ${className}`}
      onClick={() => track("cta_clicked", { cta: label, location, destination: href })}
      {...rest}
    >
      {children}
      {arrow ? <Arrow /> : null}
    </Link>
  );
}

export function SubmitButton({
  children,
  pending,
  tone = "light",
  className = "",
}: {
  children: ReactNode;
  pending?: boolean;
  tone?: Tone;
  className?: string;
}) {
  return (
    <button
      type="submit"
      disabled={pending}
      className={`${base} ${sizes.lg} ${variants[tone].primary} ${className}`}
    >
      {pending ? "Sending…" : children}
      {pending ? null : <Arrow />}
    </button>
  );
}
