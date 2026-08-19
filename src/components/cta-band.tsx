import { Cta } from "@/components/ui/button";
import { site } from "@/lib/site";

/**
 * The closing ask. Appears once per page, always pointed at a conversation.
 */
export function CtaBand({
  title = "Tell us what your team still does manually.",
  lead = "One workflow is enough to start: the handoff that gets missed, the spreadsheet holding a process together, the information somebody retypes every week. That is the conversation — not a software project you have to commit to today.",
  location,
}: {
  title?: string;
  lead?: string;
  location: string;
}) {
  return (
    <section className="on-dark relative overflow-hidden bg-navy-950 text-white">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.16]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,.5) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
          maskImage: "radial-gradient(ellipse 70% 80% at 50% 0%, #000 20%, transparent 75%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 70% 80% at 50% 0%, #000 20%, transparent 75%)",
        }}
      />
      <div className="container-x section-y relative">
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <h2 className="t-h2 text-white">{title}</h2>
          <p className="t-lead mt-5 max-w-2xl text-navy-100">{lead}</p>

          <div className="mt-9 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:justify-center">
            <Cta href="/book" size="lg" tone="dark" location={location}>
              Walk us through a workflow
            </Cta>
            <Cta
              href="/request-software"
              variant="secondary"
              size="lg"
              tone="dark"
              location={location}
            >
              Tell us what isn&rsquo;t working
            </Cta>
          </div>

          <p className="mt-7 t-mono-sm text-navy-200">
            Thirty minutes, no obligation. Custom builds start at {site.startingPrice}.
          </p>
        </div>
      </div>
    </section>
  );
}
