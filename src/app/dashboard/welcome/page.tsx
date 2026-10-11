import type { Metadata } from "next";
// Components
import Welcome from "@/components/onboarding/Welcome";

export const metadata: Metadata = { title: "Set up your feed · Curatit" };

// The welcome flow after sign-up (and again from the account menu). The feed sends anyone whose
// profile has no onboarded_at here; the posts come from the layout, the profile loads in the
// browser.
export default function WelcomePage() {
  return <Welcome />;
}
