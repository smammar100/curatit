import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Text from "@/components/fundations/elements/Text";
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
    <div className="w-full max-w-md px-8 py-24 lg:py-48 mx-auto">
      <div className="text-center">
        <Text tag="h1" variant="displayLG" className="text-base-900 font-display font-light">
          Create an account
        </Text>
        <Text tag="p" variant="textBase" className="text-base-600 mt-4">
          Search the library, save references to private boards, and share them when you&rsquo;re ready.
        </Text>
      </div>
      <AuthForm mode="signup" action={signUpAction} next={next} />
    </div>
  );
}
