import Link from "next/link";
import type { ComponentProps, HTMLAttributes, ReactNode, Ref } from "react";
import { cx } from "@/lib/cx";

// A grouped surface: one thing and what's said about it (a post, a plan, a client to connect,
// a board). Use it when the group needs an edge to hold together; a group that space alone can
// hold is a plain div with a gap. Not for a menu, a popover or a dialog (they float: Menu,
// Dialog) and not for a message (Notice). A wrapper card around a whole page section is a
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
// (bg-container + shadow-xs, a white card with a hairline). The corner is rounded-2xl (12px),
// and CardMedia's corner follows the padding: inner = outer − padding, square when that's zero
// or less, its own 4px from 24px of padding, where the two surfaces read apart.
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
  raised: "bg-container shadow-xs",
} as const;
// Padding, and the media corner it implies (12px outer): sm 8 → 4px, md 16 → square,
// lg 24 → its own 4px
const paddings = {
  sm: "p-2 [--card-media-radius:var(--radius-sm)]",
  md: "p-4 [--card-media-radius:0px]",
  lg: "p-6 [--card-media-radius:var(--radius-sm)]",
} as const;

type CardTag = "div" | "article" | "section" | "li";

export type CardProps = HTMLAttributes<HTMLElement> & {
  /** article for one of a list of things, li inside a ul */
  tag?: CardTag;
  variant?: keyof typeof variants;
  padding?: keyof typeof paddings;
  ref?: Ref<HTMLElement>;
};

export default function Card({
  tag = "div",
  variant = "mat",
  padding = "lg",
  className,
  ref,
  children,
  ...rest
}: CardProps) {
  // One element type for the ref; the tag is any of the four
  const Tag = tag as "div";
  return (
    <Tag
      {...rest}
      ref={ref as Ref<HTMLDivElement>}
      // relative holds CardTitle's stretched link; isolate keeps its layers inside the card
      className={cx("relative isolate rounded-2xl", variants[variant], paddings[padding], className)}
    >
      {children}
    </Tag>
  );
}

// The image's frame: a picture (next/image or img) cropped to an aspect ratio, on the component
// tint while it loads, with the default shadow and the 1px edge line drawn over the pixels (an
// ::after, so it holds in both themes and over a `fill` image). `natural` keeps the image's own
// shape: give the image its width and height.
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
      className={cx(
        "relative overflow-hidden rounded-[var(--card-media-radius,var(--radius-sm))] bg-component shadow-sm",
        "after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:outline-1 after:-outline-offset-1 after:outline-edge",
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
// Sizes: sm the gallery card's 13px medium (the default), md 15px medium, lg the serif at h6
// (20px) for a card that stands alone.
const titleSizes = {
  sm: "text-body-sm font-medium",
  md: "text-body-base font-medium",
  lg: "font-display font-normal text-h6",
} as const;

const stretched =
  "rounded-sm transition-colors duration-150 ease-out-quint hover:text-brand-foreground after:absolute after:inset-0 after:z-10 after:rounded-2xl focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-brand-border-focus";

export type CardTitleProps = Omit<HTMLAttributes<HTMLHeadingElement>, "children"> & {
  /** The heading level that fits the page's outline: h3 under a section's h2, the default */
  tag?: "h2" | "h3" | "h4" | "p";
  size?: keyof typeof titleSizes;
  /** Makes the whole card open this place */
  href?: ComponentProps<typeof Link>["href"];
  children: ReactNode;
};

export function CardTitle({ tag = "h3", size = "sm", href, className, children, ...rest }: CardTitleProps) {
  const Tag = tag;
  return (
    <Tag {...rest} className={cx("text-primary-foreground", titleSizes[size], className)}>
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
  return <p {...rest} className={cx("relative z-20 text-body-sm text-secondary-foreground", className)} />;
}

// A caption: category, format, date, a count. `uppercase` for an eyebrow over the title, which
// needs the wider tracking
export function CardMeta({
  uppercase = false,
  className,
  ...rest
}: HTMLAttributes<HTMLParagraphElement> & { uppercase?: boolean }) {
  return (
    <p
      {...rest}
      className={cx(
        "relative z-20 text-caption-lg text-secondary-foreground",
        uppercase && "tracking-wider uppercase",
        className,
      )}
    />
  );
}
