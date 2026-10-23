"use client";

// A dialog: a task that takes the screen's focus until it's done or dismissed. Since 2026-10-23
// it is Fluid Functionalism's Dialog (src/components/ui/dialog.tsx, on Radix's dialog) behind
// the API the dashboard has used since 2026-10-18: a panel four steps up the surface ladder with
// a dialog's shadow and the container corners, entering on the slow spring (a short grow from
// 0.97 and a fade, the overlay fading with it) and leaving on its quicker exit tween; Radix keeps
// focus inside, makes the page behind inert, stops it scrolling, closes on Escape and returns
// focus to what opened it. Under reduced motion it fades without growing.
//
//   <Dialog open={open} onOpenChange={setOpen} title="Delete this board?" description="…"
//     footer={<><Button variant="muted" onClick={…}>Cancel</Button><Button variant="danger" …>Delete</Button></>} />
//
// Use it for a decision that must be made before going on (delete for good, discard a draft) or a
// short form that belongs to no page (name a new board). Instead: a message about the page is a
// Notice; confirmation after an action is a Toast; a choice from a list is a Menu; a few words on
// a control are a Tooltip; anything long, linked to or worth a Back button is its own page.
import { useEffect, useRef, type ReactNode, type RefObject } from "react";
import { MotionConfig } from "motion/react";
import {
  Dialog as FluidDialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

// Widths: a confirmation, a short form, a longer read, on the library's three (400, 540, 880px)
const sizes = {
  sm: "sm",
  md: "lg",
  lg: "xl",
} as const;

// The title: a heading that names the task (the default), or a quiet label over content that
// carries the subject itself (the new board's name, set large in the middle). Both are the
// heading the dialog is labelled by
const titleVariants = {
  default: "text-foreground",
  quiet: "text-muted-foreground",
} as const;

// Where focus goes when it opens, unless initialFocus says otherwise: the first field
const FIELDS = 'input:not([type="hidden"]):not([disabled]), textarea:not([disabled]), select:not([disabled])';

export type DialogProps = {
  /** Always controlled: the page opens it and hears every way it asks to close */
  open: boolean;
  /** Called with false on Escape, the close button, a press on the overlay (unless
   *  dismissible is false) */
  onOpenChange: (open: boolean) => void;
  /** Its name, shown at the top and read as the dialog opens. A question or a task, in a few words */
  title: string;
  /** One or two sentences under the title, read with it */
  description?: ReactNode;
  /** sm 400px (a confirmation), md 540px (a short form), lg 880px (a longer read) */
  size?: keyof typeof sizes;
  /** Accepted for older call sites: every dialog has the container corners (the site's shape) */
  radius?: "default" | "large";
  /** default: the title as the dialog's heading; quiet: a secondary-coloured label, for a dialog
   *  whose first field is the real subject. Either way it's the accessible name */
  titleVariant?: keyof typeof titleVariants;
  /** alertdialog for a decision with consequences (delete for good); it's announced as urgent */
  role?: "dialog" | "alertdialog";
  /** The body. Scrolls when it's taller than the screen; the title and footer stay put */
  children?: ReactNode;
  /** The actions, right-aligned with the primary last (stacked, primary on top, on phones) */
  footer?: ReactNode;
  /** The ✕ in the top corner */
  closeButton?: boolean;
  /** Whether a press on the overlay closes it. Turn it off when closing would lose typing */
  dismissible?: boolean;
  /** What takes focus when it opens; otherwise the first field, otherwise the first control */
  initialFocus?: RefObject<HTMLElement | null>;
};

export default function Dialog({
  open,
  onOpenChange,
  title,
  description,
  size = "md",
  radius: _radius,
  titleVariant = "default",
  role = "dialog",
  children,
  footer,
  closeButton = true,
  dismissible = true,
  initialFocus,
}: DialogProps) {
  // What had focus when it opened, so focus goes back there when it closes. Radix sends focus to
  // its own DialogTrigger on close and nowhere when there isn't one; the site opens dialogs from
  // state, so the wrapper remembers the opener itself
  const opener = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (open) opener.current = document.activeElement as HTMLElement | null;
  }, [open]);
  return (
    <MotionConfig reducedMotion="user">
      <FluidDialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          size={sizes[size]}
          showCloseButton={closeButton}
          role={role}
          // Radix would focus the first control, which may be a link or a button before the field
          onOpenAutoFocus={(event) => {
            const target = initialFocus?.current ?? (event.currentTarget as HTMLElement).querySelector<HTMLElement>(FIELDS);
            if (!target) return;
            event.preventDefault();
            target.focus();
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            const back = opener.current;
            opener.current = null;
            if (back?.isConnected) back.focus();
          }}
          onPointerDownOutside={(event) => {
            if (!dismissible) event.preventDefault();
          }}
          onInteractOutside={(event) => {
            if (!dismissible) event.preventDefault();
          }}
          className="flex max-h-[calc(100dvh-2rem)] flex-col"
        >
          <DialogHeader className={cn("shrink-0", closeButton && "pr-10")}>
            <DialogTitle className={cn("text-balance", titleVariants[titleVariant])}>{title}</DialogTitle>
            {description && <DialogDescription className="text-pretty">{description}</DialogDescription>}
          </DialogHeader>
          {children && <div className="min-h-0 flex-1 overflow-y-auto text-body text-muted-foreground">{children}</div>}
          {footer && (
            <DialogFooter className="shrink-0 flex-col-reverse gap-2 *:max-sm:w-full sm:flex-row">{footer}</DialogFooter>
          )}
        </DialogContent>
      </FluidDialog>
    </MotionConfig>
  );
}
