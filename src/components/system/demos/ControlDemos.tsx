"use client";

// The live demos on the Controls sheet (/system/controls) that need state of their own: a
// Segmented that says how its last change arrived, a controlled Segmented, switches, and a form
// naming both through Field. The uncontrolled specimens are rendered straight from the sheet,
// which stays a server component. Each demo is rendered once per theme panel, so ids come from
// useId. Nothing moves until a person acts.
import { useId, useRef, useState, type FormEvent } from "react";
import Button from "@/components/fundations/elements/Button";
import Segmented from "@/components/fundations/elements/Segmented";
import Switch from "@/components/fundations/elements/Switch";
import Field from "@/components/fundations/molecules/Field";

const TILES = [
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "large", label: "Large" },
];

const labelOf = (value: string) => TILES.find((t) => t.value === value)?.label ?? value;

/**
 * A Segmented with a readout of how its last change arrived and what the thumb did: a key snaps
 * it, a pointer slides it, and on load nothing moves. Segmented reports a click on the option
 * that's already chosen too; that moves nothing, so the readout ignores it. The readout is for
 * the eye: the radio already announces the new value, so it isn't a live region.
 */
export function KeyboardDemo() {
  const via = useRef<"key" | "pointer">("pointer");
  const [last, setLast] = useState<{ value: string; via: "load" | "key" | "pointer" }>({
    value: "medium",
    via: "load",
  });

  return (
    <div
      onKeyDownCapture={() => {
        via.current = "key";
      }}
      onPointerDownCapture={() => {
        via.current = "pointer";
      }}
      className="flex flex-col items-start gap-4"
    >
      <Segmented
        aria-label="Tile size"
        size="md"
        shape="pill"
        value={last.value}
        onValueChange={(value) => {
          if (value !== last.value) setLast({ value, via: via.current });
        }}
        options={TILES}
      />
      <p className="min-h-10 max-w-64 text-body-sm text-secondary-foreground">
        <span className="font-medium text-primary-foreground">{labelOf(last.value)}</span>
        {last.via === "load" && ", as the page loaded: nothing moved."}
        {last.via === "key" && ", from the keyboard: the thumb snapped."}
        {last.via === "pointer" && (
          <>
            , from a pointer:{" "}
            {/* Swapped by CSS, so it's right whatever the setting and nothing waits for a script */}
            <span className="motion-reduce:hidden">the thumb slid.</span>
            <span className="hidden motion-reduce:inline">the thumb jumped, as reduced motion asks.</span>
          </>
        )}
      </p>
    </div>
  );
}

/** Controlled: the page owns the value, shows it, and can change it from outside */
export function ControlledDemo() {
  const [size, setSize] = useState("medium");
  return (
    <div className="flex flex-col items-start gap-3">
      <Segmented aria-label="Tile size" value={size} onValueChange={setSize} options={TILES} />
      <div className="flex items-center gap-3">
        <code className="font-mono text-caption-lg text-secondary-foreground">value = &quot;{size}&quot;</code>
        <Button variant="muted" size="xs" disabled={size === "medium"} onClick={() => setSize("medium")}>
          Reset
        </Button>
      </div>
    </div>
  );
}

/** One switch in one state, flippable unless it's disabled */
export function SwitchState({
  label,
  defaultChecked = false,
  disabled = false,
}: {
  label: string;
  defaultChecked?: boolean;
  disabled?: boolean;
}) {
  const [on, setOn] = useState(defaultChecked);
  return <Switch aria-label={label} checked={on} onCheckedChange={setOn} disabled={disabled} />;
}

/** Named by a <label htmlFor>: its words are the name, and a tap on them flips it */
export function LabelledSwitch() {
  const id = useId();
  const [on, setOn] = useState(false);
  return (
    <div className="flex w-full max-w-72 items-center justify-between gap-4">
      <label htmlFor={id} className="min-w-0 text-body-sm font-medium text-primary-foreground select-none">
        Share with a link
      </label>
      <Switch id={id} checked={on} onCheckedChange={setOn} />
    </div>
  );
}

const DAYS = [
  { value: "30", label: "30 days" },
  { value: "90", label: "90 days" },
  { value: "365", label: "365 days" },
];

/**
 * The recipe: each control in a Field, which gives it its id, its name (aria-labelledby, which a
 * Segmented needs) and its description (aria-describedby). Neither control is a form input, so
 * the form doesn't carry their values: they're kept in state and read on submit.
 */
export function FieldDemo() {
  const [shared, setShared] = useState(false);
  const [days, setDays] = useState("90");
  const [sent, setSent] = useState<string | null>(null);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSent(`shared is ${shared}, expires in ${days} days`);
  };

  return (
    <form onSubmit={submit} className="flex w-full max-w-80 flex-col gap-4">
      <Field label="Share with a link" layout="inline-end" description="Anyone with the link can view it, read-only">
        <Switch checked={shared} onCheckedChange={setShared} />
      </Field>
      <Field label="Expires in">
        <Segmented size="md" shape="pill" value={days} onValueChange={setDays} options={DAYS} />
      </Field>
      <Button type="submit" size="sm" className="w-fit">
        Create
      </Button>
      <p role="status" className="min-h-5 text-caption-lg text-pretty text-secondary-foreground">
        {sent === null ? "" : `Read on submit: ${sent}. Nothing was sent.`}
      </p>
    </form>
  );
}
