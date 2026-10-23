"use client";

// Notice: an inline message that stays on screen while it's true. Since 2026-10-23 it is Fluid
// Functionalism's Banner (src/components/ui/banner.tsx): a light wash of the tone's colour behind
// the words (a neutral grey for information), the tone's filled glyph before them with the mark
// cut out in the page colour, the words always the ink, the container corners, and actions that
// trail a one-line message and drop under a longer one. A notice that appears opens its row on
// the moderate spring and grows in on the slow one; one that's dismissed folds its row away.
//
// A form's server error ("Wrong email or password"), a state of the page ("Sharing is off"), a
// warning before an action ("This token expires in 3 days"), a result that should stay put
// ("Your email is confirmed"). It sits in the flow, next to what it's about.
//
// Use instead:
//  - a problem with one field: the Field's error, under that field (never a Notice above the form)
//  - the result of something just done that can go unread: a Toast (useToast)
//  - a place with nothing in it yet: an EmptyState
//  - something that needs an answer before anything else: a Dialog
//
// Tones (closed, default neutral): neutral (information), positive (it worked), warning (it will
// go wrong unless they act), danger (it went wrong).
//
// `live`: false (the default) for static page content, which is read in order with the page.
// Set it when the notice appears because of something the person did: danger and warning are
// then role="alert" (read at once), the rest role="status" (read when the reader is free). A
// status notice whose words change should stay mounted, so the change is announced.
//
// `action`: one small control after the message, a Button size="xs" or a text link.
//
// Copy: say what happened and what to do next, in a sentence or two. "Couldn't stop sharing. The
// link still works: check your connection and try again", never "Something went wrong".
import type { ReactNode, Ref } from "react";
import { MotionConfig } from "motion/react";
import { Banner, BannerActions, BannerDescription, BannerTitle } from "@/components/ui/banner";
import { fontWeights } from "@/lib/font-weight";

const tones = {
  neutral: "default",
  positive: "success",
  warning: "warning",
  danger: "error",
} as const;

export type NoticeTone = keyof typeof tones;

export type NoticeProps = {
  /** What kind of message. Defaults to neutral */
  tone?: NoticeTone;
  /** A short summary in a heavier weight above the message: "Couldn't stop sharing" */
  title?: ReactNode;
  /** The message: a sentence or two */
  children: ReactNode;
  /** One small control after the message */
  action?: ReactNode;
  /** Announce it when it appears (a result of something the person did) */
  live?: boolean;
  /** Layout only */
  className?: string;
  ref?: Ref<HTMLDivElement>;
};

export default function Notice({ tone = "neutral", title, children, action, live = false, className, ref }: NoticeProps) {
  return (
    <MotionConfig reducedMotion="user">
      <Banner
        ref={ref}
        status={tones[tone]}
        contrast="high"
        // Static page content is read in order with the page; only a live notice announces itself
        role={live ? undefined : "none"}
        className={className}
      >
        {title ? (
          <>
            <BannerTitle className="text-pretty">{title}</BannerTitle>
            <BannerDescription className="text-pretty">{children}</BannerDescription>
          </>
        ) : (
          // Without a title the message takes the title's row, in the normal weight, so the
          // glyph lines up with its first line
          <BannerTitle className="text-pretty" style={{ fontVariationSettings: fontWeights.normal }}>
            {children}
          </BannerTitle>
        )}
        {action && <BannerActions>{action}</BannerActions>}
      </Banner>
    </MotionConfig>
  );
}
