"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Lock, Mail } from "lucide-react";
import type { AuthState } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { InputGroup, InputField } from "@/components/ui/input-group";

export default function AuthForm({
  mode,
  action,
  next,
}: {
  mode: "signin" | "signup";
  action: (state: AuthState, form: FormData) => Promise<AuthState>;
  next?: string;
}) {
  const [state, formAction, pending] = useActionState(action, { error: null, email: "" });
  const [email, setEmail] = useState(state.email);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const isSignUp = mode === "signup";

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      {next && <input type="hidden" name="next" value={next} />}

      <InputGroup className="w-full">
        <InputField
          index={0}
          label="Email address"
          name="email"
          type="email"
          icon={Mail}
          autoComplete="email"
          inputMode="email"
          required
          placeholder="you@agency.com"
          value={email}
          onChange={setEmail}
          aria-describedby={state.error ? "auth-error" : undefined}
        />
        <InputField
          index={1}
          label={isSignUp ? "Password, at least 10 characters" : "Password"}
          name="password"
          type="password"
          icon={Lock}
          autoComplete={isSignUp ? "new-password" : "current-password"}
          required
          minLength={isSignUp ? 10 : undefined}
          value={password}
          onChange={setPassword}
        />
        {isSignUp ? (
          <InputField
            index={2}
            label="Confirm password"
            name="confirm"
            type="password"
            icon={Lock}
            autoComplete="new-password"
            required
            value={confirm}
            onChange={setConfirm}
          />
        ) : null}
      </InputGroup>

      <div id="auth-error" role="alert" aria-live="assertive" className="min-h-5 px-1 text-[13px] text-destructive">
        {state.error}
      </div>

      <Button type="submit" loading={pending} className="w-full">
        {isSignUp ? "Create account" : "Sign in"}
      </Button>

      <p className="text-center text-[13px] text-muted-foreground">
        {isSignUp ? "Already have an account? " : "New to Curatit? "}
        <Link
          href={`${isSignUp ? "/signin" : "/signup"}${next ? `?next=${encodeURIComponent(next)}` : ""}`}
          className="rounded-[2px] text-foreground underline decoration-border underline-offset-[3px] transition-colors duration-80 hover:decoration-foreground"
        >
          {isSignUp ? "Sign in" : "Create an account"}
        </Link>
      </p>
    </form>
  );
}
