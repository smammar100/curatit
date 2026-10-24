// Fundation
import Text from "@/components/fundations/elements/Text";
import { Button } from "@/components/glaze/ui/button";
import Wrapper from "@/components/fundations/containers/Wrapper";
import { Card, CardContent, CardFooter } from "@/components/glaze/ui/card";
import { DataList, DataListItem, DataListLabel, DataListValue } from "@/components/glaze/ui/data-list";
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

// The advertising packages (the template's page, copy as it was). Since 2026-10-24 each package is
// Glaze's Card: the name, description, price and what's in it (a DataList) on the panel, Get
// started the footer's one small primary Button on the shell.
export default function AdvertisePage() {
  return (
    <section>
      <Wrapper variant="standard" className="page-start">
        <div className="text-center max-w-3xl mx-auto text-balance">
          <Text tag="h1" variant="h1" className="text-text-1 text-center">
            Put your launch in front of the Curatit crowd
          </Text>
          <Text tag="p" variant="body" className="mt-4 text-text-2">
            Reach designers and developers actively looking for production-grade inspiration. Choose
            a package or build a custom campaign.
          </Text>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 mt-12">
          {packages.map((pkg) => (
            <Card key={pkg.name} className="h-full">
              <CardContent className="flex-1 gap-8 p-6">
                <div className="space-y-3">
                  <Text tag="p" variant="h3" className="text-balance text-text-1">
                    {pkg.name}
                  </Text>
                  <Text tag="p" variant="bodySM" className="text-text-2">
                    {pkg.description}
                  </Text>
                </div>
                <Text tag="p" variant="h1" className="text-text-1">
                  {pkg.price}
                </Text>
                <DataList>
                  {pkg.features.map((item) => (
                    <DataListItem key={item.label}>
                      <DataListLabel>{item.label}</DataListLabel>
                      <DataListValue>{item.value}</DataListValue>
                    </DataListItem>
                  ))}
                </DataList>
              </CardContent>
              <CardFooter>
                <Button size="sm">Get started</Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </Wrapper>
    </section>
  );
}
