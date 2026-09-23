import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AuthForm from "@/components/auth/AuthForm";
import AuthShell from "@/components/auth/AuthShell";
import { signUpAction } from "@/app/actions/auth";
import { getViewer } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Create an account",
  description: "Create your Curatit account.",
  robots: { index: false },
};

export default async function SignUpPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  if (await getViewer()) redirect("/library");

  return (
    <AuthShell title="Create your account" description="Search the library, save references to private boards, and share them when you’re ready.">
      <AuthForm mode="signup" action={signUpAction} next={next} />
    </AuthShell>
  );
}
