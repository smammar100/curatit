import type { Metadata } from "next";
import Link from "next/link";
import Text from "@/components/fundations/elements/Text";
import { TOPICS } from "@/components/system/topics";

export const metadata: Metadata = {
  title: "Design system",
  description: "Curatit's tokens and shared components, live, in both themes.",
};

// The overview: the system's character in a few lines, then every topic
export default function SystemOverview() {
  const groups = ["Foundations", "Components"] as const;
  return (
    <div className="flex flex-col gap-16">
      <div className="grid max-w-4xl gap-4 text-body-base text-secondary-foreground sm:grid-cols-3">
        <p>
          <strong className="font-medium text-primary-foreground">Gallery calm.</strong> The posts are the
          colour. Everything around them is neutral grey and quiet.
        </p>
        <p>
          <strong className="font-medium text-primary-foreground">Serif headings, Inter for the rest.</strong>{" "}
          Hedvig Letters Serif in its one regular weight; never bold.
        </p>
        <p>
          <strong className="font-medium text-primary-foreground">Colour is an event.</strong> Terracotta only
          on hovers, focus rings, links and the accent button.
        </p>
      </div>
      {groups.map((group) => (
        <section key={group}>
          <Text tag="h2" variant="h5" className="text-primary-foreground">
            {group}
          </Text>
          <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {TOPICS.filter((t) => t.group === group).map((t) => (
              <li key={t.slug}>
                <Link
                  href={`/system/${t.slug}`}
                  className="group flex h-full flex-col rounded-2xl bg-card p-5 transition-colors duration-150 ease-out-quint hover:bg-component focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-border-focus"
                >
                  <span className="text-body-sm font-medium text-primary-foreground">{t.title}</span>
                  <span className="mt-1 text-body-sm text-secondary-foreground">{t.blurb}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
