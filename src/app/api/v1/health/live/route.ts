// Liveness: the process answers. Nothing about dependencies, nothing secret.
export const dynamic = "force-dynamic";
export const GET = () => Response.json({ status: "ok" }, { headers: { "Cache-Control": "no-store" } });
