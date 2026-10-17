"use client";

// Cloudflare Turnstile in the auth forms (2026-10-18). Off, and nothing loads, until
// NEXT_PUBLIC_TURNSTILE_SITE_KEY is set; then Cloudflare's script loads with the form and the
// widget stays invisible unless Cloudflare wants the visitor to tick a box. It writes its token
// into a hidden cf-turnstile-response field, which the server actions pass to Supabase
// (captchaToken() in src/lib/auth-guard.ts), so Supabase's Attack Protection → CAPTCHA does the
// checking, and a script calling Supabase Auth directly is stopped too. A token works once, so
// the widget resets after every submit (`resetOn` changes with the form's state).
import { useEffect, useRef } from "react";

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

type Turnstile = {
  render(element: HTMLElement, options: Record<string, unknown>): string;
  reset(id: string): void;
  remove(id: string): void;
};
declare global {
  interface Window {
    turnstile?: Turnstile;
  }
}

let loading: Promise<void> | null = null;
function loadTurnstile() {
  if (window.turnstile) return Promise.resolve();
  loading ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      loading = null;
      reject(new Error("Turnstile didn't load"));
    };
    document.head.appendChild(script);
  });
  return loading;
}

export default function Captcha({ resetOn }: { resetOn?: unknown }) {
  const box = useRef<HTMLDivElement>(null);
  const widget = useRef<string | null>(null);

  useEffect(() => {
    if (!SITE_KEY) return;
    let gone = false;
    loadTurnstile()
      .then(() => {
        if (gone || !box.current || !window.turnstile) return;
        widget.current = window.turnstile.render(box.current, {
          sitekey: SITE_KEY,
          appearance: "interaction-only",
          size: "flexible",
          theme: document.documentElement.dataset.theme === "dark" ? "dark" : "light",
        });
      })
      // Without the script the form still submits; Supabase refuses it only if CAPTCHA is on
      .catch(() => {});
    return () => {
      gone = true;
      if (widget.current) window.turnstile?.remove(widget.current);
      widget.current = null;
    };
  }, []);

  useEffect(() => {
    if (widget.current) window.turnstile?.reset(widget.current);
  }, [resetOn]);

  if (!SITE_KEY) return null;
  return <div ref={box} className="empty:hidden" />;
}
