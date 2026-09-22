import Button from "@/components/fundations/elements/Button";
import SlideArt from "@/components/product/SlideArt";
import type { LandingLibrary } from "@/lib/services/creatives";
import AppWindow from "./AppWindow";
import Backdrop from "./Backdrop";

/** Closing card: the claim and one primary action beside the real library. */
export default function ClosingCta({ library, signedIn }: { library: LandingLibrary; signedIn: boolean }) {
  const covers = library.mosaic.slice(0, 6);

  return (
    <section className="px-8 pb-24 md:px-16">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 overflow-hidden rounded-2xl bg-surface-sunken p-8 ring-1 ring-line lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:p-12">
        <div>
          <h2 className="font-display text-4xl font-light leading-tight text-ink md:text-5xl">
            Start with your next brief.
          </h2>
          <p className="mt-4 max-w-sm text-sm text-ink-muted">
            Every post credits its brand and links to the original. Use the patterns to make work that&rsquo;s yours.
          </p>
          <div className="mt-8 flex flex-wrap gap-2">
            <Button isLink href={signedIn ? "/library" : "/signup"} size="base" variant="default">
              {signedIn ? "Open the library" : "Get access"}
            </Button>
            {/* The panel is already sunken, so the secondary button sits on the page surface. */}
            <Button
              isLink
              href="/pricing"
              size="base"
              variant="none"
              className="bg-surface text-ink ring-1 ring-line hover:bg-surface-inset focus-visible:outline-base-300"
            >
              See pricing
            </Button>
          </div>
        </div>

        <div
          role="img"
          aria-label="The Curatit library: a grid of brand posts"
          className="pointer-events-none relative select-none overflow-hidden rounded-xl p-6 sm:p-10"
        >
          <Backdrop covers={library.mosaic} offset={3} />
          <AppWindow title="Curatit — Library" className="relative">
            <div className="grid grid-cols-3 gap-3 p-4">
              {covers.map((cover, index) => (
                <div key={index} className="overflow-hidden rounded-md shadow-card ring-1 ring-line">
                  <SlideArt art={cover.art} alt="" />
                </div>
              ))}
            </div>
          </AppWindow>
        </div>
      </div>
    </section>
  );
}
