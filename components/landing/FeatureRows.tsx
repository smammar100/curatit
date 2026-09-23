import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import type { LandingLibrary } from "@/lib/services/creatives";
import Backdrop from "./Backdrop";
import BoardDemo from "./demos/BoardDemo";
import DetailDemo from "./demos/DetailDemo";
import SearchDemo from "./demos/SearchDemo";

/** Two-tone statement: the claim in the serif, the explanation receding at the same size. */
function Statement({ title, body, href, cta }: { title: string; body: string; href: string; cta: string }) {
  return (
    <div className="max-w-md">
      <h3 className="font-serif text-[24px] font-normal leading-[30px] tracking-[-0.01em] text-foreground md:text-[28px] md:leading-[34px]">
        {title} <span className="text-muted-foreground">{body}</span>
      </h3>
      <Link
        href={href}
        className="group mt-4 inline-flex items-center gap-1 rounded-[2px] text-[13px] text-foreground underline decoration-border underline-offset-[3px] transition-colors duration-80 hover:decoration-foreground"
      >
        {cta}
        <ArrowRight aria-hidden="true" className="size-3.5" strokeWidth={1.5} />
      </Link>
    </div>
  );
}

/** Product window on the library-painted backdrop. */
function Stage({ covers, offset, children, label }: { covers: LandingLibrary["mosaic"]; offset: number; children: ReactNode; label: string }) {
  return (
    <div role="group" aria-label={label} className="relative overflow-hidden rounded-xl p-5 sm:p-10 lg:p-14">
      <Backdrop covers={covers} offset={offset} />
      <div className="relative">{children}</div>
    </div>
  );
}

export default function FeatureRows({ library, signedIn }: { library: LandingLibrary; signedIn: boolean }) {
  const libraryHref = signedIn ? "/library" : "/signup?next=/library";
  const boardsHref = signedIn ? "/boards" : "/signup?next=/boards";

  return (
    // Top padding lets the pinned cascade from Section 2 scroll clear before this content.
    <section className="px-6 pb-24 pt-40 md:px-16 lg:pt-64">
      <div className="mx-auto flex max-w-6xl flex-col gap-24 lg:gap-32">
        {/* 1. Search: the core action, given the full width. */}
        <div className="flex flex-col gap-10">
          <Statement
            title="Search by brief."
            body="Write it the way you'd say it. Curatit reads it into objectives, formats and styles, and shows why each post matched."
            href={libraryHref}
            cta="Open the library"
          />
          <Stage covers={library.mosaic} offset={0} label="Interactive preview of library search">
            <div className="mx-auto max-w-3xl">
              <SearchDemo briefs={library.briefs} />
            </div>
          </Stage>
        </div>

        {/* 2. Understand: window left, statement right. */}
        {library.sample && (
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,4fr)] lg:gap-16">
            <Stage covers={library.mosaic} offset={7} label="Interactive preview of a post breakdown">
              <DetailDemo sample={library.sample} />
            </Stage>
            <Statement
              title="See why it works."
              body="An editor reviews every post: the hook, the structure across slides, the visual approach, and why it earned a place."
              href={libraryHref}
              cta="Read a breakdown"
            />
          </div>
        )}

        {/* 3. Share: statement left, window right. */}
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[minmax(0,4fr)_minmax(0,7fr)] lg:gap-16">
          <Statement
            title="Hand over a board, not a folder of screenshots."
            body="Save references with notes on what to adapt, then share a read-only link that expires. Revoke it whenever you like."
            href={boardsHref}
            cta="Start a board"
          />
          <Stage covers={library.mosaic} offset={14} label="Interactive preview of sharing a board">
            <BoardDemo items={library.board} />
          </Stage>
        </div>
      </div>
    </section>
  );
}
