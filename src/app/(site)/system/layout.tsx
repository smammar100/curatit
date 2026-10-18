import type { ReactNode } from "react";
import "./theme-scopes.css";
import "./system.css";
import Wrapper from "@/components/fundations/containers/Wrapper";
import Text from "@/components/fundations/elements/Text";
import SystemNav from "@/components/system/SystemNav";
import ThemeModeSwitch from "@/components/system/ThemeModeSwitch";
import { SYSTEM_THEME_KEY } from "@/components/system/topics";

// The design system page (2026-10-18, the "Sheets" direction chosen from a three-way prototype):
// one topic per page, each a dense sheet of live specimens in both themes. The saved Light /
// Dark choice is applied before paint, so a sheet never shows both themes first
const restoreMode = `try{var m=localStorage.getItem(${JSON.stringify(SYSTEM_THEME_KEY)});if(m==="light"||m==="dark")document.documentElement.dataset.systemTheme=m}catch(e){}`;

export default function SystemLayout({ children }: { children: ReactNode }) {
  return (
    <section>
      <script dangerouslySetInnerHTML={{ __html: restoreMode }} />
      <Wrapper className="page-start">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <Text tag="h1" variant="displayLG" className="text-primary-foreground">
              Design system
            </Text>
            <Text className="mt-4 text-secondary-foreground">
              Every token and shared component, live, in both themes. Variants run down each sheet,
              sizes and states across.
            </Text>
          </div>
          <ThemeModeSwitch />
        </div>
        <div className="mt-10 shadow-[inset_0_-1px_0_var(--color-border-default)]">
          <SystemNav />
        </div>
        <div className="mt-10">{children}</div>
      </Wrapper>
    </section>
  );
}
