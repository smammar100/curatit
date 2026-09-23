import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
import Wrapper from "@/components/fundations/containers/Wrapper";
import PageHeader from "@/components/fundations/containers/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardGroup, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { fontWeights } from "@/lib/font-weight";
import Faq from "@/components/global/Faq";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Plans for designers, strategists, and agencies researching real brand campaigns.",
};

/**
 * Test prices from the build plan's pricing experiment. They are hypotheses to
 * validate with real offers, not settled pricing. Update them in one place here.
 * `primary` marks the one plan whose button is the page's primary action.
 */
const plans = [
  {
    name: "Free",
    price: "$0",
    period: "",
    audience: "Evaluate the library.",
    features: ["Search and filter the library", "Full post analysis", "Private boards with notes", "Read-only share links"],
    cta: { label: "Create a free account", href: "/signup" },
  },
  {
    name: "Individual",
    price: "$12",
    period: "/month",
    audience: "For freelancers and individual designers.",
    features: ["Everything in Free", "Higher search and board limits", "Priority on new categories", "Email support"],
    cta: { label: "Start with Individual", href: "/signup?next=/pricing" },
    primary: true,
  },
  {
    name: "Design partner",
    price: "From $100",
    period: "/month",
    audience: "For agencies that want founder-supported research.",
    features: ["Everything in Individual", "Research help on live briefs", "Input on categories and taxonomy", "Invoiced monthly"],
    cta: { label: "Talk to us", href: "/signup?next=/pricing" },
  },
];

export default function PricingPage() {
  return (
    <>
      <Wrapper variant="standard">
        <PageHeader
          title="Simple plans while we’re in beta"
          description="Start free. Upgrade when Curatit becomes part of how you research briefs."
        />

        {/* CardGroup needs a fixed column count; below md the tiles stack. */}
        <CardGroup columns={3} separated border="outlined" className="gap-4 max-md:grid-cols-1!">
          {plans.map((plan) => (
            <Card key={plan.name}>
              <CardHeader>
                <CardTitle className="text-[16px]!">{plan.name}</CardTitle>
                <CardDescription className="min-h-10 text-[13px]! leading-5">{plan.audience}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="flex items-baseline gap-1 text-foreground">
                  <span className="text-[28px] leading-8 tabular-nums" style={{ fontVariationSettings: fontWeights.semibold }}>
                    {plan.price}
                  </span>
                  {plan.period && <span className="text-[13px] text-muted-foreground">{plan.period}</span>}
                </p>
                <ul className="mt-6 flex flex-col gap-2.5 border-t border-border/60 pt-4">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-[13px] leading-5 text-foreground">
                      <Check aria-hidden="true" size={16} strokeWidth={1.5} className="mt-0.5 shrink-0 text-muted-foreground" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="mt-auto pt-6">
                <Button asChild variant={plan.primary ? "primary" : "tertiary"} className="w-full">
                  <Link href={plan.cta.href}>{plan.cta.label}</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </CardGroup>

        <p className="mt-6 text-center text-[12px] text-muted-foreground">
          Team workspaces with shared boards are planned. We&rsquo;ll offer them once collaboration ships, not before.
        </p>
      </Wrapper>
      <Faq />
    </>
  );
}
