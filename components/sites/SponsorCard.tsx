import Image from "next/image";
import Link from "next/link";
import Text from "@/components/fundations/elements/Text";

export default function SponsorCard() {
  return (
    <div className="group-hover:opacity-30 hover:opacity-100 peer hover:peer-hover:opacity-30 duration-300 group">
      <div className="relative p-8 bg-base-50 rounded-lg">
        <Image
          width={900}
          height={900}
          src="/images/lex.jpg"
          alt="Sponsor placeholder"
          className="object-cover aspect-8/5 w-full object-top rounded-lg outline outline-base-100 shadow"
        />
        <Link href="/pricing" title="Become a sponsor">
          <span className="absolute inset-0" />
        </Link>
      </div>
      <div className="pt-2">
        <Text tag="h3" variant="textSM" className="text-base-600 capitalize">
          Your sponsor card
        </Text>
        <Text tag="p" variant="textXS" className="text-base-600">
          Become a sponsor
        </Text>
      </div>
    </div>
  );
}
