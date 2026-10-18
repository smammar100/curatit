// Assets
import Image from "next/image";
// Fundation
import Card, { CardMedia, CardMeta, CardTitle } from "@/components/fundations/molecules/Card";

// The words sit under the mat, so the wrapper holds the title's stretched link
export default function SponsorCard() {
  return (
    <div className="relative isolate group-hover:opacity-60 hover:opacity-100 peer hover:peer-hover:opacity-60 transition-opacity duration-150 ease-out-quint group">
      <Card>
        <CardMedia>
          <Image
            width={900}
            height={900}
            src="/images/lex.jpg"
            alt="#_"
            sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
            className="object-top"
          />
        </CardMedia>
      </Card>
      <CardTitle href="/pricing" className="mt-2 capitalize">
        Your sponsor card
      </CardTitle>
      <CardMeta>Become a sponsor</CardMeta>
    </div>
  );
}
