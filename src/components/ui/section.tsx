import type { ReactNode } from "react";

export function Eyebrow({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p className={`t-eyebrow flex items-center gap-2.5 text-ink-3 ${className}`}>
      <span aria-hidden="true" className="inline-block h-1.5 w-1.5 rounded-full bg-leaf-500" />
      {children}
    </p>
  );
}

/**
 * Section heading block. `number` prints a monospaced index — the spec-sheet
 * cue that keeps long pages legible without decorative dividers.
 */
export function SectionHeading({
  eyebrow,
  title,
  lead,
  align = "left",
  tone = "light",
  className = "",
}: {
  eyebrow?: string;
  title: ReactNode;
  lead?: ReactNode;
  align?: "left" | "center";
  tone?: "light" | "dark";
  className?: string;
}) {
  const alignment = align === "center" ? "text-center mx-auto items-center" : "";
  return (
    <div
      className={`flex flex-col gap-4 ${alignment} ${align === "center" ? "max-w-3xl" : "max-w-4xl"} ${className}`}
    >
      {eyebrow ? (
        <Eyebrow className={tone === "dark" ? "text-navy-200" : ""}>{eyebrow}</Eyebrow>
      ) : null}
      <h2 className={`t-h2 ${tone === "dark" ? "text-white" : "text-ink"}`}>{title}</h2>
      {lead ? (
        <p className={`t-lead ${tone === "dark" ? "text-navy-100" : "text-ink-2"} max-w-2xl`}>
          {lead}
        </p>
      ) : null}
    </div>
  );
}

export function Section({
  children,
  className = "",
  id,
  tone = "paper",
}: {
  children: ReactNode;
  className?: string;
  id?: string;
  tone?: "paper" | "surface" | "muted" | "dark";
}) {
  const tones = {
    paper: "bg-paper text-ink",
    surface: "bg-surface text-ink",
    muted: "bg-muted text-ink",
    dark: "bg-navy-950 text-white on-dark",
  } as const;

  return (
    <section id={id} className={`section-y ${tones[tone]} ${className}`}>
      <div className="container-x">{children}</div>
    </section>
  );
}

/** Hairline rule with the brand's leaf tick — used to break long pages. */
export function Rule({ className = "" }: { className?: string }) {
  return <hr className={`border-0 border-t border-line ${className}`} />;
}
