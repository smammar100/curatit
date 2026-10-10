import type { Metadata } from "next";
import { SignUpForm } from "@/components/auth/AuthForms";

export const metadata: Metadata = { title: "Create your Curatit account" };

// Same card as sign-in; one password field (no confirmation) so it stays the same height and
// fits a short viewport
export default function SignUpPage() {
  return <SignUpForm />;
}
