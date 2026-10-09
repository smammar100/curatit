import type { ReactNode } from "react";
import BaseLayout from "@/layouts/BaseLayout";

// Sign in / sign up: no navigation or footer
export default function AuthLayout({ children }: { children: ReactNode }) {
  return <BaseLayout hideNavigation hideFooter>{children}</BaseLayout>;
}
