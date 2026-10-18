"use client";

// The design system's tab row: Overview, then the foundations and the components, each a page
// of its own. A link row (navigation between pages), not ARIA tabs.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment } from "react";
import { TOPICS } from "./topics";
import { cx } from "@/lib/cx";

const LINKS = [{ slug: "", title: "Overview", group: "" }, ...TOPICS];

export default function SystemNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Design system" className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] sm:-mx-8 sm:px-8">
      <ul className="flex min-w-max items-center gap-5">
        {LINKS.map((link, i) => {
          const href = link.slug ? `/system/${link.slug}` : "/system";
          const current = pathname === href;
          const newGroup = i > 0 && link.group !== LINKS[i - 1].group;
          return (
            <Fragment key={href}>
              {newGroup && <li aria-hidden className="h-4 w-px bg-border-strong" />}
              <li>
                <Link
                  href={href}
                  aria-current={current ? "page" : undefined}
                  className={cx(
                    "relative flex h-11 items-center text-body-sm font-medium whitespace-nowrap transition-colors duration-150 ease-out-quint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-border-focus",
                    current
                      ? "text-primary-foreground shadow-[inset_0_-2px_0_currentColor]"
                      : "text-secondary-foreground hover:text-primary-foreground",
                  )}
                >
                  {link.title}
                </Link>
              </li>
            </Fragment>
          );
        })}
      </ul>
    </nav>
  );
}
