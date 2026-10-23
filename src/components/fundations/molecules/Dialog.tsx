"use client";

// A dialog: a task that takes the screen's focus until it's done or dismissed (2026-10-18), the
// new-board dialog's native <dialog> made one component (and, since 2026-10-19, what that dialog
// is built on, through radius="large" and titleVariant="quiet"). showModal() does the hard parts: the page
// behind is inert, focus stays inside, Escape asks to close, and focus goes back to whatever
// opened it. It scales in from 0.97 and fades over 200ms and leaves in 140ms (.dialog-motion in
// global.css), the backdrop with it; neither under reduced motion. The page behind stops
// scrolling while it's open, its scrollbar's width padded back so nothing reflows.
//
//   <Dialog open={open} onOpenChange={setOpen} title="Delete this board?" description="…"
//     footer={<><Button variant="muted" onClick={…}>Cancel</Button><Button variant="danger" …>Delete</Button></>} />
//
// Use it for a decision that must be made before going on (delete for good, discard a draft) or a
// short form that belongs to no page (name a new board). Instead: a message about the page is a
// Notice; confirmation after an action is a Toast; a choice from a list is a Menu; a few words on
// a control are a Tooltip; anything long, linked to or worth a Back button is its own page.
import { useEffect, useId, useRef, type ReactNode, type RefObject } from "react";
import Button from "@/components/fundations/elements/Button";
import Close from "@/components/fundations/icons/Close";
import { usePresence } from "@/lib/motion";
import { cx } from "@/lib/cx";

// Widths: a confirmation, a short form, a longer read
const sizes = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-2xl",
} as const;

// Corners: the scale's 16px, or the new-board dialog's 28px (2026-10-19, kept from its Cosmos
// prototype: a dialog whose content is one large field and a full-width pill reads softer). The
// padding stays 24px either way
const radii = {
  default: "rounded-3xl",
  large: "rounded-[28px]",
} as const;

// The title: a heading that names the task (the default), or a quiet label over content that
// carries the subject itself (the new board's name, set large in the middle). Both are the h2
// the dialog is labelled by
const titleVariants = {
  default: "text-body-base font-medium text-balance text-primary-foreground",
  quiet: "text-body-base font-medium text-balance text-secondary-foreground",
} as const;

// .dialog-motion's exit, so the contents stay for it and then unmount
const EXIT_MS = 140;
// Where focus goes when it opens, unless initialFocus says otherwise: the first field
const FIELDS = 'input:not([type="hidden"]):not([disabled]), textarea:not([disabled]), select:not([disabled])';

// The page behind stops scrolling while any dialog is open (a modal <dialog> doesn't stop the
// wheel by itself); hiding the scrollbar would widen the page, so its width is padded back
let locks = 0;
function lockScroll() {
  const root = document.documentElement;
  if (locks++ === 0) {
    const scrollbar = window.innerWidth - root.clientWidth;
    root.style.overflow = "hidden";
    if (scrollbar > 0) root.style.paddingRight = `${scrollbar}px`;
  }
  return () => {
    if (--locks > 0) return;
    root.style.overflow = "";
    root.style.paddingRight = "";
  };
}

export type DialogProps = {
  /** Always controlled: the page opens it and hears every way it asks to close */
  open: boolean;
  /** Called with false on Escape, the close button, a press on the backdrop (unless
   *  dismissible is false), or the browser closing it */
  onOpenChange: (open: boolean) => void;
  /** Its name, shown at the top and read as the dialog opens. A question or a task, in a few words */
  title: string;
  /** One or two sentences under the title, read with it */
  description?: ReactNode;
  /** sm 384px (a confirmation), md 448px (a short form), lg 672px (a longer read) */
  size?: keyof typeof sizes;
  /** default 16px corners; large 28px, only for a dialog built round one large field (the new board) */
  radius?: keyof typeof radii;
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
  /** Whether a press on the backdrop closes it. Turn it off when closing would lose typing */
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
  radius = "default",
  titleVariant = "default",
  role = "dialog",
  children,
  footer,
  closeButton = true,
  dismissible = true,
  initialFocus,
}: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();
  // The contents mount with it and leave after its exit, so every open starts fresh
  const { mounted } = usePresence(open, EXIT_MS);
  // A press that started on the backdrop: a drag that starts inside and ends outside isn't a click out
  const pressedOutside = useRef(false);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      // showModal focuses the first control, which would be a link or a button before the field
      (initialFocus?.current ?? dialog.querySelector<HTMLElement>(FIELDS))?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open, initialFocus]);

  useEffect(() => (open ? lockScroll() : undefined), [open]);

  return (
    <dialog
      ref={ref}
      role={role === "alertdialog" ? "alertdialog" : undefined}
      aria-labelledby={`${id}-title`}
      aria-describedby={description ? `${id}-description` : undefined}
      // Escape: the page decides, so open stays in step
      onCancel={(event) => {
        event.preventDefault();
        onOpenChange(false);
      }}
      // However else it closes (a browser that won't let Escape be held back twice), open follows
      onClose={() => {
        if (open) onOpenChange(false);
      }}
      onPointerDown={(event) => {
        pressedOutside.current = event.target === event.currentTarget;
      }}
      // The dialog's own box, outside its contents, is the backdrop
      onClick={(event) => {
        if (dismissible && pressedOutside.current && event.target === event.currentTarget) onOpenChange(false);
        pressedOutside.current = false;
      }}
      className={cx(
        "dialog-motion m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] overflow-hidden border-0 bg-modal p-0 text-primary-foreground shadow-xl backdrop:bg-black/40",
        sizes[size],
        radii[radius],
      )}
    >
      {mounted && (
        <div className="flex max-h-[calc(100dvh-2rem)] flex-col pb-6">
          <div className={cx("shrink-0 px-6 pt-6", closeButton && "pr-16")}>
            <h2 id={`${id}-title`} className={titleVariants[titleVariant]}>
              {title}
            </h2>
            {description && (
              <p id={`${id}-description`} className="mt-1 text-body-sm text-pretty text-secondary-foreground">
                {description}
              </p>
            )}
          </div>
          {children && (
            <div className="min-h-0 flex-1 overflow-y-auto px-6 pt-4 text-body-sm text-secondary-foreground">{children}</div>
          )}
          {footer && (
            <div className="flex shrink-0 flex-col-reverse gap-2 px-6 pt-6 *:max-sm:w-full sm:flex-row sm:justify-end">
              {footer}
            </div>
          )}
          {/* Last in the tab order, so focus starts on the task; first to the eye. Placed by a
              wrapper, since Button sets its own position (relative); 40px, 44 on touch screens */}
          {closeButton && (
            <span className="absolute top-4 right-4 flex">
              <Button
                variant="transparent"
                size="base"
                iconOnly
                aria-label="Close"
                onClick={() => onOpenChange(false)}
                className="pointer-coarse:after:absolute pointer-coarse:after:-inset-0.5"
              >
                <Close className="size-4" />
              </Button>
            </span>
          )}
        </div>
      )}
    </dialog>
  );
}
