"use client";

// The live demos on the feedback sheets (/system/notice, /system/toast): the ones that need state
// or a function, which a server sheet can't hold. Each renders once per theme panel. The toast
// demo brings its own ToastProvider, so a toast fired from the dark panel wears the dark theme
// (the panel's tokens cascade into the fixed region); both panels' toasts appear at the bottom
// centre of the window. Nothing is sent anywhere: the failures are pretend.
import { useEffect, useRef, useState } from "react";
import Button from "@/components/fundations/elements/Button";
import Notice from "@/components/fundations/molecules/Notice";
import { ToastProvider, toastDuration, useToast, type ToastOptions, type ToastTone } from "@/components/fundations/molecules/Toast";

const seconds = (ms: number) => `${(ms / 1000).toFixed(1)}s`;

/** The reading time a toast would get, for the sheet's table (toastDuration is client code) */
export function ToastDuration({ message, action, tone }: { message: string; action?: string; tone?: ToastTone }) {
  return (
    <span className="font-mono text-caption-lg text-primary-foreground tabular-nums">
      {seconds(toastDuration({ message, tone, action: action ? { label: action, onClick: () => {} } : undefined }))}
    </span>
  );
}

function Triggers() {
  const { toast, dismiss } = useToast();
  const [last, setLast] = useState<{ id: number; ms: number; message: string } | null>(null);
  const show = (options: ToastOptions) => {
    const id = toast(options);
    setLast({ id, ms: options.duration ?? toastDuration(options), message: options.message });
  };
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" size="sm" onClick={() => show({ message: "Saved to Moodboard" })}>
          Save a post
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() =>
            show({
              message: "Removed from Moodboard",
              action: { label: "Undo", onClick: () => show({ message: "Put back on Moodboard" }) },
            })
          }
        >
          Remove, with Undo
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() =>
            show({
              message: "Couldn’t save to Moodboard. Check your connection, then save it again.",
              tone: "danger",
            })
          }
        >
          Fail to save
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            show({ message: "Link copied" });
            show({ message: "Saved to Launch ideas" });
            show({ message: "Saved to Moodboard" });
          }}
        >
          Three at once
        </Button>
        <Button variant="transparent" size="sm" disabled={!last} onClick={() => last && dismiss(last.id)}>
          Dismiss
        </Button>
      </div>
      <p className="min-h-5 text-caption-lg text-secondary-foreground">
        {last
          ? `“${last.message}” stays ${seconds(last.ms)}, longer while you point at it or focus it.`
          : "Each button fires a real toast at the bottom of the window."}
      </p>
    </div>
  );
}

/** Buttons that fire real toasts through this panel's own provider */
export function ToastDemo() {
  return (
    <ToastProvider>
      <Triggers />
    </ToastProvider>
  );
}

// How long the pretend request takes
const BUSY_MS = 800;

/** A notice that appears after an action: role="alert", read out as it lands. Trying again keeps
 *  it mounted (focus stays on Try again) and changes its title, which is read out too */
export function LiveNoticeDemo() {
  const [busy, setBusy] = useState(false);
  const [failures, setFailures] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const stop = () => {
    setBusy(true);
    timer.current = setTimeout(() => {
      setBusy(false);
      setFailures((n) => n + 1);
    }, BUSY_MS);
  };
  return (
    <div className="flex max-w-md flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="secondary" size="sm" loading={busy && failures === 0} onClick={stop}>
          Stop sharing
        </Button>
        <Button
          variant="transparent"
          size="sm"
          onClick={() => {
            clearTimeout(timer.current);
            setBusy(false);
            setFailures(0);
          }}
        >
          Reset the demo
        </Button>
      </div>
      {failures > 0 && (
        <Notice
          tone="danger"
          live
          title={failures > 1 ? "Still couldn’t stop sharing" : "Couldn’t stop sharing"}
          action={
            <Button variant="secondary" size="xs" loading={busy} onClick={stop}>
              Try again
            </Button>
          }
        >
          The link still works for anyone who has it. Check your connection and try again.
        </Notice>
      )}
    </div>
  );
}
