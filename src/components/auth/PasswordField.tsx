"use client";

// The password field for sign-up and reset password: the input, a strength meter that fills as
// you type, and the project's rules as a checklist that ticks off live (PASSWORD_RULES in
// lib/auth, the same rules Supabase enforces). Red is kept for errors, so strength reads as
// ink: the segments darken from a pale grey to full black as it improves.
import { useEffect, useRef, useState } from "react";
import Check from "@/components/fundations/icons/Check";
import { PASSWORD_RULES } from "@/lib/auth";
import { cx } from "@/lib/cx";
import { AuthField } from "./AuthParts";

const LEVELS = [
  { label: "", fill: "" },
  { label: "Weak", fill: "bg-base-300" },
  { label: "Fair", fill: "bg-base-500" },
  { label: "Good", fill: "bg-base-700" },
  { label: "Strong", fill: "bg-base-900" },
];

// Guessable no matter which rules they meet: common passwords, a run of one character, and
// runs along the alphabet, the digits or the keyboard
const COMMON = /pass(w|word)|qwert|letmein|welcome|admin|iloveyou|monkey|dragon|abc123|curatit/i;
const RUNS = ["abcdefghijklmnopqrstuvwxyz", "0123456789", "qwertyuiopasdfghjklzxcvbnm"];
function guessable(password: string) {
  const lower = password.toLowerCase();
  if (COMMON.test(lower) || /(.)\1\1/.test(lower)) return true;
  for (let i = 0; i + 4 <= lower.length; i++) {
    const run = lower.slice(i, i + 4);
    if (RUNS.some((line) => line.includes(run) || [...line].reverse().join("").includes(run))) return true;
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

export default function PasswordField({ id = "password", label = "Password", error }: { id?: string; label?: string; error?: string | null }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState("");
  const level = strength(value);
  const { label: word, fill } = LEVELS[level];

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
            <span key={step} className="h-1 overflow-hidden rounded-full bg-base-100">
              <span
                className={cx(
                  "block h-full origin-left rounded-full transition-[scale,background-color] duration-200 ease-out motion-reduce:transition-none",
                  step <= level ? cx(fill, "scale-x-100") : "scale-x-0 bg-base-300",
                )}
                // The fill sweeps left to right as the level climbs
                style={{ transitionDelay: `${(step - 1) * 40}ms` }}
              />
            </span>
          ))}
        </div>
        <p aria-live="polite" className="w-12 text-right text-xs font-medium text-base-900">
          {word && <span className="sr-only">Password strength: </span>}
          {word}
        </p>
      </div>

      {/* The rules, ticked off as they're met */}
      <ul id={`${id}-rules`} className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5">
        {PASSWORD_RULES.map((rule) => {
          const ok = rule.test(value);
          return (
            <li key={rule.id} className={cx("flex items-center gap-1.5 text-xs transition-colors duration-150 motion-reduce:transition-none", ok ? "text-base-900" : "text-base-500")}>
              <span className="flex size-3 shrink-0 items-center justify-center" aria-hidden="true">
                {ok ? <Check className="size-3" /> : <span className="size-1 rounded-full bg-base-400" />}
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
