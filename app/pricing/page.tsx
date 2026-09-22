import type { Metadata } from "next";
import Text from "@/components/fundations/elements/Text";
import Button from "@/components/fundations/elements/Button";
import Wrapper from "@/components/fundations/containers/Wrapper";
import Faq from "@/components/global/Faq";

export const metadata: Metadata = {
  title: "Membership",
  description: "Choose a plan to unlock deeper filtering, unlimited saves, and pro tools.",
};

const plans = [
  {
    name: "Free",
    description: "Get limited access to everything.",
    priceStatic: "$0",
    features: [
      { label: "Bookmarks", value: "Save up to 5 favorites" },
      { label: "Filters", value: "Basic filters for quick scans" },
      { label: "Email", value: "Weekly inspiration roundup" },
      { label: "Support", value: "Community help" },
    ],
  },
  {
    name: "Team",
    description: "Get limited access to everything.",
    priceMonthly: "$9",
    priceAnnual: "$6",
    features: [
      { label: "Bookmarks & collections", value: "Unlimited for teams" },
      { label: "Filters & tags", value: "Advanced + saved searches" },
      { label: "Workspace", value: "Shared lists for teammates" },
      { label: "Exports", value: "CSV / Notion ready" },
      { label: "Support", value: "Priority replies" },
    ],
  },
] as const;

export default function PricingPage() {
  return (
    <>
      <section>
        <Wrapper variant="standard" className="py-24 lg:pt-48">
          <div className="text-balance max-w-3xl mx-auto text-center">
            <Text tag="h1" variant="displayLG" className="text-base-900 font-display font-light">
              <span className="block">Access the full library.</span>
              <span className="block">Use it like a pro.</span>
            </Text>
            <Text tag="p" variant="textBase" className="text-base-600 mt-4">
              Choose a plan to unlock deeper filtering, unlimited saves, and tools built for
              designers who study real production websites—not theory.
            </Text>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 mt-12">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className="flex flex-col h-full justify-between bg-base-50 rounded-lg p-8"
              >
                <div className="flex flex-col gap-8">
                  <div className="space-y-3">
                    <Text
                      tag="p"
                      variant="displaySM"
                      className="text-base-900 text-balance font-display font-light"
                    >
                      {plan.name}
                    </Text>
                    <Text tag="p" variant="textSM" className="text-base-600">
                      {plan.description}
                    </Text>
                  </div>
                  <div>
                    {"priceStatic" in plan ? (
                      <Text
                        tag="p"
                        variant="displayLG"
                        className="text-base-900 font-display font-light"
                      >
                        {plan.priceStatic}
                      </Text>
                    ) : (
                      <Text tag="p" variant="displayLG" className="text-base-900">
                        <span className="tracking-tighter font-display font-light">
                          {plan.priceMonthly ?? plan.priceAnnual ?? ""}
                        </span>
                        {plan.priceMonthly && (
                          <span className="text-lg ml-1 text-base-700">/month</span>
                        )}
                      </Text>
                    )}
                  </div>
                  <ul className="divide-y divide-base-200 mt-4">
                    {plan.features.map((item) => (
                      <li
                        key={item.label}
                        className="flex items-center justify-between py-3 text-base-800"
                      >
                        <Text tag="span" variant="textBase" className="text-base-800">
                          {item.label}
                        </Text>
                        <Text tag="span" variant="textSM" className="text-base-500">
                          {item.value}
                        </Text>
                      </li>
                    ))}
                  </ul>
                </div>
                <Button size="base" variant="default" type="submit" className="w-fit mt-8">
                  Get started
                </Button>
              </div>
            ))}
          </div>
        </Wrapper>
      </section>
      <Faq />
    </>
  );
}
