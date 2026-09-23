import type { Metadata } from "next";
import type { ReactNode } from "react";
import PageHeader from "@/components/fundations/containers/PageHeader";
import Wrapper from "@/components/fundations/containers/Wrapper";
import { fontWeights } from "@/lib/font-weight";

export const metadata: Metadata = {
  title: "Colors",
  description: "The surface ladder, semantic tokens and the brand hue.",
};

// Class names are written out in full so Tailwind's scanner generates them.
const surfaces = [
  { level: 1, className: "bg-surface-1 shadow-surface-1", light: "#FAFAFA", dark: "#171717", use: "The page floor. Same as background." },
  { level: 2, className: "bg-surface-2 shadow-surface-2", light: "#FCFCFC", dark: "#1E1E1E", use: "Sunken wells and sidebars." },
  { level: 3, className: "bg-surface-3 shadow-surface-3", light: "#FFFFFF", dark: "#252525", use: "Cards. Same as card." },
  { level: 4, className: "bg-surface-4 shadow-surface-4", light: "#FFFFFF", dark: "#2C2C2C", use: "Popovers and menus on the page." },
  { level: 5, className: "bg-surface-5 shadow-surface-5", light: "#FFFFFF", dark: "#333333", use: "Dialogs and toasts." },
  { level: 6, className: "bg-surface-6 shadow-surface-6", light: "#FFFFFF", dark: "#3A3A3A", use: "Menus inside dialogs." },
  { level: 7, className: "bg-surface-7 shadow-surface-7", light: "#FFFFFF", dark: "#414141", use: "Deep nesting." },
  { level: 8, className: "bg-surface-8 shadow-surface-8", light: "#FFFFFF", dark: "#484848", use: "The ceiling. Elevated clamps here." },
];

type Token = { name: string; className: string; value: string; use: string };

const semantic: Token[] = [
  { name: "background", className: "bg-background", value: "surface-1", use: "Page background." },
  { name: "foreground", className: "bg-foreground", value: "#171717 / #F5F5F5", use: "Primary text, primary button fill." },
  { name: "card", className: "bg-card", value: "surface-3", use: "Card ground." },
  { name: "card-foreground", className: "bg-card-foreground", value: "#171717 / #F5F5F5", use: "Text on cards." },
  { name: "muted", className: "bg-muted", value: "#F4F4F5 / #1E1E1E", use: "Quiet fills: notes, skeletons, tracks." },
  { name: "muted-foreground", className: "bg-muted-foreground", value: "#737373 / #A3A3A3", use: "Secondary text and captions." },
];

const interactive: Token[] = [
  { name: "hover", className: "bg-hover", value: "black 4% / white 6%", use: "Hover tint on any surface." },
  { name: "active", className: "bg-active", value: "black 7% / white 10%", use: "Pressed tint on any surface." },
  { name: "accent", className: "bg-accent", value: "#E5E5E5 / #525252", use: "Pressed state and secondary button fill. Not a brand color." },
  { name: "accent-foreground", className: "bg-accent-foreground", value: "#171717 / #F5F5F5", use: "Text on accent." },
  { name: "selected", className: "bg-selected", value: "#D4D4D4 / #525252", use: "Persistent selection." },
  { name: "focus-ring", className: "bg-[var(--focus-ring)]", value: "#6B97FF", use: "1px focus ring, 2px offset." },
];

const lines: Token[] = [
  { name: "border", className: "bg-border", value: "foreground at 12%", use: "Hairlines and dividers." },
  { name: "ring", className: "bg-ring", value: "#E5E5E5 / #404040", use: "Control rings." },
  { name: "input", className: "bg-input", value: "#E5E5E5 / #404040", use: "Input outlines." },
  { name: "destructive", className: "bg-destructive", value: "#EF4444 / #F87171", use: "Error text and destructive actions." },
  { name: "destructive-light", className: "bg-destructive-light", value: "#FEF2F2 / #450A0A", use: "Error note ground." },
];

const brand: Token[] = [
  { name: "brand", className: "bg-brand", value: "#C54120 / #DC5431", use: "The saved dot and saved button fill." },
  { name: "brand-soft", className: "bg-brand-soft", value: "#FDF3F0 / #2B120B", use: "Saved chip ground, text selection." },
  { name: "brand-text", className: "bg-brand-text", value: "#9C3318 / #F2957A", use: "Saved label, selected text." },
  { name: "on-brand", className: "bg-on-brand", value: "#FFFFFF / #171717", use: "Text on brand." },
];

function TokenList({ tokens }: { tokens: Token[] }) {
  return (
    <ul className="mt-6 grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
      {tokens.map((token) => (
        <li key={token.name} className="flex items-start gap-3">
          <span aria-hidden="true" className={`size-12 shrink-0 rounded-lg ring-1 ring-inset ring-border ${token.className}`} />
          <div className="min-w-0">
            <p className="text-[13px] leading-5 text-foreground">
              <code>{token.name}</code>
            </p>
            <p className="text-[12px] leading-4 text-muted-foreground tabular-nums">{token.value}</p>
            <p className="mt-1 text-[12px] leading-4 text-muted-foreground">{token.use}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

function Section({
  id,
  title,
  intro,
  first = false,
  children,
}: {
  id: string;
  title: string;
  intro: string;
  first?: boolean;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={id} className={first ? undefined : "mt-12"}>
      <h2 id={id} className="heading-section text-foreground">
        {title}
      </h2>
      <p className="mt-1 max-w-2xl text-[13px] leading-5 text-muted-foreground">{intro}</p>
      {children}
    </section>
  );
}

export default function ColorsPage() {
  return (
    <Wrapper variant="standard" className="pb-24">
      <PageHeader
        title="Colors"
        description="Each token is written once as light-dark(), so every swatch here follows your theme."
      />

      <Section
        first
        id="surfaces-heading"
        title="Surfaces"
        intro="8 levels, each paired 1:1 with a shadow. In light, levels 3 to 8 are white and the shadow does the work."
      >
        <ul className="mt-6 grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-4">
          {surfaces.map((surface) => (
            <li key={surface.level}>
              <div aria-hidden="true" className={`h-24 rounded-xl ${surface.className}`} />
              <p
                className="mt-3 text-[13px] leading-5 text-foreground"
                style={{ fontVariationSettings: fontWeights.medium }}
              >
                Surface {surface.level}
              </p>
              <p className="text-[12px] leading-4 text-muted-foreground">
                <code>bg-surface-{surface.level}</code> + <code>shadow-surface-{surface.level}</code>
              </p>
              <p className="mt-1 text-[12px] leading-4 text-muted-foreground tabular-nums">
                {surface.light} / {surface.dark}
              </p>
              <p className="mt-1 text-[12px] leading-4 text-muted-foreground">{surface.use}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="semantic-heading" title="Text and ground" intro="What pages and cards are made of. Values read light / dark.">
        <TokenList tokens={semantic} />
      </Section>

      <Section id="interactive-heading" title="Interaction" intro="Tints ride on top of whatever surface they land on.">
        <TokenList tokens={interactive} />
      </Section>

      <Section id="lines-heading" title="Lines and errors" intro="Always pair an error color with a sentence that says what went wrong.">
        <TokenList tokens={lines} />
      </Section>

      <Section
        id="brand-heading"
        title="Brand"
        intro="Terracotta marks the saved state and text selection only. Never a button, heading, link or section ground."
      >
        <TokenList tokens={brand} />
      </Section>
    </Wrapper>
  );
}
