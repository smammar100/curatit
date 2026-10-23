"use client";

// The password field for sign-up and reset password: the input, a strength meter that fills as
// you type, and the project's rules as a checklist that ticks off live (PASSWORD_RULES in
// lib/auth, the same rules Supabase enforces). The meter runs red, amber, light green, green
// (the danger, warning and success tokens in global.css); the word beside it says the same in
// a darker shade, so the level never rests on colour alone. Since 2026-10-23 the field is the
// system's (AuthField: a Field holding an Input), the meter's track and the unfilled bars are the
// muted tint and the one stroke, and the words take the ink or the muted ink, in the library's
// semibold where they were medium.
import { useEffect, useRef, useState, type ReactNode } from "react";
import Check from "@/components/fundations/icons/Check";
import { PASSWORD_RULES } from "@/lib/auth";
import { cx } from "@/lib/cx";
import { fontWeights } from "@/lib/font-weight";
import { AuthField } from "./AuthParts";

const semibold = { fontVariationSettings: fontWeights.semibold };

const LEVELS = [
  { label: "", fill: "", text: "" },
  { label: "Weak", fill: "bg-danger-500", text: "text-danger-foreground" },
  { label: "Fair", fill: "bg-warning-500", text: "text-warning-700" },
  { label: "Good", fill: "bg-success-400", text: "text-success-700" },
  { label: "Strong", fill: "bg-success-600", text: "text-success-700" },
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
            <span
              key={step}
              className="h-1 overflow-hidden rounded-full bg-muted"
            >
              <span
                className={cx(
                  "block h-full origin-left rounded-full transition-[scale,background-color] duration-200 ease-out-quint motion-reduce:transition-none",
                  step <= level
                    ? cx(fill, "scale-x-100")
                    : "scale-x-0 bg-border",
                )}
                // The fill sweeps left to right as the level climbs
                style={{ transitionDelay: `${(step - 1) * 40}ms` }}
              />
            </span>
          ))}
        </div>
        <p
          aria-live="polite"
          className={cx(
            "w-12 text-right text-caption-lg transition-colors duration-200 ease-out-quint motion-reduce:transition-none",
            text,
          )}
          style={semibold}
        >
          {word && <span className="sr-only">Password strength: </span>}
          {word}
        </p>
      </div>

      {/* The rules, ticked off as they're met */}
      <ul
        id={`${id}-rules`}
        className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5"
      >
        {PASSWORD_RULES.map((rule) => {
          const ok = rule.test(value);
          return (
            <li
              key={rule.id}
              className={cx(
                "flex items-center gap-1.5 text-caption-lg transition-colors duration-150 ease-out-quint motion-reduce:transition-none",
                ok ? "text-foreground" : "text-muted-foreground",
              )}
            >
              <span
                className="flex size-3 shrink-0 items-center justify-center"
                aria-hidden="true"
              >
                {ok ? (
                  <Check className="size-3" />
                ) : (
                  <span className="size-1 rounded-full bg-tertiary-foreground" />
                )}
              </span>
              <span className="sr-only">{ok ? "Done: " : "Needs: "}</span>
              {rule.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
