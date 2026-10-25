// Builds hybrid search's index: each published post's short description (what the reranker reads)
// and the embeddings of its chunks (gte-small), from curatit_search_index_source, which reads only
// what an analysis says about the post itself. Re-embeds only posts whose text changed (by
// content_hash), and removes the index of posts no longer published. Reads .env.local and needs
// SUPABASE_SECRET_KEY there. Run it after an import, or after analyses are published or edited:
//
//   npm run search:index                 embed what changed
//   npm run search:index -- --dry-run    say what would change, embed nothing
//   npm run search:index -- --all        embed every post again
//
// The models load from ./models, downloaded there the first time (npm run search:models fetches
// the pinned files); embedding the whole library takes two or three minutes on a laptop.
import { createHash } from "node:crypto";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { boilerplateOf, buildDocument, type IndexSource, type SearchDocument } from "@/lib/search/semantic/documents";
import { createLocalModels, EMBEDDING_MODEL } from "@/lib/search/semantic/models";

try {
  process.loadEnvFile(".env.local");
} catch {
  // no .env.local: use the environment as it is
}
const args = new Set(process.argv.slice(2));
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;
if (!url || !secret) {
  console.error("search:index needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY (in .env.local).");
  process.exit(1);
}
const admin = createClient<Database>(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
const fail = (what: string, error: { message: string } | null) => {
  if (!error) return;
  console.error(`search:index: ${what} failed: ${error.message}`);
  process.exit(1);
};

const source = await admin.rpc("curatit_search_index_source");
fail("reading the index source", source.error);
const posts = (source.data ?? []) as unknown as IndexSource[];
const boilerplate = boilerplateOf(posts);
const documents = posts.map((post) => buildDocument(post, boilerplate));
const hashOf = (doc: SearchDocument) => createHash("sha256").update(JSON.stringify({ model: EMBEDDING_MODEL, description: doc.description, chunks: doc.chunks })).digest("hex");

const existing = await admin.from("post_search_documents").select("post_id, content_hash");
fail("reading the index", existing.error);
const known = new Map((existing.data ?? []).map((row) => [row.post_id, row.content_hash]));
const changed = documents.filter((doc) => args.has("--all") || known.get(doc.postId) !== hashOf(doc));
const published = new Set(documents.map((doc) => doc.postId));
const gone = [...known.keys()].filter((id) => !published.has(id));
console.log(`${posts.length} published posts; ${boilerplate.size} boilerplate sentences left out; ${changed.length} to embed, ${gone.length} to remove.`);
if (args.has("--dry-run")) process.exit(0);

const models = createLocalModels({ modelDir: join(process.cwd(), "models"), download: true });
const started = Date.now();
for (let i = 0; i < changed.length; i += 20) {
  const batch = changed.slice(i, i + 20);
  const vectors = await models.embed(batch.flatMap((doc) => doc.chunks.map((chunk) => chunk.text)));
  const upsert = await admin.from("post_search_documents").upsert(
    batch.map((doc) => ({ post_id: doc.postId, description: doc.description, content_hash: hashOf(doc), model: EMBEDDING_MODEL, indexed_at: new Date().toISOString() })),
  );
  fail("writing descriptions", upsert.error);
  const cleared = await admin.from("post_search_chunks").delete().in("post_id", batch.map((doc) => doc.postId));
  fail("clearing old chunks", cleared.error);
  let v = 0;
  const rows = batch.flatMap((doc) => doc.chunks.map((chunk) => ({ post_id: doc.postId, kind: chunk.kind, embedding: `[${vectors[v++].join(",")}]` })));
  if (rows.length) fail("writing chunks", (await admin.from("post_search_chunks").insert(rows)).error);
  console.log(`  embedded ${Math.min(i + 20, changed.length)} of ${changed.length}`);
}
if (gone.length) fail("removing unpublished posts", (await admin.from("post_search_documents").delete().in("post_id", gone)).error);
console.log(`Done in ${((Date.now() - started) / 1000).toFixed(1)}s.`);
