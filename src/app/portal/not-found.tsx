import Link from "next/link";

import { Empty, PageHeading } from "@/components/portal/ui";

export const metadata = { title: "Not found", robots: { index: false, follow: false } };

/**
 * 404 inside the portal.
 *
 * Reached whenever `notFound()` fires — most often because someone changed an
 * id in the URL and RLS returned no row. The copy is deliberately identical
 * for "does not exist" and "not yours": confirming that a record exists but is
 * forbidden is itself a disclosure.
 */
export default function PortalNotFound() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeading eyebrow="404" title="That page isn't here." />
      <Empty
        title="We could not find that"
        body="It may have moved, or it may belong to a different project. Either way, everything you have access to is one click away."
        action={
          <Link
            href="/portal"
            className="inline-flex items-center rounded-md bg-navy-700 px-5 py-3 text-[0.9375rem] font-medium text-white transition-colors hover:bg-navy-800"
          >
            Back to your overview
          </Link>
        }
      />
    </div>
  );
}
