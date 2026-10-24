import type { ReactNode } from "react";
import "./theme-scopes.css";
import "./system.css";
import Wrapper from "@/components/fundations/containers/Wrapper";
import Text from "@/components/fundations/elements/Text";
import SystemNav from "@/components/system/SystemNav";
import ThemeModeSwitch from "@/components/system/ThemeModeSwitch";
import { SYSTEM_THEME_KEY } from "@/components/system/topics";

// The design system page (the "Sheets" direction, 2026-10-18; rebuilt for Glaze on 2026-10-24):
// one topic per page, each a sheet of live specimens in both themes. The saved Light / Dark choice
// is applied before paint, so a sheet never shows both themes first
const restoreMode = `try{var m=localStorage.getItem(${JSON.stringify(SYSTEM_THEME_KEY)});if(m==="light"||m==="dark")document.documentElement.dataset.systemTheme=m}catch(e){}`;

export default function SystemLayout({ children }: { children: ReactNode }) {
  return (
    <section>
      <script dangerouslySetInnerHTML={{ __html: restoreMode }} />
      <Wrapper className="page-start">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <Text tag="h1" variant="h1" className="text-text-1">
              Design system
            </Text>
            <p className="mt-4 type-body text-text-2">
              Glaze&rsquo;s components with Fluid Functionalism&rsquo;s type, motion and surfaces, live, in both
              themes. Variants run down each sheet, sizes and states across.
            </p>
          </div>
          <ThemeModeSwitch />
        </div>
        {/* Below lg the topics are one row that scrolls sideways; from lg a sticky sidebar */}
        <div className="mt-8 border-b border-line-faint lg:hidden">
          <SystemNav layout="row" />
        </div>
        <div className="mt-8 lg:mt-12 lg:flex lg:gap-12">
          <aside className="hidden w-44 shrink-0 lg:block">
            <div className="sticky top-28 max-h-[calc(100dvh-var(--space-10)*3)] overflow-y-auto pb-8 [scrollbar-width:none]">
              <SystemNav layout="sidebar" />
            </div>
          </aside>
          <div className="min-w-0 flex-1">{children}</div>
        </div>
      </Wrapper>
    </section>
  );
}
