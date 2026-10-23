import type { HTMLAttributes, ReactNode, Ref } from "react";
import Text from "@/components/fundations/elements/Text";
import { fontWeights } from "@/lib/font-weight";
import { cn } from "@/lib/utils";

// EmptyState: what a place looks like with nothing in it yet, and the way forward. An empty
// board, the Saved view before the first save, a search that found nothing, an editor's queue
// with nothing to review. Centred: a picture, the title, a line or two, one action.
//
// Use instead:
//  - still loading: a Skeleton (an empty state shown while data loads is a lie)
//  - it failed to load: a Notice with tone="danger" and a way to try again
//  - a message about the page that sits beside content: a Notice
//  - the result of something just done: a Toast
//
// Sizes (closed, default md): md for a page or a section (the board, the Saved view); sm inside a
// panel, a card or a menu (no boards yet in the Save menu, an empty list in a settings card).
//
// `context` (closed, default dashboard) picks the type, as DESIGN.md's rule 5 does: dashboard
// sets the title in the app's roles (md text-title, sm text-body, medium) and the line in
// text-body / text-caption; site (marketing, auth and share pages) sets it through <Text>, the md
// title in the serif (h6, 20/24) and the line in body (15/24), sm both in bodySM.
//
// The picture is one of two slots, never both: `icon` (a Phosphor icon, drawn on a quiet tile, for
// sm or a plain md) or `illustration` (a drawing in the palette's tokens, as is). Either is
// decorative: the words must say everything without it.
//
// `action` is usually one Button (variant="default", size="sm" in the dashboard), the one next
// step. `secondaryAction` is a quieter way out beside it (Button variant="transparent", or a text
// link: "Clear search"). The title is a <p> unless `titleTag` makes it a heading, for an empty
// state that stands in for a whole page.
//
// Copy: say what's empty, why, and the next step. Title: the place, named ("Nothing on this board
// yet", "Your swipe file is empty", "Nothing matches ‘launch’"), never "No data" or "No results".
// Description: how things get here, in one or two sentences ("Save posts to it from the feed: Save
// is on every post."). Action: the outcome as a verb ("Browse the feed", "Clear search").

const sizes = {
  md: { box: "max-w-sm py-16", art: "mb-6", line: "mt-2", actions: "mt-6", tile: "size-12 rounded-[20px] [&_svg]:size-6" },
  sm: { box: "max-w-xs px-4 py-8", art: "mb-3", line: "mt-1", actions: "mt-4", tile: "size-10 rounded-[16px] [&_svg]:size-5" },
} as const;

// The type for each context and size. Dashboard: the app's roles. Site: Text variants
const dashboardType = {
  md: { title: "text-title", line: "text-body" },
  sm: { title: "text-body", line: "text-caption" },
} as const;
const siteType = {
  md: { title: "h6", line: "body" },
  sm: { title: "bodySM", line: "bodySM" },
} as const;

type Picture =
  | { /** A Phosphor icon, drawn on a quiet tile */ icon?: ReactNode; illustration?: never }
  | { /** A drawing in the palette's tokens, shown as it is */ illustration?: ReactNode; icon?: never };

export type EmptyStateProps = Picture & {
  /** The place, named: "Nothing on this board yet" */
  title: ReactNode;
  /** How things get here, in a sentence or two */
  description?: ReactNode;
  /** The one next step, usually a Button */
  action?: ReactNode;
  /** A quieter way out beside it: a transparent Button or a text link */
  secondaryAction?: ReactNode;
  /** md for a page or section (the default), sm inside a panel, card or menu */
  size?: keyof typeof sizes;
  /** Which type it speaks: dashboard (the app's roles, the default) or site (Text) */
  context?: "dashboard" | "site";
  /** A heading when the empty state stands in for a whole page. Defaults to p */
  titleTag?: "p" | "h2" | "h3" | "h4";
  /** Layout only (margins, width, grid placement) */
  className?: string;
  ref?: Ref<HTMLDivElement>;
} & Omit<HTMLAttributes<HTMLDivElement>, "title" | "children">;

export default function EmptyState({
  icon,
  illustration,
  title,
  description,
  action,
  secondaryAction,
  size = "md",
  context = "dashboard",
  titleTag = "p",
  className,
  ...rest
}: EmptyStateProps) {
  const s = sizes[size];
  const TitleTag = titleTag;
  return (
    <div className={cn("mx-auto flex flex-col items-center text-center", s.box, className)} {...rest}>
      {icon && (
        <div
          aria-hidden="true"
          className={cn("flex items-center justify-center bg-muted text-muted-foreground", s.tile, s.art)}
        >
          {icon}
        </div>
      )}
      {illustration && (
        <div aria-hidden="true" className={cn("pointer-events-none select-none", s.art)}>
          {illustration}
        </div>
      )}
      {context === "site" ? (
        <>
          <Text
            tag={TitleTag}
            variant={siteType[size].title}
            className="text-balance text-foreground"
            style={size === "sm" ? { fontVariationSettings: fontWeights.semibold } : undefined}
          >
            {title}
          </Text>
          {description && (
            <Text variant={siteType[size].line} className={cn("text-pretty text-muted-foreground", s.line)}>
              {description}
            </Text>
          )}
        </>
      ) : (
        <>
          <TitleTag
            className={cn("text-balance text-foreground", dashboardType[size].title)}
            style={{ fontVariationSettings: fontWeights.semibold }}
          >
            {title}
          </TitleTag>
          {description && (
            <p className={cn("text-pretty text-muted-foreground", dashboardType[size].line, s.line)}>
              {description}
            </p>
          )}
        </>
      )}
      {(action || secondaryAction) && (
        <div className={cn("flex flex-wrap items-center justify-center gap-3", s.actions)}>
          {action}
          {secondaryAction}
        </div>
      )}
    </div>
  );
}
