// Fetches hybrid search's two models into ./models (gitignored): gte-small for embeddings and the
// MiniLM cross-encoder for reranking, int8, about 34 MB each. Each file comes from a pinned
// Hugging Face revision and is checked against its SHA-256 before it's kept; files already present
// and correct are skipped. Runs before every build (npm's prebuild), so the server ships the models
// and never downloads them (src/lib/search/semantic/models.ts). If a download fails the build goes
// on without them, and search answers with keyword search alone and says so.
//
//   npm run search:models
import { createHash } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

const MODELS = [
  {
    id: "Supabase/gte-small",
    revision: "93b36ff09519291b77d6000d2e86bd8565378086",
    files: {
      "config.json": "00273cdfb3e05c7304d180270bdef8adae45023e7bdfc396338bdd815943dc59",
      "tokenizer.json": "da0e79933b9ed51798a3ae27893d3c5fa4a201126cef75586296df9b4d2c62a0",
      "tokenizer_config.json": "73687f47b47aedc8bfa8712f7e6616450058f1f1bb3d5e5861f8a92964d6467a",
      "onnx/model_quantized.onnx": "18dec105109b6004369799ca4761fb8fb413c64172c02147bcfac186b5c5f6cb",
    },
  },
  {
    id: "Xenova/ms-marco-MiniLM-L-12-v2",
    revision: "42a4a787e30451cf9dbd09080c2a5b8dde332c1e",
    files: {
      "config.json": "681b15ee0e4ec2cc2320b4e32e01266ebcbc8a84d55c9f0fac04cfefb7eece30",
      "tokenizer.json": "d241a60d5e8f04cc1b2b3e9ef7a4921b27bf526d9f6050ab90f9267a1f9e5c66",
      "tokenizer_config.json": "0b29c7bfc889e53b36d9dd3e686dd4300f6525110eaa98c76a5dafceb2029f53",
      "onnx/model_quantized.onnx": "c5551b3e446396364913c5ad79e9c8411a76d26523b7d87232052ae6c0d0c7fd",
    },
  },
];

const root = join(process.cwd(), "models");
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

let fetched = 0;
let failed = 0;
for (const model of MODELS) {
  for (const [file, expected] of Object.entries(model.files)) {
    const target = join(root, model.id, file);
    const present = await readFile(target).catch(() => null);
    if (present && sha256(present) === expected) continue;
    try {
      const response = await fetch(`https://huggingface.co/${model.id}/resolve/${model.revision}/${file}`, { redirect: "follow", signal: AbortSignal.timeout(120_000) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const bytes = Buffer.from(await response.arrayBuffer());
      if (sha256(bytes) !== expected) throw new Error("its SHA-256 doesn't match the pinned file");
      await mkdir(dirname(target), { recursive: true });
      await writeFile(`${target}.part`, bytes);
      await rename(`${target}.part`, target);
      fetched++;
    } catch (error) {
      failed++;
      console.warn(`search models: couldn't fetch ${model.id}/${file}: ${error instanceof Error ? error.message : error}`);
    }
  }
}
if (failed) console.warn(`search models: ${failed} file(s) missing; hybrid search will answer with keyword search alone until they're there.`);
else console.log(`search models: ready in ./models (${fetched} fetched, the rest already there)`);
