import Link from "next/link";
import { Button } from "@/components/ui/button";
import Tag from "./Tag";
import { colors } from "./tokens";

/** Section 2: the claim beside the pinned cascade of cards (ScrollCards). */
export default function SectionTwo({ signedIn }: { signedIn: boolean }) {
  return (
    <section
      id="how-it-works"
      data-section="two"
      className="relative flex items-start overflow-hidden bg-background px-6 pt-20 md:px-16"
      style={{ minHeight: "calc(100vh - 30px)" }}
    >
      <div className="relative z-10 w-full max-w-[520px] pt-8">
        <p className="mb-4 text-[13px] text-muted-foreground">Research boards</p>

        <h2
          className="m-0 font-serif font-normal tracking-[-0.02em] text-foreground"
          style={{ fontSize: "clamp(40px, 5vw, 60px)", lineHeight: 1.05 }}
        >
          <span className="block">Search, save</span>
          <span className="block text-muted-foreground">and share references</span>
          <span className="block">for every brief.</span>
        </h2>

        <p className="mt-6 max-w-[340px] text-[14px] leading-6 text-muted-foreground">
          Collect posts for a campaign, note what to adapt, and send a read-only link your client can open without an
          account.
        </p>

        <div className="mt-10 flex flex-wrap gap-2">
          <Button asChild>
            <Link href={signedIn ? "/boards" : "/signup"}>{signedIn ? "Open your boards" : "Get access"}</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/pricing">See pricing</Link>
          </Button>
        </div>
      </div>

      <Tag
        color="var(--accent)"
        ink={colors.ink}
        className="hidden md:block"
        style={{ top: 260, left: "calc(40% + 340px)", zIndex: 20 }}
        padding="9px 20px"
        tail={{ side: "center", near: 8, far: 8 }}
      >
        #carousel
      </Tag>
      <Tag
        color={colors.ink}
        ink={colors.onInk}
        className="hidden md:block"
        style={{ top: 430, left: "min(calc(40% + 680px), calc(100% - 150px))", zIndex: 20 }}
        padding="9px 20px"
        tail={{ side: "left", offset: 20, near: 8, far: 8 }}
      >
        #bold-type
      </Tag>
    </section>
  );
}
