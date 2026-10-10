import type { Metadata } from "next";
import Link from "next/link";
// Fundations
import Text from "@/components/fundations/elements/Text";
import Button from "@/components/fundations/elements/Button";
// Components
import { AuthField, OrDivider } from "@/components/auth/AuthParts";

export const metadata: Metadata = { title: "Sign in to Curatit" };

export default function SignInPage() {
  return (
    <>
      <div className="text-center text-balance">
        <Text tag="h1" variant="displaySM" className="text-base-900 font-display font-light">
          Welcome back
        </Text>
        <Text tag="p" variant="textSM" className="text-base-600 mt-2">
          Sign in to pick up your boards where you left them.
        </Text>
      </div>
      <div className="mt-6 space-y-5">
        {/* Until sign-in is wired to Supabase, both ways in lead straight to the dashboard */}
        <Button isLink size="base" variant="muted" href="/dashboard" className="w-full">
          Continue with Google
        </Button>
        <OrDivider />
        <form action="/dashboard" className="space-y-4">
          <AuthField id="email" label="Email address" type="email" placeholder="you@example.com" inputMode="email" autoComplete="email" />
          <AuthField
            id="password"
            label="Password"
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
            required
          />
          <Button size="base" variant="default" type="submit" className="w-full">
            Sign in
          </Button>
        </form>
      </div>
      <Text tag="p" variant="textXS" className="mt-5 font-medium text-center text-base-500">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-medium text-accent-500 hover:text-accent-600">
          Sign up
        </Link>
      </Text>
    </>
  );
}
