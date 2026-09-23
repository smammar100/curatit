import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AuthForm from "@/components/auth/AuthForm";
import { signInAction } from "@/app/actions/auth";
import { getViewer } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your Curatit account.",
  robots: { index: false },
};

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  if (await getViewer()) redirect("/library");

  return (
    <div className="mx-auto w-full max-w-sm px-6 pt-32 pb-24 sm:pt-40">
      <div className="text-center">
        <h1 className="heading-display text-foreground">Sign in</h1>
        <p className="mt-2 text-[14px] leading-5 text-muted-foreground">Pick up your research where you left it.</p>
      </div>
      <AuthForm mode="signin" action={signInAction} next={next} />
    </div>
  );
}
