// Assets
import Image from "next/image";
import Link from "next/link";
// Fundation
import Text from "@/components/fundations/elements/Text";

export default function SponsorCard() {
  return (
    <div className="group-hover:opacity-60 hover:opacity-100 peer hover:peer-hover:opacity-60 transition-opacity duration-150 ease-out-quint group">
      <div className="relative p-8 bg-base-50 rounded-lg">
        <Image
          width={900}
          height={900}
          src="/images/lex.jpg"
          alt="#_"
          sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
          className="object-cover aspect-8/5 w-full object-top rounded-lg outline outline-base-100 shadow"
        />
        <Link href="/pricing" title="#_">
          <span className="absolute inset-0"></span>
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
