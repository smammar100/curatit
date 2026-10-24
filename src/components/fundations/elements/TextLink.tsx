import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { ArrowUpRight, Icon } from "@/components/glaze/icon";
import { cn } from "@/lib/glaze/utils";

// A link that is words: somewhere to go, read as part of the text. Built on next/link, so an
// internal href is a client-side navigation and is prefetched. For a page's next step drawn as a
// button (Create account) use Button with isLink; for an action (Save, Copy) a Button; for a
// whole card that opens something, CardTitle's href.
//
//   inline  inside running text: the surrounding colour, a hairline underline (Glaze's control
//           line, 2px under the text) that darkens to the text with the words on hover. The
//           underline is what tells it apart, so never take it off.
//   quiet   a link on its own or in a list (Forgot password?, Back to Saved, a footer column):
//           secondary text, no underline, the primary text on hover. On touch screens it reaches
//           44px tall through an invisible ::after, so space a list of them 44px apart.
//
// `external` opens a new tab (target=_blank, rel=noreferrer), adds the ArrowUpRight glyph,
// held to the last word so it never wraps alone, and says "(opens in a new tab)" to screen
// readers. Since 2026-10-24 it sits on Glaze's tokens (text-1 and text-2, the control line, the
// state duration) and takes Glaze's ink focus ring from its base styles. Glaze has no link
// component of its own (its links inherit), so this is the site's one inline link.

const variants = {
  inline: "underline decoration-line-control decoration-1 underline-offset-2 hover:decoration-text-1",
  quiet:
    "text-text-2 no-underline hover:text-text-1 pointer-coarse:after:absolute pointer-coarse:after:-inset-x-1 pointer-coarse:after:-inset-y-3",
} as const;

const base = "relative rounded-tag transition-[color,text-decoration-color] duration-(--dur-state) ease-out";

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
      rel={external ? cn("noreferrer", rel) : rel}
      className={cn(base, variants[variant], className)}
    >
      {children}
      {external && (
        <>
          {/* A word joiner keeps the glyph on the last word's line */}
          <span className="whitespace-nowrap">
            {"⁠"}
            <Icon icon={ArrowUpRight} size={12} className="ms-0.5 inline align-baseline" />
          </span>
          <span className="sr-only"> (opens in a new tab)</span>
        </>
      )}
    </Link>
  );
}
