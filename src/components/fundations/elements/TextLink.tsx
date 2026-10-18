import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import ArrowUpRight from "@/components/fundations/icons/ArrowUpRight";
import { cx } from "@/lib/cx";

// A link that is words: somewhere to go, read as part of the text. Built on next/link, so an
// internal href is a client-side navigation and is prefetched. For a page's next step drawn as a
// button (Create account) use Button with isLink; for an action (Save, Copy) a Button; for a
// whole card that opens something, CardTitle's href.
//
//   inline  inside running text: the surrounding colour, a hairline underline
//           (decoration-border-strong, 2px under the text) that turns brand with the words on
//           hover. The underline is what tells it apart, so never take it off.
//   quiet   a link on its own or in a list (Forgot password?, Back to Saved, a footer column):
//           secondary text, no underline, the primary ink on hover. On touch screens it reaches
//           44px tall through an invisible ::after, so space a list of them 44px apart.
//
// `external` opens a new tab (target=_blank, rel=noreferrer), adds the ArrowUpRight glyph,
// held to the last word so it never wraps alone, and says "(opens in a new tab)" to screen
// readers. Focus is the brand ring with a small radius, on keyboard focus only.

const variants = {
  inline:
    "underline decoration-border-strong decoration-1 underline-offset-2 hover:text-brand-foreground hover:decoration-brand-foreground",
  quiet:
    "text-secondary-foreground no-underline hover:text-primary-foreground pointer-coarse:after:absolute pointer-coarse:after:-inset-x-1 pointer-coarse:after:-inset-y-3",
} as const;

const base =
  "relative rounded-sm transition-[color,text-decoration-color] duration-150 ease-out-quint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-border-focus";

export type TextLinkProps = Omit<ComponentProps<typeof Link>, "target" | "children"> & {
  variant?: keyof typeof variants;
  /** Another site, in a new tab: the arrow glyph and the screen-reader note come with it */
  external?: boolean;
  children: ReactNode;
};

export default function TextLink({
  variant = "inline",
  external = false,
  rel,
  className,
  children,
  ...rest
}: TextLinkProps) {
  return (
    <Link
      {...rest}
      target={external ? "_blank" : undefined}
      rel={external ? cx("noreferrer", rel) : rel}
      className={cx(base, variants[variant], className)}
    >
      {children}
      {external && (
        <>
          {/* A word joiner keeps the glyph on the last word's line */}
          <span className="whitespace-nowrap">
            {"⁠"}
            <ArrowUpRight className="ml-0.5 inline size-[0.75em] align-baseline" />
          </span>
          <span className="sr-only"> (opens in a new tab)</span>
        </>
      )}
    </Link>
  );
}
