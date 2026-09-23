import Link from "next/link";
import Wrapper from "@/components/fundations/containers/Wrapper";
import { Button } from "@/components/ui/button";
import SiteLayout from "./(site)/layout";

export default function NotFound() {
  return (
    <SiteLayout>
      <Wrapper variant="standard" className="flex min-h-[70svh] flex-col items-center justify-center pt-24 pb-24 text-center">
        <p className="text-[12px] tabular-nums text-muted-foreground">Error 404</p>
        <h1 className="heading-display mt-2 text-foreground">Page not found</h1>
        <p className="mt-2 max-w-sm text-[14px] leading-6 text-muted-foreground">
          This page doesn&rsquo;t exist. It may have been removed, renamed, or is temporarily unavailable.
        </p>
        <Button asChild className="mt-6">
          <Link href="/" title="Go back home">
            Go back home
          </Link>
        </Button>
      </Wrapper>
    </SiteLayout>
  );
}
