/** Stable, locale-independent date for UI copy (e.g. "12 Sep 2026"). */
export function formatDate(iso: string | null | undefined) {
  if (!iso) return "Unknown";
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}
