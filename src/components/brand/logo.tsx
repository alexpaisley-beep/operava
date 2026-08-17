import type { SVGProps } from "react";

/**
 * Operava mark — a segmented navy ring (the operating loop) with a leaf
 * breaking out of the upper right and a ribbon rising through the counter.
 *
 * Weights are tuned so the counter of the "O" stays open down to 16px, which
 * is where a heavier ribbon turns the whole mark into a blob.
 *
 * Colours come from CSS variables so one file serves both backgrounds:
 * `.on-dark` flips the ring to white and the halo to deep navy.
 */
export function Mark({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
      className={className}
      {...props}
    >
      <defs>
        <linearGradient
          id="operava-leaf"
          x1="40"
          y1="23"
          x2="56"
          y2="6"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="var(--color-leaf-500, #4ea33f)" />
          <stop offset="1" stopColor="var(--color-leaf-400, #8dc63f)" />
        </linearGradient>
      </defs>

      {/* Segmented ring: four quadrant arcs with hairline breaks at 12/3/6/9. */}
      <circle
        cx="32"
        cy="32"
        r="22"
        stroke="var(--logo-ring, #1e3a66)"
        strokeWidth="7.5"
        pathLength="100"
        strokeDasharray="21 4"
        strokeDashoffset="23"
      />

      {/* Stem, curving down into the counter. Kept short: a full ribbon across
          the middle closes the "O" and turns the mark to mush under 32px. */}
      <path
        d="M40 23.5c-3.2 3.1-5.4 6-6.4 9.4"
        stroke="var(--logo-halo, #fbfcfd)"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path
        d="M40 23.5c-3.2 3.1-5.4 6-6.4 9.4"
        stroke="var(--logo-ring, #1e3a66)"
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* Leaf, haloed so it reads cleanly where it crosses the ring. */}
      <path
        d="M39.5 24C39.5 14 45.5 6.5 55.5 5c1 9.5-5 17.5-16 19Z"
        stroke="var(--logo-halo, #fbfcfd)"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M39.5 24C39.5 14 45.5 6.5 55.5 5c1 9.5-5 17.5-16 19Z"
        fill="url(#operava-leaf)"
      />
      <path
        d="M40.2 23.3C44.5 18 49.8 11.5 54.8 6"
        stroke="var(--logo-halo, #fbfcfd)"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.8"
      />
    </svg>
  );
}

/**
 * Full lockup. Rendered as mark + live text so the wordmark stays crisp,
 * selectable and searchable at every size.
 */
export function Logo({
  className = "",
  markClassName = "h-8 w-8",
  wordClassName = "text-[1.32rem]",
}: {
  className?: string;
  markClassName?: string;
  wordClassName?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <Mark className={markClassName} />
      <span className={`font-semibold leading-none tracking-[-0.03em] ${wordClassName}`}>
        Operava
      </span>
    </span>
  );
}
