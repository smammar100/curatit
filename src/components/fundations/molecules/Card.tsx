"use client";

import Link from "next/link";
import type { ComponentProps, HTMLAttributes, ReactNode, Ref } from "react";
import { Card as FluidCard } from "@/components/ui/card";
import { fontWeights } from "@/lib/font-weight";
import { cn } from "@/lib/utils";

// A grouped surface: one thing and what's said about it (a post, a plan, a client to connect,
// a board). Since 2026-10-23 it is Fluid Functionalism's Card (src/components/ui/card.tsx) behind
// the API the site has used since 2026-10-18: the container corners (24px, the site's pill
// shape), a surface from the ladder, and the parts below for the media, the title, the caption
// and the description. Use it when the group needs an edge to hold together; a group that space
// alone can hold is a plain div with a gap. Not for a menu, a popover or a dialog (they float:
// Menu, Dialog) and not for a message (Notice). A wrapper card around a whole page section is a
// Wrapper, never a Card.
//
//   <Card tag="article">
//     <CardMedia aspect="8/5"><Image … /></CardMedia>
//     <CardMeta className="mt-4" uppercase>Finance · Carousel</CardMeta>
//     <CardTitle className="mt-1" href="/dashboard/p/abc">Revolut's savings carousel</CardTitle>
//     <CardDescription className="mt-1">Seven slides that…</CardDescription>
//   </Card>
//
// Two surfaces: `mat` (bg-card, the grey mat under images; its tint is its edge) and `raised`
// (the third step of the surface ladder with its shadow: a white card with the one hairline).
// CardMedia's corner follows the padding, concentric with the card's: 16px inside 8px of
// padding, 8px inside 16px, and its own 4px inside 24px, where the two surfaces read apart.
//
// A whole card opens one place: give CardTitle an href. Its link stretches over the card (an
// ::after on the link), so the link is named by the title alone, the image and the padding open
// it too, and the focus ring goes round the card. The other words sit above that layer, so they
// can be selected and copied (a click on them doesn't open the link). A second control in a
// linked card (a Save button) takes `relative z-20` to sit above it too. The parts set their own
// type and colour; spacing between them is the caller's (mt-4 after the media, mt-1 between
// meta, title and description).

const variants = {
  mat: "bg-card",
  raised: "bg-surface-3 shadow-surface-2",
} as const;
// Padding, and the media corner it implies (24px outer): sm 8 → 16px, md 16 → 8px, lg 24 → 4px
const paddings = {
  sm: "p-2 [--card-media-radius:16px]",
  md: "p-4 [--card-media-radius:8px]",
  lg: "p-6 [--card-media-radius:4px]",
} as const;

type CardTag = "div" | "article" | "section" | "li";

export type CardProps = Omit<HTMLAttributes<HTMLElement>, "onClick"> & {
  /** Accepted for older call sites: the library's card is a div */
  tag?: CardTag;
  variant?: keyof typeof variants;
  padding?: keyof typeof paddings;
  ref?: Ref<HTMLDivElement>;
};

export default function Card({
  tag: _tag,
  variant = "mat",
  padding = "lg",
  className,
  ref,
  children,
  ...rest
}: CardProps) {
  return (
    <FluidCard
      ref={ref}
      // The library's card is a column with a bottom padding and a 60px floor, for its own parts;
      // the site's parts bring their padding, so the box is plain
      className={cn("block min-h-0", variants[variant], paddings[padding], className)}
      {...(rest as Omit<HTMLAttributes<HTMLDivElement>, "onClick">)}
    >
      {children}
    </FluidCard>
  );
}

// A picture, cut to the corner the padding implies and sat on a grey mat with a hairline edge
const aspects = {
  "8/5": "aspect-8/5",
  "4/5": "aspect-4/5",
  "1/1": "aspect-square",
  "16/9": "aspect-video",
  natural: "",
} as const;

export type CardMediaProps = HTMLAttributes<HTMLDivElement> & {
  /** 8/5 the blog and store cards (default), 4/5 a post cover, 1/1, 16/9, or the image's own */
  aspect?: keyof typeof aspects;
  children: ReactNode;
  ref?: Ref<HTMLDivElement>;
};

export function CardMedia({ aspect = "8/5", className, children, ref, ...rest }: CardMediaProps) {
  return (
    <div
      {...rest}
      ref={ref}
      className={cn(
        "relative overflow-hidden rounded-[var(--card-media-radius,4px)] bg-muted shadow-surface-1",
        "after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:outline-1 after:-outline-offset-1 after:outline-border",
        aspect === "natural" ? "[&>img]:h-auto [&>img]:w-full" : "[&>img]:size-full [&>img]:object-cover",
        aspects[aspect],
        className,
      )}
    >
      {children}
    </div>
  );
}

// The card's name. With `href` it's the card's one link, stretched over the whole card.
// Sizes: sm the gallery card's 13px (the default), md 15px, both in the library's semibold; lg
// the serif at h6 (20px) for a card that stands alone
const titleSizes = {
  sm: "text-body-sm",
  md: "text-body-base",
  lg: "font-display font-normal text-h6",
} as const;

const stretched =
  "rounded-[4px] transition-colors duration-150 ease-out-quint hover:text-brand-foreground after:absolute after:inset-0 after:z-10 after:rounded-[24px] focus-visible:outline-none focus-visible:after:outline-1 focus-visible:after:outline-offset-2 focus-visible:after:outline-[color:var(--focus-ring)]";

export type CardTitleProps = Omit<HTMLAttributes<HTMLHeadingElement>, "children"> & {
  /** The heading level that fits the page's outline: h3 under a section's h2, the default */
  tag?: "h2" | "h3" | "h4" | "p";
  size?: keyof typeof titleSizes;
  /** Makes the whole card open this place */
  href?: ComponentProps<typeof Link>["href"];
  children: ReactNode;
};

export function CardTitle({ tag = "h3", size = "sm", href, className, style, children, ...rest }: CardTitleProps) {
  const Tag = tag;
  return (
    <Tag
      {...rest}
      className={cn("text-foreground", titleSizes[size], className)}
      style={size === "lg" ? style : { fontVariationSettings: fontWeights.semibold, ...style }}
    >
      {href ? (
        <Link href={href} className={stretched}>
          {children}
        </Link>
      ) : (
        children
      )}
    </Tag>
  );
}

// What's said about it, in a sentence or two. Above the stretched link, so it can be selected
export function CardDescription({ className, ...rest }: HTMLAttributes<HTMLParagraphElement>) {
  return <p {...rest} className={cn("relative z-20 text-body-sm text-muted-foreground", className)} />;
}

// A caption: category, format, date, a count. `uppercase` is accepted for older call sites, but
// the library sets no caps and no tracking: a caption is the caption role in the muted ink
export function CardMeta({
  uppercase: _uppercase,
  className,
  ...rest
}: HTMLAttributes<HTMLParagraphElement> & { uppercase?: boolean }) {
  return <p {...rest} className={cn("relative z-20 text-caption-lg text-muted-foreground", className)} />;
}
