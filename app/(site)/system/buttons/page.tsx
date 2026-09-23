import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import PageHeader from "@/components/fundations/containers/PageHeader";
import Wrapper from "@/components/fundations/containers/Wrapper";
import { Button } from "@/components/ui/button";
import { fontWeights } from "@/lib/font-weight";
import IconButton from "./IconButton";

export const metadata: Metadata = {
  title: "Buttons",
  description: "Every button variant and size in the system.",
};

const variants = [
  { variant: "primary", label: "Primary", use: "The one main action in a view." },
  { variant: "secondary", label: "Secondary", use: "Supporting actions next to a primary." },
  { variant: "tertiary", label: "Tertiary", use: "Quieter actions, outlined with a hairline." },
  { variant: "ghost", label: "Ghost", use: "Toolbars, navigation and inline actions." },
] as const;

function Section({ id, title, intro, first, children }: { id: string; title: string; intro: string; first?: boolean; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className={first ? undefined : "mt-12"}>
      <h2 id={id} className="heading-section text-foreground">
        {title}
      </h2>
      <p className="mt-1 max-w-2xl text-[13px] leading-5 text-muted-foreground">{intro}</p>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function Row({ label, detail, children }: { label: string; detail?: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-3 border-t border-border py-5 md:grid-cols-[12rem_1fr] md:items-center md:gap-8">
      <div>
        <p className="text-[13px] leading-5 text-foreground" style={{ fontVariationSettings: fontWeights.medium }}>
          {label}
        </p>
        {detail && <p className="text-[12px] leading-4 text-muted-foreground">{detail}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}

export default function ButtonsPage() {
  return (
    <Wrapper variant="standard" className="pb-24">
      <PageHeader
        title="Buttons"
        description="4 variants at 2 sizes. Import Button from components/ui/button."
      />

      <Section
        first
        id="variants-heading"
        title="Variants and sizes"
        intro="Default is 36px with 13px text. Compact is 28px with 12px text, for toolbars, table rows and card buttons."
      >
        {variants.map(({ variant, label, use }) => (
          <Row key={variant} label={label} detail={use}>
            <Button variant={variant}>Save to board</Button>
            <Button variant={variant} size="compact">
              Save to board
            </Button>
          </Row>
        ))}
      </Section>

      <Section
        id="icons-heading"
        title="Leading and trailing icons"
        intro="Pass a Lucide component, not an element. Icons are 16px at default and 14px at compact, and thicken on hover."
      >
        {variants.map(({ variant, label }) => (
          <Row key={variant} label={label}>
            <IconButton variant={variant} leading="plus">
              New board
            </IconButton>
            <IconButton variant={variant} trailing="arrowRight">
              Continue
            </IconButton>
            <IconButton variant={variant} size="compact" leading="share">
              Share
            </IconButton>
            <IconButton variant={variant} size="compact" trailing="download">
              Export
            </IconButton>
          </Row>
        ))}
      </Section>

      <Section
        id="icon-sizes-heading"
        title="Icon buttons"
        intro="Size icon is 36px square and icon-compact is 28px. Always give them an aria-label."
      >
        {variants.map(({ variant, label }) => (
          <Row key={variant} label={label}>
            <Button variant={variant} size="icon" aria-label="Add">
              <Plus />
            </Button>
            <Button variant={variant} size="icon-compact" aria-label="Add">
              <Plus />
            </Button>
          </Row>
        ))}
      </Section>

      <Section
        id="loading-heading"
        title="Loading"
        intro="The loading prop keeps the width, swaps the label for a spinner and disables the button."
      >
        {variants.map(({ variant, label }) => (
          <Row key={variant} label={label}>
            <Button variant={variant} loading>
              Save to board
            </Button>
            <Button variant={variant} size="compact" loading>
              Save to board
            </Button>
          </Row>
        ))}
      </Section>

      <Section id="disabled-heading" title="Disabled" intro="Disabled buttons drop to 50% opacity and ignore the pointer.">
        {variants.map(({ variant, label }) => (
          <Row key={variant} label={label}>
            <Button variant={variant} disabled>
              Save to board
            </Button>
            <Button variant={variant} size="compact" disabled>
              Save to board
            </Button>
            <Button variant={variant} size="icon" disabled aria-label="Add">
              <Plus />
            </Button>
          </Row>
        ))}
      </Section>

      <Section
        id="links-heading"
        title="Buttons as links"
        intro="Wrap a Link with asChild to keep the button's look and the anchor's behavior."
      >
        <Row label="asChild">
          <Button asChild variant="primary">
            <Link href="/library">Open library</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/system/links">See links</Link>
          </Button>
          <IconButton asChild variant="ghost" size="compact" trailing="arrowUpRight">
            <a href="https://www.fluidfunctionalism.com" target="_blank" rel="noopener noreferrer">
              Fluid Functionalism
            </a>
          </IconButton>
        </Row>
      </Section>
    </Wrapper>
  );
}
