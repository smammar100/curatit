import type { ReactNode } from "react";
import BaseLayout from "@/layouts/BaseLayout";

export default function SiteLayout({ children }: { children: ReactNode }) {
  return <BaseLayout>{children}</BaseLayout>;
}
