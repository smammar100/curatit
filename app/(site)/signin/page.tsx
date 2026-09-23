import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AuthForm from "@/components/auth/AuthForm";
import AuthShell from "@/components/auth/AuthShell";
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
    <AuthShell title="Sign in to Curatit" description="Pick up your research where you left it.">
      <AuthForm mode="signin" action={signInAction} next={next} />
    </AuthShell>
  );
}
