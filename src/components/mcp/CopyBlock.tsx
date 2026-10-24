"use client";

// A configuration snippet with a copy button: the one piece of script on the connect page.
//
// Since 2026-10-24 it is Glaze's CodeBlock: the code surface (paper with the panel's hairline on the
// overlay corner), the block's own mono at 12px, and its ghost copy button, which cuts to a check
// and says "Copied" once in a status region. A single shell command is the command variant (the
// prompt shown, never copied); a file or a multi-line call is a block without a header, so copy
// floats at its top end. `tone` is kept for the call sites that pass it: "light" (the MCP landing
// page's install card, where a narrow card would hide most of a command) starts wrapped, "dark"
// scrolls sideways. Glaze has one code surface, so neither inverts any more.

import { CodeBlock, type Language } from "@/components/glaze/ui/code-block";

// What the tokenizer reads the snippet as: JSON for a configuration file, the shell for a command
function languageOf(code: string): Language {
  const start = code.trimStart();
  if (start.startsWith("{") || start.startsWith("[")) return "json";
  if (/^(curl|claude|npx|npm|node)\s/.test(start)) return "bash";
  return "text";
}

export default function CopyBlock({ code, label, tone = "dark" }: { code: string; label: string; tone?: "dark" | "light" }) {
  const language = languageOf(code);
  // One line of shell: the command variant, with its prompt kept out of the copy
  if (language === "bash" && !code.includes("\n")) {
    return <CodeBlock variant="command" code={`$ ${code}`} copyLabel={`Copy ${label}`} />;
  }
  return <CodeBlock code={code} language={language} header={false} defaultWrap={tone === "light"} copyLabel={`Copy ${label}`} />;
}
