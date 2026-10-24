import type { Metadata } from "next";
import { Card, CardDescription, CardHeader, CardLink, CardTitle } from "@/components/glaze/ui/card";
import { GROUPS, TOPICS } from "@/components/system/topics";

export const metadata: Metadata = {
  title: "Design system",
  description: "Curatit's tokens and Glaze components, live, in both themes.",
};

// The overview: the system's character in a few lines, then every topic
export default function SystemOverview() {
  return (
    <div className="flex flex-col gap-12">
      <div className="grid gap-4 type-body-sm text-text-2 sm:grid-cols-3">
        <p>
          <strong className="font-medium text-text-1">Ink and paper.</strong> Greys are ink at alphas and the
          posts are the only colour. Colour in the interface means a status.
        </p>
        <p>
          <strong className="font-medium text-text-1">Glass on what you press.</strong> One glass primary leads
          each group; every other action is the flat card surface.
        </p>
        <p>
          <strong className="font-medium text-text-1">Fluid Functionalism underneath.</strong> Its type scale,
          its three motion tiers and its surface ladder, read through Glaze&rsquo;s tokens.
        </p>
      </div>
      {GROUPS.map((group) => (
        <section key={group}>
          <h2 className="type-heading text-text-1">{group}</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {TOPICS.filter((t) => t.group === group).map((t) => (
              <li key={t.slug} className="flex">
                <Card className="w-full">
                  <CardHeader>
                    <CardTitle>
                      <CardLink href={`/system/${t.slug}`}>{t.title}</CardLink>
                    </CardTitle>
                    <CardDescription>{t.blurb}</CardDescription>
                  </CardHeader>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
