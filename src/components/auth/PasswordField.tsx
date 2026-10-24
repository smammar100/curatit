"use client";

// The password field for sign-up and reset password: the input, a strength meter that fills as
// you type, and the project's rules as a checklist that ticks off live (PASSWORD_RULES in
// lib/auth, the same rules Supabase enforces). The meter runs red, amber, light green, green;
// the word beside it says the same in its word colour, so the level never rests on colour alone.
// Since 2026-10-24 on Glaze: the field is AuthField (Glaze's Field and Input), the bars Glaze's
// status marks (fail, warn, then ok at two strengths) on the grey field's track, the words the
// status words, and each rule a Check glyph once met and a quiet dot glyph until then, in text-1
// or text-2.
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Check, DotOutline, Icon } from "@/components/glaze/icon";
import { PASSWORD_RULES } from "@/lib/auth";
import { cx } from "@/lib/cx";
import { AuthField } from "./AuthParts";

const LEVELS = [
  { label: "", fill: "", text: "" },
  { label: "Weak", fill: "bg-fail", text: "text-fail-text" },
  { label: "Fair", fill: "bg-warn", text: "text-warn-text" },
  { label: "Good", fill: "bg-ok/60", text: "text-ok-text" },
  { label: "Strong", fill: "bg-ok", text: "text-ok-text" },
];

// Guessable no matter which rules they meet: common passwords, a run of one character, and
// runs along the alphabet, the digits or the keyboard
const COMMON =
  /pass(w|word)|qwert|letmein|welcome|admin|iloveyou|monkey|dragon|abc123|curatit/i;
const RUNS = [
  "abcdefghijklmnopqrstuvwxyz",
  "0123456789",
  "qwertyuiopasdfghjklzxcvbnm",
];
function guessable(password: string) {
  const lower = password.toLowerCase();
  if (COMMON.test(lower) || /(.)\1\1/.test(lower)) return true;
  for (let i = 0; i + 4 <= lower.length; i++) {
    const run = lower.slice(i, i + 4);
    if (
      RUNS.some(
        (line) =>
          line.includes(run) || [...line].reverse().join("").includes(run),
      )
    )
      return true;
  }
  return false;
}

// 0 (nothing typed) to 4. A password that misses a rule can't be saved, so it stays Weak or
// Fair; one that meets them all is Good, Strong from 12 characters, and a step lower when it's
// easy to guess anyway
export function strength(password: string) {
  if (!password) return 0;
  const met = PASSWORD_RULES.filter((rule) => rule.test(password)).length;
  if (met < PASSWORD_RULES.length) return met <= 2 ? 1 : 2;
  const level = password.length >= 12 ? 4 : 3;
  return guessable(password) ? level - 1 : level;
}

export default function PasswordField({
  id = "password",
  label = "Password",
  error,
}: {
  id?: string;
  label?: string;
  error?: ReactNode;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState("");
  const level = strength(value);
  const { label: word, fill, text } = LEVELS[level];

  // React empties the form after its action runs; start the meter and checklist over with it
  useEffect(() => {
    const form = wrapRef.current?.closest("form");
    const reset = () => setValue("");
    form?.addEventListener("reset", reset);
    return () => form?.removeEventListener("reset", reset);
  }, []);

  return (
    <div ref={wrapRef}>
      <AuthField
        id={id}
        label={label}
        type="password"
        placeholder="••••••••"
        autoComplete="new-password"
        required
        aria-describedby={`${id}-rules`}
        error={error}
        onChange={(event) => setValue(event.currentTarget.value)}
      />

      {/* Strength */}
      <div className="mt-2.5 flex items-center gap-3">
        <div className="grid flex-1 grid-cols-4 gap-1" aria-hidden="true">
          {[1, 2, 3, 4].map((step) => (
            <span key={step} className="h-1 overflow-hidden rounded-pill bg-field">
              <span
                className={cx(
                  "block h-full origin-left rounded-pill transition-[scale,background-color] delay-(--step-delay) duration-(--dur-slide) ease-out motion-reduce:transition-none",
                  step <= level ? cx(fill, "scale-x-100") : "scale-x-0",
                )}
                // The fill sweeps left to right as the level climbs
                style={{ "--step-delay": `${(step - 1) * 40}ms` } as CSSProperties}
              />
            </span>
          ))}
        </div>
        <p
          aria-live="polite"
          className={cx(
            "w-12 text-right type-label-sm transition-colors duration-(--dur-state) ease-out motion-reduce:transition-none",
            text,
          )}
        >
          {word && <span className="sr-only">Password strength: </span>}
          {word}
        </p>
      </div>

      {/* The rules, ticked off as they're met */}
      <ul id={`${id}-rules`} className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5">
        {PASSWORD_RULES.map((rule) => {
          const ok = rule.test(value);
          return (
            <li
              key={rule.id}
              className={cx(
                "flex items-center gap-1.5 type-caption transition-colors duration-(--dur-state) ease-out motion-reduce:transition-none",
                ok ? "text-text-1" : "text-text-2",
              )}
            >
              {ok ? <Icon icon={Check} size={12} /> : <Icon icon={DotOutline} size={12} className="text-text-3" />}
              <span className="sr-only">{ok ? "Done: " : "Needs: "}</span>
              {rule.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
