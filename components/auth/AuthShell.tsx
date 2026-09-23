import type { ReactNode } from "react";
import Link from "next/link";
import Symbol from "@/components/assets/Symbol";

/** Sign in and sign up: the symbol, a serif title, and the form on one centred card. */
export default function AuthShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-[calc(100svh-3.5rem)] w-full max-w-[26rem] flex-col px-6 pb-16 pt-28 sm:pt-32">
      <div className="flex flex-col items-center text-center">
        <Symbol className="size-8 text-foreground" aria-hidden="true" />
        <h1 className="heading-display mt-5 text-balance text-foreground">{title}</h1>
        <p className="mt-2 max-w-xs text-pretty text-[15px] leading-6 text-muted-foreground">{description}</p>
      </div>
      <div className="mt-8 rounded-2xl bg-card p-6 shadow-surface-3 sm:p-7">{children}</div>
      <p className="mt-6 text-center text-[12px] leading-5 text-muted-foreground">
        By continuing you agree to the{" "}
        <Link href="/legal/terms" className="underline decoration-border underline-offset-[3px] hover:text-foreground hover:decoration-foreground">
          Terms
        </Link>{" "}
        and{" "}
        <Link href="/legal/privacy" className="underline decoration-border underline-offset-[3px] hover:text-foreground hover:decoration-foreground">
          Privacy policy
        </Link>
        .
      </p>
    </div>
  );
}
