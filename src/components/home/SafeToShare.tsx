// Fundation
import Text from "@/components/fundations/elements/Text";
import Wrapper from "@/components/fundations/containers/Wrapper";

const points = [
  {
    title: "Private by default",
    body: "Boards stay yours until you create a link. Nobody else can find or open them.",
  },
  {
    title: "Links that expire",
    body: "Share links are read-only and expire within 30 days. Making a new link revokes the old one.",
  },
  {
    title: "Your notes stay yours",
    body: "Clients see the posts on a board, not your notes or your workspace.",
  },
  {
    title: "Removed means removed",
    body: "If a brand asks for a post to come down, it leaves search, boards and shared links at once.",
  },
];

export default function SafeToShare() {
  return (
    <section>
      <Wrapper variant="standard" className="py-24">
        <div className="grid gap-12 lg:grid-cols-3">
          <div className="text-balance">
            <Text tag="h2" variant="displaySM" className="text-base-900 font-display font-thin">
              Safe to hand to a client
            </Text>
            <Text tag="p" variant="textBase" className="text-base-600 mt-4">
              Boards are made to leave your team, so sharing is deliberate and temporary.
            </Text>
          </div>
          <dl className="grid gap-x-12 gap-y-8 sm:grid-cols-2 lg:col-span-2">
            {points.map((point) => (
              <div key={point.title} className="border-t border-base-200 pt-4">
                <dt>
                  <Text tag="p" variant="textSM" className="text-base-900 font-medium">
                    {point.title}
                  </Text>
                </dt>
                <dd>
                  <Text tag="p" variant="textSM" className="text-base-600 mt-2">
                    {point.body}
                  </Text>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </Wrapper>
    </section>
  );
}
