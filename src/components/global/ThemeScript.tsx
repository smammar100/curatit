"use client";

// Runs before anything below it paints: applies the saved theme, or the system one, by
// setting data-theme on <html>. "light" and "dark" are the stored values; no value means
// follow the system, and keep following it if the OS theme changes while the page is open.
// Inline rather than a module, so there is never a flash of the wrong theme.
const script = `(function(){try{var m=matchMedia("(prefers-color-scheme: dark)"),r=document.documentElement,a=function(){var s=localStorage.getItem("theme");if(s==="dark"||(!s&&m.matches))r.dataset.theme="dark";else delete r.dataset.theme};a();m.addEventListener("change",function(){if(!localStorage.getItem("theme"))a()})}catch(e){}})()`;

// A script React renders in the browser (a not-found page or a client navigation re-rendering the
// layout) never runs, and React warns about it in development, so it's text/plain there, as Next's
// guide to preventing a flash before hydration does; the server's copy is the one that runs. A
// client component, so the check runs in the browser too (as a server component it always said
// text/javascript)
export default function ThemeScript() {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: script }}
    />
  );
}
