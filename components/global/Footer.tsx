import Link from "next/link";
import Logo from "@/components/assets/Logo";
import Wrapper from "@/components/fundations/containers/Wrapper";

const columns = [
  {
    title: "Product",
    links: [
      { href: "/library", text: "Library" },
      { href: "/boards", text: "Boards" },
      { href: "/pricing", text: "Pricing" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", text: "About" },
      { href: "/blog", text: "Journal" },
    ],
  },
  {
    title: "Trust",
    links: [
      { href: "/legal/removal", text: "Request content removal" },
      { href: "/legal/privacy", text: "Privacy" },
      { href: "/legal/terms", text: "Terms" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="bg-base-50 overflow-hidden">
      <Wrapper className="py-20">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-[2fr_1fr_1fr_1fr]">
          <div className="col-span-2 md:col-span-1 max-w-xs">
            <Logo className="text-3xl text-base-900" />
            <p className="mt-3 text-sm text-base-600">
              Curated organic brand posts, analysed and searchable — for teams researching real campaigns.
            </p>
          </div>
          {columns.map((column) => (
            <div key={column.title}>
              <p className="text-xs font-medium uppercase tracking-wide text-base-500">{column.title}</p>
              <ul className="mt-3 space-y-2">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-base-700 hover:text-accent-600">
                      {link.text}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-16 text-xs text-base-500">
          Posts belong to the brands that published them and are shown for research with attribution.
        </p>
      </Wrapper>
      <div aria-hidden="true" className="select-none font-display leading-[0.8] text-base-100 text-[26vw] -mb-[4vw] px-4">
        Curatit
      </div>
    </footer>
  );
}
