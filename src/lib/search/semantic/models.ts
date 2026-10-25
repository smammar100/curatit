// The two models hybrid search runs, through transformers.js on the server (never in a browser
// bundle: it loads onnxruntime-node): gte-small turns text into 384 numbers whose closeness tracks
// meaning, and the MiniLM cross-encoder reads a request and a post's description together and
// scores how relevant the post is (0 to 1). Both int8-quantised, about 34 MB each, loaded on first
// use from `modelDir` (scripts/fetch-search-models.mjs puts them in ./models at build time). With
// `download`, a missing model is fetched from Hugging Face into `modelDir` (the index script, and
// development); the deployed server never downloads.

export const EMBEDDING_MODEL = "Supabase/gte-small";
export const RERANK_MODEL = "Xenova/ms-marco-MiniLM-L-12-v2";
export const EMBEDDING_DIMENSIONS = 384;

export type SemanticModels = {
  embed(texts: string[]): Promise<number[][]>;
  rerank(query: string, documents: string[]): Promise<number[]>;
};

type Loaded = {
  embedder: (texts: string[], options: { pooling: "mean"; normalize: boolean }) => Promise<{ tolist(): number[][] }>;
  tokenizer: (texts: string[], options: { text_pair: string[]; padding: boolean; truncation: boolean; max_length: number }) => Record<string, unknown>;
  reranker: (inputs: Record<string, unknown>) => Promise<{ logits: { sigmoid(): { tolist(): number[][] } } }>;
};

export function createLocalModels(options: { modelDir: string; download: boolean }): SemanticModels {
  let loading: Promise<Loaded> | null = null;
  const load = () =>
    (loading ??= (async () => {
      const t = await import("@huggingface/transformers");
      t.env.localModelPath = options.modelDir.endsWith("/") ? options.modelDir : `${options.modelDir}/`;
      t.env.allowLocalModels = true;
      t.env.allowRemoteModels = options.download;
      t.env.cacheDir = options.modelDir;
      const [embedder, tokenizer, reranker] = await Promise.all([
        t.pipeline("feature-extraction", EMBEDDING_MODEL, { dtype: "q8" }),
        t.AutoTokenizer.from_pretrained(RERANK_MODEL),
        t.AutoModelForSequenceClassification.from_pretrained(RERANK_MODEL, { dtype: "q8" }),
      ]);
      return { embedder, tokenizer, reranker } as unknown as Loaded;
    })().catch((error) => {
      // A failed load (no model files, say) is tried again on the next search
      loading = null;
      throw error;
    }));

  return {
    async embed(texts) {
      const { embedder } = await load();
      const out: number[][] = [];
      for (let i = 0; i < texts.length; i += 16) {
        const tensor = await embedder(texts.slice(i, i + 16), { pooling: "mean", normalize: true });
        out.push(...tensor.tolist());
      }
      return out;
    },
    async rerank(query, documents) {
      const { tokenizer, reranker } = await load();
      const scores: number[] = [];
      for (let i = 0; i < documents.length; i += 16) {
        const batch = documents.slice(i, i + 16);
        const inputs = tokenizer(new Array(batch.length).fill(query), { text_pair: batch, padding: true, truncation: true, max_length: 512 });
        const { logits } = await reranker(inputs);
        scores.push(...logits.sigmoid().tolist().map((row) => row[0]));
      }
      return scores;
    },
  };
}
