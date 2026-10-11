import type { Metadata } from "next";
import ReviewQueue from "@/components/dashboard/review/ReviewQueue";

export const metadata: Metadata = { title: "Analysis review · Curatit" };

// Creative Intelligence's review queue, for editors. A static shell like the rest of the
// dashboard: the queue loads in the browser, through the editor's own session and RLS.
export default function ReviewPage() {
  return <ReviewQueue />;
}
