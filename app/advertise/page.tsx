import type { Metadata } from "next";
import Text from "@/components/fundations/elements/Text";
import Button from "@/components/fundations/elements/Button";
import Wrapper from "@/components/fundations/containers/Wrapper";

export const metadata: Metadata = {
  title: "Advertise",
  description: "Put your launch in front of the Curatit crowd.",
};

const packages = [
  {
    name: "Website Feature",
    price: "$999",
    features: [
      { label: "Homepage placement", value: "7 days live" },
      { label: "Newsletter highlight", value: "1x weekly send" },
      { label: "Social push", value: "1x on X + LinkedIn" },
    ],
    description:
      "A bespoke write-up on Curatit that shows your product in context. Great for launches that need instant credibility.",
  },
  {
    name: "Newsletter Ad",
    price: "$1,299",
    features: [
      { label: "Audience", value: "7,800+ subscribers" },
      { label: "Send cadence", value: "2 consecutive issues" },
      { label: "Creative", value: "We help refine your copy" },
    ],
    description:
      "Secure ad space in our weekly newsletter. Reach a curated audience of designers and builders looking for production tools.",
  },
];

export default function AdvertisePage() {
  return (
    <section>
      <Wrapper variant="standard" className="py-24 lg:pt-48">
        <div className="text-center max-w-3xl mx-auto text-balance">
          <Text
            tag="h1"
            variant="displayLG"
            className="text-base-900 font-display font-thin text-center"
          >
            Put your launch in front of the Curatit crowd
          </Text>
          <Text tag="p" variant="textBase" className="text-base-600 mt-4">
            Reach designers and developers actively looking for production-grade inspiration.
            Choose a package or build a custom campaign.
          </Text>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 mt-12">
          {packages.map((pkg) => (
            <div
              key={pkg.name}
              className="flex flex-col h-full justify-between bg-base-50 rounded-lg p-8"
            >
              <div className="flex flex-col gap-8">
                <div className="space-y-3">
                  <Text
                    tag="p"
                    variant="displaySM"
                    className="text-base-900 text-balance font-display font-light"
                  >
                    {pkg.name}
                  </Text>
                  <Text tag="p" variant="textSM" className="text-base-600">
                    {pkg.description}
                  </Text>
                </div>
                <div>
                  <Text
                    tag="p"
                    variant="displayLG"
                    className="text-base-900 font-display font-light"
                  >
                    {pkg.price}
                  </Text>
                </div>
                <ul className="divide-y divide-base-200 mt-4">
                  {pkg.features.map((item) => (
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
  );
}
