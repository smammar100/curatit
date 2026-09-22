import type { Metadata } from "next";
import Text from "@/components/fundations/elements/Text";
import Button from "@/components/fundations/elements/Button";
import Wrapper from "@/components/fundations/containers/Wrapper";
import Faq from "@/components/global/Faq";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Plans for designers, strategists, and agencies researching real brand campaigns.",
};

/**
 * Test prices from the build plan's pricing experiment. They are hypotheses to
 * validate with real offers, not settled pricing — update them in one place here.
 */
const plans = [
  {
    name: "Free",
    price: "$0",
    period: "",
    audience: "Evaluate the library.",
    features: ["Search and filter the library", "Full post analysis", "Private boards with notes", "Read-only share links"],
    cta: { label: "Create a free account", href: "/signup", variant: "muted" as const },
  },
  {
    name: "Individual",
    price: "$12",
    period: "/month",
    audience: "For freelancers and individual designers.",
    features: ["Everything in Free", "Higher search and board limits", "Priority on new categories", "Email support"],
    cta: { label: "Start with Individual", href: "/signup?next=/pricing", variant: "accent" as const },
    highlight: true,
  },
  {
    name: "Design partner",
    price: "From $100",
    period: "/month",
    audience: "For agencies that want founder-supported research.",
    features: ["Everything in Individual", "Research help on live briefs", "Input on categories and taxonomy", "Invoiced monthly"],
    cta: { label: "Talk to us", href: "/signup?next=/pricing", variant: "default" as const },
  },
];

export default function PricingPage() {
  return (
    <>
      <section>
        <Wrapper variant="standard" className="py-24 lg:pt-48">
          <div className="text-balance max-w-3xl mx-auto text-center">
            <Text tag="h1" variant="displayLG" className="text-base-900 font-display font-light">
              Simple plans while we&rsquo;re in beta
            </Text>
            <Text tag="p" variant="textBase" className="text-base-600 mt-4">
              Start free. Upgrade when Curatit becomes part of how you research briefs.
            </Text>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3 mt-12">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`flex flex-col justify-between rounded-lg p-8 ${plan.highlight ? "bg-base-900 text-white" : "bg-base-50"}`}
              >
                <div>
                  <p className={`font-display text-2xl ${plan.highlight ? "text-white" : "text-base-900"}`}>{plan.name}</p>
                  <p className={`mt-2 text-sm ${plan.highlight ? "text-base-300" : "text-base-600"}`}>{plan.audience}</p>
                  <p className="mt-8">
                    <span className="font-display text-4xl lg:text-5xl font-light">{plan.price}</span>
                    {plan.period && <span className={`ml-1 ${plan.highlight ? "text-base-300" : "text-base-600"}`}>{plan.period}</span>}
                  </p>
                  <ul className={`mt-8 divide-y ${plan.highlight ? "divide-base-700" : "divide-base-200"}`}>
                    {plan.features.map((feature) => (
                      <li key={feature} className={`py-3 text-sm ${plan.highlight ? "text-base-100" : "text-base-800"}`}>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
                <Button isLink href={plan.cta.href} size="base" variant={plan.cta.variant} className="mt-8 w-full">
                  {plan.cta.label}
                </Button>
              </div>
            ))}
          </div>

          <p className="mt-6 text-center text-xs text-base-500">
            Team workspaces with shared boards are planned. We&rsquo;ll offer them once collaboration ships — not before.
          </p>
        </Wrapper>
      </section>
      <Faq />
    </>
  );
}
