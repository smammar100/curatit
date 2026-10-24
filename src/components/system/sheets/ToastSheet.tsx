"use client";

// /system/toast: Glaze's Toaster and toast() (src/components/glaze/ui/toast). Each theme panel holds an
// inline Toaster on a manager of its own (Glaze's docs specimen), so the kinds show in place and in the
// panel's theme; the app mounts one Toaster at its root and calls toast() from anywhere. The toasts are
// added with the fields toast() builds (title, type, timeout in data). Rules from glaze-docs/toast.md
import { useEffect, useMemo } from "react";
import { Toast as ToastPrimitive } from "@base-ui/react/toast";
import { Button } from "@/components/glaze/ui/button";
import { Toaster, readingTimeout } from "@/components/glaze/ui/toast";
import { Example, Mono, Rules, Sheet, SheetBody, SheetHeader, SheetSection } from "../SheetParts";

type Kind = "default" | "success" | "warn" | "fail" | "loading";

const HELD: { kind: Kind; title: string; description?: string; action?: string }[] = [
  { kind: "fail", title: "Couldn't save the post", description: "Check your connection and try again." },
  { kind: "warn", title: "Sharing turned off", description: "The old link no longer opens the board." },
  { kind: "success", title: "Saved to Spring launch", action: "Undo" },
];

function Toasts() {
  const manager = useMemo(() => ToastPrimitive.createToastManager(), []);

  useEffect(() => {
    const ids = HELD.map((t) =>
      manager.add({
        title: t.title,
        description: t.description,
        type: t.kind,
        timeout: 0,
        priority: t.kind === "fail" ? "high" : "low",
        data: { timeout: 0 },
        actionProps: t.action ? { children: t.action, onClick: () => {} } : undefined,
      }),
    );
    return () => ids.forEach((id) => manager.close(id));
  }, [manager]);

  const show = () => {
    const title = "Copied the share link";
    const timeout = readingTimeout(title);
    manager.add({ title, type: "default", timeout, data: { timeout } });
  };

  return (
    <div className="grid max-w-sm gap-4">
      <div>
        <Button size="sm" variant="secondary" onClick={show}>
          Show a toast
        </Button>
      </div>
      <Toaster inline manager={manager} />
    </div>
  );
}

export default function ToastSheet() {
  return (
    <SheetBody>
      <SheetHeader title="Toast" importLine={`import {Toaster, toast} from '@/components/glaze/ui/toast'`}>
        Confirms an action or reports an event whose result is out of view. It leaves after its reading time; a failure
        and a loading toast stay until they are closed or settle. At most three show, and a failure is never hidden.
      </SheetHeader>

      <SheetSection title="Kinds" description="A failure, a warning and a success with its one action, held in place. Show a toast to see one arrive and leave on its reading time.">
        <Sheet split>{() => <Toasts />}</Sheet>
      </SheetSection>

      <SheetSection title="Example">
        <Example
          code={`// once, at the app's root
<Toaster/>

toast.success('Saved to Spring launch', {action: {label: 'Undo', onClick: undo}});
toast.fail("Couldn't save the post", {description: 'Check your connection and try again.'});
toast.promise(save(), {loading: 'Saving', success: 'Saved', fail: "Couldn't save"});`}
        />
      </SheetSection>

      <SheetSection title="Rules">
        <Rules
          items={[
            { kind: "do", text: "Mount one Toaster at the app's root and call toast() from anywhere." },
            { kind: "do", text: <>Report a failure with <Mono>toast.fail</Mono>, and use toast.promise or toast.update for work that finishes later.</> },
            { kind: "do", text: "Write a success in the past tense with its object, under 48 characters; leave timeout unset." },
            { kind: "do", text: "Make a toast's one action reachable in the view too, such as Undo in the row's menu." },
            { kind: "dont", text: "Toast a change that is already on screen, or put buttons in the title or description." },
          ]}
        />
      </SheetSection>
    </SheetBody>
  );
}
