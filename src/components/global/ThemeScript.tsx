// Runs before anything below it paints: applies the saved theme, or the system one, by
// setting data-theme on <html>. "light" and "dark" are the stored values; no value means
// follow the system. Inline rather than a module, so there is never a flash of the wrong theme.
const script = `(function(){try{var s=localStorage.getItem("theme");if(s==="dark"||(!s&&matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.dataset.theme="dark"}catch(e){}})()`;

export default function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
