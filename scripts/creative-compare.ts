// Creative Intelligence evaluation (2.1): Curatit's analysis of a post beside an ordinary visual
// critique of the same images by the same model, for people to rate blind with
// docs/creative-eval/rubric.md. Curatit's side is the post's latest stored analysis (this never
// runs the pipeline); the ordinary side asks the local Claude Code CLI, on your subscription, the
// question anyone could ask a chat assistant. A and B are shuffled per post; the key is in key.json.
//
//   npm run creative:compare -- --post <id> [<id>…]           some posts
//   npm run creative:compare -- --set docs/creative-eval/eval-set.json [--limit 6]
//   options: --out data/creative-eval  --budget 2 (US$, the ordinary side)  --model sonnet
//
// Reads .env.local (SUPABASE_SECRET_KEY). Writes <out>/<short code>.md (the two analyses, blind),
// ratings.csv (a row per post and side for raters), metrics.json (deterministic counts and checks
// per side) and key.json (which side is which; keep it from raters until they're done).
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { ClaudeCliAdapter } from "@/lib/creative/claudeCli";
import { prepareImages } from "@/lib/creative/media";
import { evidenceGroups, toPublicAnalysis, type PublicAnalysis, type SlideRecord } from "@/lib/creative/publicAnalysis";
import { createAdminClient, SupabaseStore } from "@/lib/creative/store";
import { lintProse } from "@/lib/creative/validate";

try {
  process.loadEnvFile(".env.local");
} catch {
  // no .env.local: use the environment as it is
}

const argv = process.argv.slice(2);
const values = (name: string) => {
  const at = argv.indexOf(`--${name}`);
  if (at < 0) return [];
  const out: string[] = [];
  for (let i = at + 1; i < argv.length && !argv[i].startsWith("--"); i++) out.push(argv[i]);
  return out;
};
const value = (name: string, fallback: string) => values(name)[0] ?? fallback;

type EvalPost = { id: string; short_code?: string; brand?: string; category?: string; format?: string; slides?: number; why?: string };

const GENERIC_SYSTEM = "You are a helpful assistant.";
const GENERIC_SCHEMA = { type: "object", properties: { critique: { type: "string" } }, required: ["critique"], additionalProperties: false };
const genericPrompt = (files: string[], caption: string) =>
  [
    "I'm a designer. Here's an Instagram post. Open each image file with the Read tool:",
    ...files.map((file) => `- ${file}`),
    "",
    `Caption: ${JSON.stringify(caption)}`,
    "",
    "Give me a design critique of this post: what works, why, and what I could learn from it for my own work.",
  ].join("\n");

// Curatit's side as text a rater reads: what the post page shows, nothing more
function curatitText(a: PublicAnalysis) {
  const refs = (evidence: Parameters<typeof evidenceGroups>[0]) => evidenceGroups(evidence).map((g) => g.label).join(", ");
  const lines = [a.concept, ""];
  if (a.creativeDecisions.length) {
    lines.push("Creative decisions:");
    a.creativeDecisions.forEach((d, i) =>
      lines.push(
        `${i + 1}. ${d.title} (${refs(d.evidence)}${d.confidence === "high" ? "" : `, ${d.confidence} confidence`})`,
        `   What they did: ${d.observation}`,
        `   Why it might work: ${d.rationale}`,
        `   Principle: ${d.principle}`,
        `   Use it when: ${d.useWhen}`,
        `   Avoid it when: ${d.avoidWhen}`,
      ),
    );
  } else if (a.mechanisms.length) {
    lines.push("What it does:", ...a.mechanisms.map((m) => `- ${m.text} (${refs(m.evidence)})`));
  }
  if (a.integrity.length) lines.push("", "Data checks:", ...a.integrity.map((n) => `- ${n.status}: ${n.aspect}. ${n.note}`));
  if (a.hypotheses.length) lines.push("", "Why it might work:", ...a.hypotheses.map((h) => `- ${h.text}`));
  if (a.formula) lines.push("", `Formula: ${a.formula}`);
  if (a.takeaways.length) lines.push("", "How to apply:", ...a.takeaways.map((t, i) => `${i + 1}. ${t}`));
  if (a.adaptations.length) lines.push("", "Adapt it elsewhere:", ...a.adaptations.map((t) => `- ${t}`));
  if (a.caveats.length) lines.push("", "Caveats:", ...a.caveats.map((t) => `- ${t}`));
  return lines.join("\n").trim();
}

// Deterministic counts a rater can sanity-check against: length, slide references, concrete
// figures, hedges, and the text checks (performance claims, jargon, scores). The distortion check
// is left out: in free text it cannot tell a description ("the disclaimer is tiny") from advice,
// so raters judge it here, and the validator checks it on Curatit's advice fields
function metrics(text: string) {
  return {
    words: text.split(/\s+/).filter(Boolean).length,
    slideReferences: (text.match(/\bslides?\s+\d+/gi) ?? []).length,
    figures: (text.match(/[$£€]?\d[\d,.]*%?/g) ?? []).length,
    hedges: (text.match(/\b(may|might|could)\b/gi) ?? []).length,
    flags: lintProse(text).filter((code) => code !== "recommends_distortion"),
  };
}

const RUBRIC = [
  "observation_accuracy",
  "specificity",
  "evidence_validity",
  "novelty",
  "usefulness",
  "transferable_principles",
  "limitations_accuracy",
  "redundancy",
  "hallucinations",
  "seconds_to_understand",
];

async function main() {
  const out = value("out", "data/creative-eval");
  const budget = Number(value("budget", "2"));
  const limit = Number(value("limit", "0")) || Infinity;
  let posts: EvalPost[] = values("post").map((id) => ({ id }));
  if (!posts.length) {
    const set = JSON.parse(await readFile(value("set", "docs/creative-eval/eval-set.json"), "utf8")) as { posts: EvalPost[] };
    posts = set.posts;
  }
  posts = posts.slice(0, limit);

  const client = createAdminClient();
  const store = new SupabaseStore(client);
  const adapter = new ClaudeCliAdapter({ model: value("model", process.env.CREATIVE_ANALYSIS_MODEL ?? "sonnet") });
  await adapter.preflight();
  await mkdir(out, { recursive: true });

  const ratings = [["post", "side", ...RUBRIC, "notes"].join(",")];
  const key: Record<string, { A: string; B: string }> = {};
  const allMetrics: Record<string, Record<string, ReturnType<typeof metrics>>> = {};
  let spent = 0;

  for (const post of posts) {
    if (spent >= budget) {
      console.error(`Budget of $${budget} reached; stopped before ${post.id}`);
      break;
    }
    const manifest = await store.manifest(post.id);
    if (!manifest) {
      console.error(`${post.id}: not a published post with saved images; skipped`);
      continue;
    }
    const count = manifest.images.length;

    // Curatit: the latest stored version, whatever its review state, with its own slide records
    const { data: version } = await client
      .from("post_analysis_versions")
      .select("id, version_no, prompt_version, review_decision, creative_dna, image_analysis_complete, expected_slides, processed_slides")
      .eq("post_id", post.id)
      .order("version_no", { ascending: false })
      .limit(1)
      .maybeSingle();
    let curatit = "(No Curatit analysis yet.)";
    if (version) {
      const { data: rows } = await client.from("post_slide_analyses").select("version_id, position, observation").eq("post_id", post.id).eq("version_id", version.id);
      const analysis = toPublicAnalysis({ ...version, current_version_id: version.id }, (rows ?? []) as SlideRecord[], count);
      if (analysis) curatit = curatitText(analysis);
    }

    // The ordinary critique: same model, same images, a plain question
    const workdir = await mkdtemp(join(tmpdir(), "curatit-compare-"));
    let generic = "";
    try {
      const images = await prepareImages(manifest.images, store, workdir);
      const result = await adapter.generate({
        task: "synthesis",
        system: GENERIC_SYSTEM,
        prompt: genericPrompt(images.map((image) => basename(image.file)), manifest.caption),
        schema: GENERIC_SCHEMA,
        images,
        workdir,
        maxUsd: Math.max(0.05, budget - spent),
      });
      spent += result.usage.costUsd;
      generic = (result.output as { critique: string }).critique.trim();
    } finally {
      await rm(workdir, { recursive: true, force: true });
    }

    // Blind: which side is A is fixed per post by its id, and recorded only in key.json
    const curatitFirst = createHash("sha256").update(post.id).digest()[0] < 128;
    const [a, b] = curatitFirst ? [curatit, generic] : [generic, curatit];
    const short = manifest.short_code;
    key[short] = curatitFirst ? { A: "curatit", B: "generic" } : { A: "generic", B: "curatit" };
    allMetrics[short] = { curatit: metrics(curatit), generic: metrics(generic) };
    await writeFile(
      join(out, `${short}.md`),
      [
        `# ${manifest.brand.name ?? "Post"} · ${short}`,
        "",
        `${manifest.category.name ?? ""} · ${manifest.format} · ${count} ${count === 1 ? "image" : "slides"} · ${manifest.source_url}`,
        "",
        "Open the post, then read both analyses and rate each with docs/creative-eval/rubric.md.",
        "",
        "## A",
        "",
        a,
        "",
        "## B",
        "",
        b,
        "",
      ].join("\n"),
    );
    for (const side of ["A", "B"]) ratings.push([short, side, ...RUBRIC.map(() => ""), ""].join(","));
    console.error(JSON.stringify({ post: short, curatitVersion: version?.version_no ?? null, prompt: version?.prompt_version ?? null, spentUsd: Math.round(spent * 1e4) / 1e4 }));
  }

  await writeFile(join(out, "ratings.csv"), ratings.join("\n") + "\n");
  await writeFile(join(out, "key.json"), JSON.stringify(key, null, 2));
  await writeFile(join(out, "metrics.json"), JSON.stringify(allMetrics, null, 2));
  console.log(JSON.stringify({ posts: Object.keys(key).length, spentUsd: Math.round(spent * 1e4) / 1e4, out }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
