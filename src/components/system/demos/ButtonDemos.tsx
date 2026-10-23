"use client";

// The live demos on the Button sheet (/system/button): the ones that need state, which a server
// sheet can't hold. `loading` is one of them by itself: its click guard is a function, so only a
// client component can pass it. Nothing here moves until it's pressed, and under reduced motion
// the spinner holds still and the menu appears and goes at once (Button and Menu do that).
// Each demo renders once per theme panel, so ids come from useId.
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import Button, { type ButtonProps } from "@/components/fundations/elements/Button";
import Switch from "@/components/fundations/elements/Switch";
import Menu, { MenuItem, MenuSeparator } from "@/components/fundations/molecules/Menu";

// How long a pretend request takes: long enough to see the spinner and try clicking again
const BUSY_MS = 2000;

/** Busy for two seconds on each click, then back. A timer per button, cleared if it unmounts */
function useBusy() {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const start = () => {
    setBusy(true);
    setDone(false);
    timer.current = setTimeout(() => {
      setBusy(false);
      setDone(true);
    }, BUSY_MS);
  };
  return { busy, done, start };
}

/** One specimen of the States matrix: a Button that goes busy when it's clicked */
export function LoadingButton({
  variant,
  children,
}: {
  variant: NonNullable<ButtonProps["variant"]>;
  children: ReactNode;
}) {
  const { busy, start } = useBusy();
  return (
    <Button variant={variant} loading={busy} onClick={start}>
      {children}
    </Button>
  );
}

/** A form's submit, as the auth forms do it: loading while the request runs, the label saying so */
export function LoadingForm() {
  const { busy, done, start } = useBusy();
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        start();
      }}
      className="w-full max-w-xs rounded-2xl bg-container p-5 shadow-xs"
    >
      <p className="text-body-sm font-medium text-primary-foreground">Create your account</p>
      <p className="mt-1 text-body-sm text-secondary-foreground">It sends nothing: it waits two seconds.</p>
      <Button type="submit" loading={busy} className="mt-4 w-full">
        {busy ? "Creating account…" : "Create account"}
      </Button>
      <p role="status" className="mt-3 min-h-5 text-caption-lg text-secondary-foreground">
        {done ? "Done. Nothing was sent." : ""}
      </p>
    </form>
  );
}

/** On or off: a Switch, never a Button that stays pressed */
export function SwitchDemo() {
  const id = useId();
  const [on, setOn] = useState(false);
  return (
    <div className="flex w-full max-w-64 items-center justify-between gap-4">
      <label htmlFor={id} className="text-body-sm text-primary-foreground select-none">
        Share with a link
      </label>
      <Switch label="Share with a link" labelHidden checked={on} onCheckedChange={setOn} />
    </div>
  );
}

/** Several actions behind one trigger: a Menu. The trigger is a Button, the rows are MenuItems */
export function MenuDemo() {
  const [picked, setPicked] = useState<string | null>(null);
  const pick = (action: string) => () => setPicked(action);
  return (
    <div className="flex flex-col gap-3">
      <Menu
        label="Board actions"
        className="w-fit"
        trigger={
          <Button variant="secondary" size="sm" shape="pill" iconOnly aria-label="More">
            <span aria-hidden="true" className="flex gap-[3px]">
              {[0, 1, 2].map((i) => (
                <span key={i} className="size-[3px] rounded-full bg-current" />
              ))}
            </span>
          </Button>
        }
      >
        <MenuItem onSelect={pick("Rename")}>Rename</MenuItem>
        <MenuItem onSelect={pick("Add a description")}>Add a description</MenuItem>
        <MenuSeparator />
        <MenuItem tone="danger" onSelect={pick("Delete board")}>
          Delete board…
        </MenuItem>
      </Menu>
      <p aria-live="polite" className="text-caption-lg text-secondary-foreground">
        {picked ? `Picked ${picked}` : "Nothing picked yet"}
      </p>
    </div>
  );
}
