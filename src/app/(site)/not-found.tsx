import NotFoundContent from "@/components/global/NotFoundContent";

// A notFound() inside the site's pages renders here, inside the group's layout, which already has
// the navigation and footer. Without this file the group borrowed the root not-found, which brings
// its own: a second navigation and footer inside <main>, and a copy of both written into every
// site page's data (2026-10-16)
export default function NotFound() {
  return <NotFoundContent />;
}
