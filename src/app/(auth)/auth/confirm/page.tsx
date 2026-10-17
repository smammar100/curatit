import type { Metadata } from "next";
import { ConfirmLinkForm } from "@/components/auth/AuthForms";

export const metadata: Metadata = { title: "Confirm", robots: { index: false } };

// Where the links in Curatit's confirm, reset and change-email emails land (supabase/templates):
// one button that uses the link's token, so a mail scanner that opens the link can't
export default function ConfirmPage() {
  return <ConfirmLinkForm />;
}
