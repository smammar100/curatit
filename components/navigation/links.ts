export type NavLink = { href: string; text: string };

/** Public links, always shown. */
export const publicLinks: NavLink[] = [
  { href: "/pricing", text: "Pricing" },
  { href: "/blog", text: "Journal" },
];

/** Product links for signed-in members. */
export const memberLinks: NavLink[] = [
  { href: "/library", text: "Library" },
  { href: "/boards", text: "Boards" },
];

export const adminLinks: NavLink[] = [{ href: "/admin", text: "Curation" }];
