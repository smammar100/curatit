"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Button from "@/components/fundations/elements/Button";
import Check from "@/components/fundations/icons/Check";
import Copy from "@/components/fundations/icons/Copy";
import { Footer, Heading, linkClass } from "@/components/auth/AuthForms";

// /code: where an email's Copy code button lands (src/emails/_components/layout.tsx, Code). No
// inbox runs scripts, so the copying happens here. The code comes in the address's #fragment,
// which browsers never send to a server, and is taken out of the address (and so out of the
// history) as soon as it's read. It tries to copy straight away; browsers that want a tap first
// get the button.
export function CodeCopy() {
  const [code, setCode] = useState<string | null | undefined>(undefined);
  const [copied, setCopied] = useState(false);
  const read = useRef(false);

  const copy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
    } catch {
      // Blocked until a tap: the button is there, and the code is selectable
    }
  };

  useEffect(() => {
    // Once only: the address loses the code below, so a second run would find nothing
    if (read.current) return;
    read.current = true;
    const value = decodeURIComponent(location.hash.slice(1)).trim();
    const valid = /^[0-9A-Za-z]{4,12}$/.test(value) ? value : null;
    setCode(valid);
    if (location.hash) history.replaceState(null, "", location.pathname);
    if (valid) void copy(valid);
  }, []);

  if (code === null) {
    return (
      <>
        <Heading title="There's no code here">
          Open Copy code from the email again, or type the code from the email into Curatit.
        </Heading>
        <Footer>
          <Link href="/" className={linkClass}>
            Go to Curatit
          </Link>
        </Footer>
      </>
    );
  }

  return (
    <>
      <Heading title={copied ? "Code copied" : "Your verification code"}>
        Paste it in the Curatit tab that asked for it. It works for 1 hour.
      </Heading>
      <p className="mx-auto mt-6 w-fit rounded-lg bg-component px-4 py-2.5 font-mono text-[24px] leading-8 tracking-[0.2em] text-primary-foreground tabular-nums select-all">
        {code ?? " "}
      </p>
      <Button
        size="base"
        variant="default"
        type="button"
        disabled={!code}
        onClick={() => code && copy(code)}
        className="mt-6 w-full gap-2 disabled:opacity-70"
      >
        {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
        {copied ? "Copied" : "Copy code"}
      </Button>
      <span role="status" className="sr-only">
        {copied ? "Code copied" : ""}
      </span>
      <Footer>Didn&apos;t ask for a code? Ignore it and nothing changes.</Footer>
    </>
  );
}
