// Runs before anything below it paints: applies the saved theme, or the system one, by
// setting data-theme on <html>. "light" and "dark" are the stored values; no value means
// follow the system, and keep following it if the OS theme changes while the page is open.
// Inline rather than a module, so there is never a flash of the wrong theme.
const script = `(function(){try{var m=matchMedia("(prefers-color-scheme: dark)"),r=document.documentElement,a=function(){var s=localStorage.getItem("theme");if(s==="dark"||(!s&&m.matches))r.dataset.theme="dark";else delete r.dataset.theme};a();m.addEventListener("change",function(){if(!localStorage.getItem("theme"))a()})}catch(e){}})()`;

export default function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
