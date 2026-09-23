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
    <footer className="overflow-hidden border-t border-border">
      <Wrapper className="py-16">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-[2fr_1fr_1fr_1fr]">
          <div className="col-span-2 max-w-xs md:col-span-1">
            <Logo className="text-foreground" />
            <p className="mt-3 text-[14px] leading-6 text-muted-foreground">
              Curated organic brand posts, analysed and searchable, for teams researching real campaigns.
            </p>
          </div>
          {columns.map((column) => (
            <div key={column.title}>
              <p className="text-[12px] text-muted-foreground">{column.title}</p>
              <ul className="mt-3 space-y-2">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="rounded-[2px] text-[14px] text-foreground transition-colors duration-80 hover:text-muted-foreground"
                    >
                      {link.text}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-16 text-[12px] text-muted-foreground">
          Posts belong to the brands that published them and are shown for research with attribution.
        </p>
      </Wrapper>
      <div
        aria-hidden="true"
        className="-mb-[6vw] select-none whitespace-nowrap text-center font-serif text-[35vw] leading-[0.8] tracking-[-0.03em] text-foreground/[0.06]"
      >
        Curatit
      </div>
    </footer>
  );
}
