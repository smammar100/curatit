import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AuthForm from "@/components/auth/AuthForm";
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
    <div className="mx-auto w-full max-w-sm px-6 pt-32 pb-24 sm:pt-40">
      <div className="text-center">
        <h1 className="heading-display text-foreground">Create an account</h1>
        <p className="mt-2 text-[14px] leading-5 text-muted-foreground">Search the library, save references to private boards, and share them when you&rsquo;re ready.</p>
      </div>
      <AuthForm mode="signup" action={signUpAction} next={next} />
    </div>
  );
}
