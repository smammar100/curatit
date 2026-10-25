// Checks that the deployed search function can load hybrid search's models: copies exactly the
// files the build traced for /mcp (what Vercel ships) into an empty folder, then loads both models
// from there and runs one embedding and one rerank. Run after `npm run build`, on Linux x64 like
// Vercel (CI does); elsewhere it says so and stops, since the function carries Linux binaries only.
// Added on 2026-10-25, after the first deploy shipped sharp's native module without the libvips it
// links to: the import failed and search answered keyword-only, which no other check would catch.
//
//   node scripts/check-search-bundle.mjs        (NEXT_DIST_DIR if the build used one)
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";

if (process.platform !== "linux" || process.arch !== "x64") {
  console.log(`search bundle: not checked on ${process.platform}-${process.arch}; the function ships Linux x64 binaries (CI checks it)`);
  process.exit(0);
}

const root = process.cwd();
const nftFile = join(root, process.env.NEXT_DIST_DIR || ".next", "server", "app", "mcp", "route.js.nft.json");
const traced = JSON.parse(readFileSync(nftFile, "utf8")).files.map((file) => resolve(dirname(nftFile), file));
const bundle = mkdtempSync(join(tmpdir(), "curatit-search-bundle-"));
let copied = 0;
for (const file of traced) {
  const path = relative(root, file);
  if (path.startsWith("..") || path.startsWith(".next")) continue;
  mkdirSync(dirname(join(bundle, path)), { recursive: true });
  copyFileSync(file, join(bundle, path));
  copied++;
}

try {
  const t = await import(pathToFileURL(join(bundle, "node_modules", "@huggingface", "transformers", "dist", "transformers.node.mjs")).href);
  t.env.localModelPath = `${join(bundle, "models")}/`;
  t.env.allowLocalModels = true;
  t.env.allowRemoteModels = false;
  t.env.cacheDir = join(bundle, "models");
  const embedder = await t.pipeline("feature-extraction", "Supabase/gte-small", { dtype: "q8" });
  const [vector] = (await embedder(["posts aimed at students"], { pooling: "mean", normalize: true })).tolist();
  const tokenizer = await t.AutoTokenizer.from_pretrained("Xenova/ms-marco-MiniLM-L-12-v2");
  const reranker = await t.AutoModelForSequenceClassification.from_pretrained("Xenova/ms-marco-MiniLM-L-12-v2", { dtype: "q8" });
  const inputs = tokenizer(["funny posts about saving money"], { text_pair: ["A joke about budgeting for a holiday."], padding: true, truncation: true, max_length: 512 });
  const [[score]] = (await reranker(inputs)).logits.sigmoid().tolist();
  if (vector.length !== 384 || !(score > 0.5)) throw new Error(`unexpected output: ${vector.length} dimensions, rerank ${score}`);
  console.log(`search bundle: both models load from the ${copied} traced files (384 dimensions; rerank ${score.toFixed(3)})`);
} catch (error) {
  console.error(`search bundle: the /mcp function can't load the search models from its traced files: ${error instanceof Error ? error.message : error}`);
  process.exitCode = 1;
} finally {
  rmSync(bundle, { recursive: true, force: true });
}
