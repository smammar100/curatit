"use client";

import { useEffect, useRef, useState } from "react";
import TextLink from "@/components/fundations/elements/TextLink";
import { Button } from "@/components/glaze/ui/button";
import { Check, Copy, Icon } from "@/components/glaze/icon";
import { Footer, Heading } from "@/components/auth/AuthForms";

// /code: where an email's Copy code button lands (src/emails/_components/layout.tsx, Code). No
// inbox runs scripts, so the copying happens here. The code comes in the address's #fragment,
// which browsers never send to a server, and is taken out of the address (and so out of the
// history) as soon as it's read. It tries to copy straight away; browsers that want a tap first
// get the button. Glaze's: the code on the grey field in mono, the card's one primary Button.
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
          <TextLink href="/">Go to Curatit</TextLink>
        </Footer>
      </>
    );
  }

  return (
    <>
      <Heading title={copied ? "Code copied" : "Your verification code"}>
        Paste it in the Curatit tab that asked for it. It works for 1 hour.
      </Heading>
      <p className="mx-auto mt-6 w-fit rounded-panel bg-field px-4 py-2.5 type-title text-text-1 tabular-nums select-all">
        <span className="mono">{code ?? " "}</span>
      </p>
      <Button type="button" disabled={!code} onClick={() => code && copy(code)} className="mt-6 w-full">
        <Icon icon={copied ? Check : Copy} />
        {copied ? "Copied" : "Copy code"}
      </Button>
      <span role="status" className="sr-only">
        {copied ? "Code copied" : ""}
      </span>
      <Footer>Didn&apos;t ask for a code? Ignore it and nothing changes.</Footer>
    </>
  );
}
