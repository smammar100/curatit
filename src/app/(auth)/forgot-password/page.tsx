import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth/AuthForms";

export const metadata: Metadata = { title: "Reset your Curatit password" };

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
