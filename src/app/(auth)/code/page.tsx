import type { Metadata } from "next";
import { CodeCopy } from "@/components/auth/CodeCopy";

export const metadata: Metadata = { title: "Copy code", robots: { index: false } };

// Where the verification email's Copy code button lands: shows the code and copies it
export default function CodePage() {
  return <CodeCopy />;
}
