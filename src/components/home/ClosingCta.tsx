// Fundation
import Text from "@/components/fundations/elements/Text";
import Button from "@/components/fundations/elements/Button";
import Wrapper from "@/components/fundations/containers/Wrapper";
// Components
import LogoReel from "./LogoReel";
import { brands, type Brand } from "./demo";
import { cx } from "@/lib/cx";

// Stand-in app icons from the demo brands. Replace with real brand logos by passing
// <Image fill /> elements (or any node that fills its box) to the reels.
function BrandTile({ brand }: { brand: Brand }) {
  return (
    <div
      aria-hidden="true"
      className={cx(
        "flex size-full items-center justify-center text-[44px] leading-none",
        brand.serif ? "font-display" : "font-sans font-extrabold tracking-[-0.04em]"
      )}
      style={{ backgroundColor: brand.bg, color: brand.fg }}
    >
      {brand.name[0]}
    </div>
  );
}

const tiles = Object.values(brands).map((brand) => <BrandTile key={brand.name} brand={brand} />);
const left = tiles.filter((_, i) => i % 2 === 0);
const right = tiles.filter((_, i) => i % 2 === 1);

export default function ClosingCta() {
  return (
    <section className="overflow-hidden bg-white">
      <Wrapper variant="standard" className="py-20">
        <div className="flex flex-col items-center gap-12 lg:flex-row lg:justify-center lg:gap-16 xl:gap-24">
          <LogoReel items={left} orientation="horizontal" near="end" className="lg:hidden" />
          <LogoReel items={left} orientation="vertical" near="end" className="hidden lg:block" />
          <div className="text-balance max-w-2xl text-center">
            <Text tag="h2" variant="displayLG" className="font-display font-light">
              <span className="block text-base-500">Building for a brand?</span>
              <span className="block text-base-900">Start with your next brief.</span>
            </Text>
            <Text tag="p" variant="textBase" className="text-base-600 mt-4 max-w-xl mx-auto">
              Search the library, save what&apos;s worth adapting, and send your client a board they can
              open in one click.
            </Text>
            <div className="flex flex-wrap justify-center gap-2 mt-8">
              <Button isLink size="base" variant="default" href="/signup">
                Get access
              </Button>
              <Button isLink size="base" variant="muted" href="/pricing">
                See pricing
              </Button>
            </div>
          </div>
          <LogoReel items={right} orientation="vertical" near="start" phase={900} className="hidden lg:block" />
          <LogoReel items={right} orientation="horizontal" near="start" phase={900} className="lg:hidden" />
        </div>
      </Wrapper>
    </section>
  );
}
