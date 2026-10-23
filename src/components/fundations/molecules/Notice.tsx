import type { HTMLAttributes, ReactNode, Ref } from "react";
import Check from "@/components/fundations/icons/Check";
import Info from "@/components/fundations/icons/Info";
import WarningCircle from "@/components/fundations/icons/WarningCircle";
import { cx } from "@/lib/cx";

// Notice: an inline message that stays on screen while it's true. A form's server error ("Wrong
// email or password"), a state of the page ("Sharing is off"), a warning before an action ("This
// token expires in 3 days"), a result that should stay put ("Your email is confirmed"). It sits in
// the flow, next to what it's about, on a subtle fill of its tone with the tone's icon, so it
// never relies on colour alone.
//
// Use instead:
//  - a problem with one field: the Field's error, under that field (never a Notice above the form)
//  - the result of something just done that can go unread: a Toast (useToast)
//  - a place with nothing in it yet: an EmptyState
//  - something that needs an answer before anything else: a Dialog
//
// Tones (closed, default neutral): neutral (information; bg-card, Info), positive (it worked;
// Check), warning (it will go wrong unless they act; WarningCircle), danger (it went wrong;
// WarningCircle, and red words). Warning and danger say "Warning:" / "Error:" to screen readers.
//
// `live`: false (the default) for static page content, which is read in order with the page.
// Set it when the notice appears because of something the person did: danger is then
// role="alert" (read at once), the rest role="status" (read when the reader is free). A status
// notice whose words change should stay mounted, so the change is announced.
//
// `action`: one small control after the message, a Button size="xs" (variant="secondary") or a
// text link. It sits beside a one-line message and wraps under a longer one.
//
// Copy: say what happened and what to do next, in a sentence or two. "Couldn't stop sharing. The
// link still works: check your connection and try again", never "Something went wrong".

const tones = {
  neutral: {
    box: "bg-card text-primary-foreground",
    icon: "text-secondary-foreground",
    Glyph: Info,
    label: undefined,
  },
  positive: {
    box: "bg-positive-subtle text-primary-foreground",
    icon: "text-positive-foreground",
    Glyph: Check,
    label: undefined,
  },
  // The words stay primary on positive and warning: their -foreground shades fall under 4.5:1 on
  // their own tint, so only the icon (3:1 is enough for it) wears the tone
  warning: {
    box: "bg-warning-subtle text-primary-foreground",
    icon: "text-warning-foreground",
    Glyph: WarningCircle,
    label: "Warning: ",
  },
  // Errors are red words, as AuthNotice's are: danger-foreground holds 4.6:1 on its own tint
  danger: {
    box: "bg-danger-subtle text-danger-foreground",
    icon: "text-danger-foreground",
    Glyph: WarningCircle,
    label: "Error: ",
  },
} as const;

export type NoticeTone = keyof typeof tones;

export type NoticeProps = {
  /** What kind of message. Defaults to neutral */
  tone?: NoticeTone;
  /** A short summary in medium weight above the message: "Couldn't stop sharing" */
  title?: ReactNode;
  /** The message: what happened and what to do next */
  children: ReactNode;
  /** One small control: a Button size="xs" variant="secondary", or a text link */
  action?: ReactNode;
  /** Announce it: for a notice that appears after an action (danger is role="alert", the rest
   *  role="status"). Leave off for static page content. Defaults to false */
  live?: boolean;
  /** Layout only (margins, width) */
  className?: string;
  ref?: Ref<HTMLDivElement>;
} & Omit<HTMLAttributes<HTMLDivElement>, "children" | "title" | "role">;

export default function Notice({
  tone = "neutral",
  title,
  children,
  action,
  live = false,
  className,
  ...rest
}: NoticeProps) {
  const { box, icon, Glyph, label } = tones[tone];
  return (
    <div
      role={live ? (tone === "danger" ? "alert" : "status") : undefined}
      className={cx("flex items-start gap-2 rounded-lg px-3 py-2.5 text-body-sm", box, className)}
      {...rest}
    >
      <Glyph className={cx("mt-0.5 size-4 shrink-0", icon)} />
      {/* The text takes the row; the action sits beside it while the text has 14rem, and wraps
          under it on a narrow screen or beside a long message */}
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-2">
        <div className="min-w-0 flex-[1_1_14rem] text-pretty">
          {title && (
            <p className="font-medium">
              {label && <span className="sr-only">{label}</span>}
              {title}
            </p>
          )}
          <div className={title ? "mt-0.5" : undefined}>
            {!title && label && <span className="sr-only">{label}</span>}
            {children}
          </div>
        </div>
        {action && <div className="flex shrink-0 items-center">{action}</div>}
      </div>
    </div>
  );
}
