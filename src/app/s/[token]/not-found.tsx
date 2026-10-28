import Link from "next/link";
// Fundations
import Text from "@/components/fundations/elements/Text";
// Glaze
import { Button } from "@/components/glaze/ui/button";
import BaseLayout from "@/layouts/BaseLayout";
import ShareHeader from "./share-header";

// A share link that doesn't open a board: its owner turned sharing off (which kills that link for
// good) or the address isn't complete. Said in the share page's own frame rather than the site's
// 404, so whoever was sent it knows the board went private (2026-10-28, from a QA run)
export default function SharedBoardNotFound() {
  return (
    <BaseLayout hideNavigation hideFooter>
      <div className="min-h-dvh bg-page">
        <ShareHeader />
        <main className="px-4 pb-24 sm:px-6">
          <div className="mx-auto max-w-xl pt-6 text-center">
            <Text tag="h1" variant="h1" className="text-balance text-text-1">
              This board isn&apos;t shared
            </Text>
            <Text className="mt-4 text-pretty text-text-2">
              Its owner may have stopped sharing it, or the link isn&apos;t complete. Ask them for a new link.
            </Text>
            <div className="mt-8 flex justify-center">
              <Button render={<Link href="/" />} nativeButton={false}>
                See what Curatit is
              </Button>
            </div>
          </div>
        </main>
      </div>
    </BaseLayout>
  );
}
