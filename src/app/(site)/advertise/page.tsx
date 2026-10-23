// Fundation
import Text from "@/components/fundations/elements/Text";
import Button from "@/components/fundations/elements/Button";
import Wrapper from "@/components/fundations/containers/Wrapper";
import Card from "@/components/fundations/molecules/Card";
// Data
const packages = [
  {
    name: "Website feature",
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
    name: "Newsletter ad",
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

// The advertising packages (the template's page, copy as it was). Since 2026-10-23 each package
// is the system's Card on the grey mat, its rows divided by the one stroke, the words on the
// tokens, and Get started the primary Button it already was.
export default function AdvertisePage() {
  return (
    <section>
      <Wrapper variant="standard" className="page-start">
        <div className="text-center max-w-3xl mx-auto text-balance">
          <Text tag="h1" variant="h1" className="text-foreground text-center">
            Put your launch in front of the Curatit crowd
          </Text>
          <Text tag="p" variant="body" className="text-muted-foreground mt-4">
            Reach designers and developers actively looking for production-grade inspiration. Choose
            a package or build a custom campaign.
          </Text>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 mt-12">
          {packages.map((pkg) => (
            <Card key={pkg.name} variant="mat" padding="lg" className="flex h-full flex-col justify-between">
              <div className="flex flex-col gap-8">
                <div className="space-y-3">
                  <Text tag="p" variant="h3" className="text-foreground text-balance">
                    {pkg.name}
                  </Text>
                  <Text tag="p" variant="bodySM" className="text-muted-foreground">
                    {pkg.description}
                  </Text>
                </div>
                <div>
                  <Text tag="p" variant="h1" className="text-foreground">
                    {pkg.price}
                  </Text>
                </div>
                <ul className="divide-y divide-border mt-4">
                  {pkg.features.map((item) => (
                    <li key={item.label} className="flex items-center justify-between py-3 text-foreground">
                      <Text tag="span" variant="body" className="text-foreground">
                        {item.label}
                      </Text>
                      <Text tag="span" variant="bodySM" className="text-muted-foreground">
                        {item.value}
                      </Text>
                    </li>
                  ))}
                </ul>
              </div>
              <Button size="base" variant="default" className="w-fit mt-8">
                Get started
              </Button>
            </Card>
          ))}
        </div>
      </Wrapper>
    </section>
  );
}
