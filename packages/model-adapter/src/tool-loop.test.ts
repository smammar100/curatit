import { describe, expect, it } from "vitest";
import { scriptedProvider } from "./providers.js";
import { functionsFromOpenApi, toAnthropicTools, toOpenAiTools } from "./schema-adapters.js";
import { runToolLoop } from "./tool-loop.js";

const doc = {
  paths: {
    "/api/v1/posts/search": { post: { operationId: "searchPosts", description: "Search", requestBody: { content: { "application/json": { schema: { type: "object", properties: { query: { type: "string" } } } } } }, security: [{ bearerAuth: ["curatit:read"] }] } },
    "/api/v1/posts/{post_id}": { get: { operationId: "getPost", summary: "Get", parameters: [{ name: "post_id", in: "path", required: true, schema: { type: "string" } }, { name: "detail_level", in: "query", schema: { type: "string" } }] } },
    "/api/v1/health/live": { get: { operationId: "healthLive" } },
  },
};

describe("schema adapters", () => {
  it("builds one function per operation in each vendor's shape", () => {
    const fns = functionsFromOpenApi(doc);
    expect(fns.map((f) => f.name)).toEqual(["searchPosts", "getPost"]);
    expect(fns[1].parameters).toMatchObject({ type: "object", required: ["post_id"] });
    expect(toAnthropicTools(fns)[0]).toMatchObject({ name: "searchPosts", input_schema: { type: "object" } });
    expect(toOpenAiTools(fns)[1]).toMatchObject({ type: "function", function: { name: "getPost" } });
  });
});

describe("tool loop", () => {
  it("calls the API with the credential in a header, refuses unknown functions and stops on a final answer", async () => {
    const requests: { url: string; auth: string | null; body: string | null }[] = [];
    const fetchImpl: typeof fetch = async (input, init) => {
      requests.push({ url: String(input), auth: new Headers(init?.headers).get("authorization"), body: (init?.body as string) ?? null });
      return Response.json({ schema_version: "1.0", request_id: "r", data: { posts: [] }, warnings: [] });
    };
    const provider = scriptedProvider([
      { text: null, toolCalls: [{ id: "1", name: "searchPosts", arguments: { query: "cola" } }, { id: "2", name: "deleteEverything", arguments: {} }, { id: "3", name: "getPost", arguments: { post_id: "abc12345", detail_level: "full" } }], stop: false },
      { text: "Done: nothing matched.", toolCalls: [], stop: true },
    ]);
    const { answer, trace } = await runToolLoop(provider, { baseUrl: "https://curatit.test", token: "curatit_pat_secret", fetch: fetchImpl }, functionsFromOpenApi(doc), "find cola posts");
    expect(answer).toBe("Done: nothing matched.");
    expect(trace).toEqual([{ name: "searchPosts", status: 200 }, { name: "deleteEverything", status: "refused" }, { name: "getPost", status: 200 }]);
    expect(requests[0]).toMatchObject({ url: "https://curatit.test/api/v1/posts/search", auth: "Bearer curatit_pat_secret", body: '{"query":"cola"}' });
    expect(requests[1].url).toBe("https://curatit.test/api/v1/posts/abc12345?detail_level=full");
    // The model saw results as data and never the credential
    const toolMessage = provider.seen[1].find((m) => m.role === "tool");
    expect(JSON.stringify(toolMessage)).not.toContain("curatit_pat_secret");
    expect(JSON.stringify(toolMessage)).toContain('"isError":true');
  });

  it("stops at the iteration budget", async () => {
    const provider = scriptedProvider([{ text: null, toolCalls: [{ id: "1", name: "searchPosts", arguments: {} }], stop: false }]);
    const { answer, trace } = await runToolLoop(provider, { baseUrl: "https://curatit.test", token: "t", fetch: async () => Response.json({ data: {} }) }, functionsFromOpenApi(doc), "loop", { maxIterations: 3 });
    expect(trace).toHaveLength(3);
    expect(answer).toMatch(/ran out of research steps/);
  });
});
