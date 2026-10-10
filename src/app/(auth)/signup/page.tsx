import type { Metadata } from "next";
import Link from "next/link";
// Fundations
import Text from "@/components/fundations/elements/Text";
import Button from "@/components/fundations/elements/Button";
// Components
import { AuthField, OrDivider } from "@/components/auth/AuthParts";

export const metadata: Metadata = { title: "Create your Curatit account" };

// Same card as sign-in with one more line of copy; one password field (no confirmation) so it
// stays the same height and fits a short viewport
export default function SignUpPage() {
  return (
    <>
      <div className="text-center text-balance">
        <Text tag="h1" variant="displaySM" className="text-base-900 font-display font-light">
          Create your account
        </Text>
        <Text tag="p" variant="textSM" className="text-base-600 mt-2">
          Search by brief and save the posts worth studying.
        </Text>
      </div>
      <div className="mt-6 space-y-5">
        <Button size="base" variant="muted" type="button" className="w-full">
          Continue with Google
        </Button>
        <OrDivider />
        <form className="space-y-4">
          <AuthField id="email" label="Email address" type="email" placeholder="you@example.com" inputMode="email" autoComplete="email" />
          <AuthField id="password" label="Password" type="password" placeholder="••••••••" autoComplete="new-password" required />
          <Button size="base" variant="default" type="submit" className="w-full">
            Create account
          </Button>
        </form>
      </div>
      <Text tag="p" variant="textXS" className="mt-5 font-medium text-center text-base-500">
        Already have an account?{" "}
        <Link href="/signin" className="font-medium text-accent-500 hover:text-accent-600">
          Sign in
        </Link>
      </Text>
    </>
  );
}
