import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/auth/AuthForms";

export const metadata: Metadata = { title: "Choose a new password", robots: { index: false } };

// Reached from the reset email through /auth/callback, which signs the visitor in first
export default function ResetPasswordPage() {
  return <ResetPasswordForm />;
}
