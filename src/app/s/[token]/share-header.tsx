import Link from "next/link";
// Assets
import Lockup from "@/components/assets/Lockup";
// Glaze
import { Button } from "@/components/glaze/ui/button";

// The share page's bar: the lockup home, and Make your own board. Shared by the board and by the
// page a link that no longer opens one shows
export default function ShareHeader() {
  return (
    <header className="flex h-20 items-center justify-between gap-4 px-4 sm:px-6">
      <Link href="/" aria-label="Curatit home" className="rounded-tag text-text-1">
        <Lockup />
      </Link>
      <Button size="sm" render={<Link href="/signup" />} nativeButton={false}>
        Make your own board
      </Button>
    </header>
  );
}
