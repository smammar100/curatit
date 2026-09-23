import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
import Wrapper from "@/components/fundations/containers/Wrapper";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
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
    includes: "Includes:",
    features: ["Search and filter the library", "Full post analysis", "Private boards with notes", "Read-only share links"],
    cta: { label: "Create a free account", href: "/signup" },
  },
  {
    name: "Individual",
    price: "$12",
    period: "/month",
    audience: "For freelancers and individual designers.",
    includes: "Everything in Free, plus:",
    features: ["Higher search and board limits", "Priority on new categories", "Email support"],
    cta: { label: "Start with Individual", href: "/signup?next=/pricing" },
    primary: true,
  },
  {
    name: "Design partner",
    price: "From $100",
    period: "/month",
    audience: "For agencies that want founder-supported research.",
    includes: "Everything in Individual, plus:",
    features: ["Research help on live briefs", "Input on categories and taxonomy", "Invoiced monthly"],
    cta: { label: "Talk to us", href: "/signup?next=/pricing" },
  },
];

export default function PricingPage() {
  return (
    <>
      <Wrapper variant="standard">
        <header className="mx-auto flex max-w-2xl flex-col items-center pb-12 pt-28 text-center sm:pt-36">
          <p className="text-[13px] text-muted-foreground" style={{ fontVariationSettings: fontWeights.medium }}>
            Pricing
          </p>
          <h1 className="heading-hero mt-3 text-balance text-foreground">Simple plans while we&rsquo;re in beta</h1>
          <p className="mt-4 max-w-md text-pretty text-[16px] leading-6 text-muted-foreground">
            Start free. Upgrade when Curatit becomes part of how you research briefs.
          </p>
        </header>

        <div className="grid items-stretch gap-4 md:grid-cols-3">
          {plans.map((plan) => (
            <section
              key={plan.name}
              aria-label={plan.name}
              className={cn(
                "flex flex-col rounded-2xl p-6 sm:p-7",
                plan.primary ? "bg-card shadow-surface-6" : "border border-border/60"
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-[16px] text-foreground" style={{ fontVariationSettings: fontWeights.semibold }}>
                  {plan.name}
                </h2>
                {plan.primary && (
                  <Badge variant="dot" color="gray">
                    Recommended
                  </Badge>
                )}
              </div>
              <p className="mt-1 min-h-10 text-[14px] leading-5 text-muted-foreground">{plan.audience}</p>

              <p className="mt-6 flex items-baseline gap-1.5 text-foreground">
                <span className="text-[40px] leading-[44px] tracking-[-0.02em] tabular-nums" style={{ fontVariationSettings: fontWeights.semibold }}>
                  {plan.price}
                </span>
                {plan.period && <span className="text-[14px] text-muted-foreground">{plan.period}</span>}
              </p>

              <Button asChild variant={plan.primary ? "primary" : "secondary"} className="mt-6 w-full">
                <Link href={plan.cta.href}>{plan.cta.label}</Link>
              </Button>

              <p className="mt-8 text-[13px] text-foreground" style={{ fontVariationSettings: fontWeights.medium }}>
                {plan.includes}
              </p>
              <ul className="mt-3 flex flex-col gap-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-[14px] leading-5 text-foreground">
                    <Check aria-hidden="true" size={16} strokeWidth={2} className="mt-0.5 shrink-0 text-foreground" />
                    {feature}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <p className="mt-8 text-center text-[13px] text-muted-foreground">
          Team workspaces with shared boards are planned. We&rsquo;ll offer them once collaboration ships, not before.
        </p>
      </Wrapper>
      <Faq />
    </>
  );
}
