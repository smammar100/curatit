import type { Metadata } from "next";
import { SignInForm } from "@/components/auth/AuthForms";

export const metadata: Metadata = { title: "Sign in to Curatit" };

export default function SignInPage() {
  return <SignInForm />;
}
