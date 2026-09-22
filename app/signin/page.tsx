import type { Metadata } from "next";
import Link from "next/link";
import Text from "@/components/fundations/elements/Text";
import Button from "@/components/fundations/elements/Button";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your Curatit account.",
};

const fieldClass =
  "block w-full px-4 py-2 text-xs leading-tight align-middle bg-white border border-transparent transition duration-300 ease-in-out focus:z-10 h-9 rounded-md text-base-500 ring-1 ring-base-200 placeholder-base-400 focus:border-accent-500 focus:ring-accent-100 focus:ring-2 focus:outline-none shadow-sm";

export default function SignInPage() {
  return (
    <div className="flex h-dvh">
      <div className="w-full max-w-md py-24 lg:py-48 mx-auto">
        <div className="text-center">
          <Text tag="h1" variant="displayLG" className="text-base-900 font-display font-light">
            Sign in
          </Text>
          <Text tag="p" variant="textBase" className="text-base-600 mt-4">
            Welcome back. Enter your email and password like you haven’t forgotten them for the
            12th time this week.
          </Text>
        </div>
        <form className="mt-10 space-y-4">
          <div className="w-full">
            <div className="flex items-baseline justify-between mb-1">
              <label htmlFor="email" className="text-sm font-medium text-base-500">
                Email Address
              </label>
            </div>
            <div className="relative z-0 focus-within:z-10">
              <input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                className={fieldClass}
                inputMode="email"
              />
            </div>
          </div>
          <div className="w-full">
            <div className="flex items-baseline justify-between mb-1">
              <label htmlFor="password" className="text-sm font-medium text-base-500">
                Password
              </label>
            </div>
            <div className="relative z-0 focus-within:z-10">
              <input
                required
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                className={fieldClass}
                aria-required="true"
              />
            </div>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="login-remember"
              name="login-remember"
              className="rounded shadow border-base-300 text-accent-600 focus:ring-accent-500 focus:ring-offset-2 focus:ring-2 size-4"
            />
            <label htmlFor="login-remember" className="ml-2 text-sm font-medium text-base-500">
              Remember me for 30 days
            </label>
          </div>
          <div className="flex flex-col gap-2">
            <Button size="base" variant="accent" type="submit">
              Sign in with email
            </Button>
            <Button size="base" variant="muted" type="button">
              Sign in with Google
            </Button>
          </div>
        </form>
        <Text tag="p" variant="textXS" className="mt-4 font-medium text-center text-base-500">
          Don&rsquo;t have an account?{" "}
          <Link href="/signup" className="font-medium text-accent-500 hover:text-base-500">
            Sign up
          </Link>
        </Text>
      </div>
    </div>
  );
}
