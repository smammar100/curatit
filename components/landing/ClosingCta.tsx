import Link from "next/link";
import SlideArt from "@/components/product/SlideArt";
import { Button } from "@/components/ui/button";
import type { LandingLibrary } from "@/lib/services/creatives";
import AppWindow from "./AppWindow";
import Backdrop from "./Backdrop";

/** Closing panel: the claim and one primary action beside the real library. */
export default function ClosingCta({ library, signedIn }: { library: LandingLibrary; signedIn: boolean }) {
  const covers = library.mosaic.slice(0, 6);

  return (
    <section className="px-6 pb-24 md:px-16">
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 overflow-hidden rounded-xl bg-muted p-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:p-12">
        <div>
          <h2 className="heading-display text-foreground">Start with your next brief.</h2>
          <p className="mt-3 max-w-sm text-[14px] leading-6 text-muted-foreground">
            Every post credits its brand and links to the original. Use the patterns to make work that&rsquo;s yours.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button asChild>
              <Link href={signedIn ? "/library" : "/signup"}>{signedIn ? "Open the library" : "Get access"}</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/pricing">See pricing</Link>
            </Button>
          </div>
        </div>

        <div
          role="img"
          aria-label="The Curatit library: a grid of brand posts"
          className="pointer-events-none relative select-none overflow-hidden rounded-xl p-6 sm:p-10"
        >
          <Backdrop covers={library.mosaic} offset={3} />
          <AppWindow title="Library" className="relative">
            <div className="grid grid-cols-3 gap-3 p-4">
              {covers.map((cover, index) => (
                <div key={index} className="overflow-hidden rounded-[2px] shadow-surface-1">
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
