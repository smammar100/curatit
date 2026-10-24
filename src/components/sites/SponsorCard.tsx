// Assets
import Image from "next/image";
// Glaze
import { Card, CardContent, CardDescription, CardHeader, CardLink, CardTitle } from "@/components/glaze/ui/card";

// The sponsor slot in the /sites grid, the same Glaze Card as a site's (2026-10-24)
export default function SponsorCard() {
  return (
    <div className="peer transition-opacity duration-(--dur-state) ease-out group-hover:opacity-60 hover:opacity-100 hover:peer-hover:opacity-60">
      <Card>
        <CardContent flush>
          <Image
            width={900}
            height={900}
            src="/images/lex.jpg"
            alt="#_"
            sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
            className="aspect-8/5 w-full bg-field object-cover object-top"
          />
        </CardContent>
        <CardHeader>
          <CardTitle>
            <h3>
              <CardLink href="/pricing">Your sponsor card</CardLink>
            </h3>
          </CardTitle>
          <CardDescription>Become a sponsor</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
