import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import PageHeader from "@/components/fundations/containers/PageHeader";
import Wrapper from "@/components/fundations/containers/Wrapper";

export const metadata: Metadata = {
  title: "Links",
  description: "Prose, quiet and external links.",
};

// Class names are written out in full so Tailwind's scanner generates them.
const proseLink = "text-foreground underline decoration-border underline-offset-[3px] hover:decoration-foreground";
const quietLink = "text-muted-foreground transition-colors duration-80 hover:text-foreground";
const externalLink =
  "inline-flex items-center gap-0.5 text-foreground underline decoration-border underline-offset-[3px] hover:decoration-foreground";

function Example({
  title,
  use,
  classes,
  children,
}: {
  title: string;
  use: string;
  classes: string;
  children: ReactNode;
}) {
  return (
    <section className="grid grid-cols-1 gap-4 border-t border-border py-8 md:grid-cols-[16rem_1fr] md:gap-8">
      <div>
        <h2 className="heading-section text-foreground">{title}</h2>
        <p className="mt-1 text-[13px] leading-5 text-muted-foreground">{use}</p>
      </div>
      <div className="min-w-0">
        <div className="text-[14px] leading-6 text-muted-foreground">{children}</div>
        <pre className="mt-4 whitespace-pre-wrap break-words rounded-lg bg-muted px-3 py-2.5 text-[12px] leading-4 text-foreground">
          <code>{classes}</code>
        </pre>
      </div>
    </section>
  );
}

export default function LinksPage() {
  return (
    <Wrapper variant="standard" className="pb-24">
      <PageHeader title="Links" description="3 link styles. Links never use the brand color." />

      <Example
        title="Prose link"
        use="Links inside sentences. A quiet underline that darkens on hover."
        classes={proseLink}
      >
        <p>
          Every post in the{" "}
          <Link href="/library" className={proseLink}>
            library
          </Link>{" "}
          links back to its source, and you can save it to any of your{" "}
          <Link href="/boards" className={proseLink}>
            boards
          </Link>
          .
        </p>
      </Example>

      <Example
        title="Quiet link"
        use="Link lists: footers, indexes, metadata rows. No underline, the text darkens on hover."
        classes={quietLink}
      >
        <ul className="flex flex-col gap-1.5 text-[13px] leading-5">
          <li>
            <Link href="/pricing" className={quietLink}>
              Pricing
            </Link>
          </li>
          <li>
            <Link href="/about" className={quietLink}>
              About
            </Link>
          </li>
          <li>
            <Link href="/legal/removal" className={quietLink}>
              Request content removal
            </Link>
          </li>
        </ul>
      </Example>

      <Example
        title="External link"
        use="Leaves Curatit. Opens in a new tab and carries an ArrowUpRight at 12px or 14px."
        classes={externalLink}
      >
        <p>
          Curatit is built on{" "}
          <a href="https://www.fluidfunctionalism.com" target="_blank" rel="noopener noreferrer" className={externalLink}>
            Fluid Functionalism
            <ArrowUpRight size={14} strokeWidth={1.5} aria-hidden="true" />
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
          , an open registry of components.
        </p>
      </Example>

      <section className="border-t border-border py-8">
        <p className="text-[13px] leading-5 text-muted-foreground">
          Need a link that looks like a button? Wrap it in Button with asChild. See{" "}
          <Link href="/system/buttons" className={proseLink}>
            buttons
          </Link>
          .
        </p>
      </section>
    </Wrapper>
  );
}
