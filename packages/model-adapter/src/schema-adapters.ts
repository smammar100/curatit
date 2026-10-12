// Function schemas for model APIs, from Curatit's OpenAPI document (GET /api/v1/openapi.json):
// one function per operation, in the shape each provider's tool-calling API wants. The OpenAPI
// document is generated from the same contracts the MCP tools use, so the functions can't drift
// from the server.

export type FunctionSpec = {
  // The operation id, used as the function name
  name: string;
  description: string;
  // JSON Schema of the arguments: the request body for POST, the parameters as an object for GET
  parameters: Record<string, unknown>;
  method: "GET" | "POST";
  path: string;
  pathParams: string[];
  scope: string;
};

type OpenApi = {
  paths: Record<string, Record<string, { operationId: string; description?: string; summary?: string; requestBody?: { content: Record<string, { schema: Record<string, unknown> }> }; parameters?: { name: string; in: string; required?: boolean; description?: string; schema: Record<string, unknown> }[]; security?: { bearerAuth?: string[] }[] }>>;
};

export function functionsFromOpenApi(doc: OpenApi): FunctionSpec[] {
  const out: FunctionSpec[] = [];
  for (const [path, methods] of Object.entries(doc.paths)) {
    for (const [method, op] of Object.entries(methods)) {
      if (!op.operationId || op.operationId.startsWith("health")) continue;
      const pathParams = (op.parameters ?? []).filter((p) => p.in === "path").map((p) => p.name);
      let parameters: Record<string, unknown>;
      if (op.requestBody) {
        parameters = op.requestBody.content["application/json"].schema;
      } else {
        const properties: Record<string, unknown> = {};
        const required: string[] = [];
        for (const p of op.parameters ?? []) {
          properties[p.name] = { ...p.schema, ...(p.description ? { description: p.description } : {}) };
          if (p.required) required.push(p.name);
        }
        parameters = { type: "object", properties, ...(required.length ? { required } : {}), additionalProperties: false };
      }
      out.push({
        name: op.operationId,
        description: op.description ?? op.summary ?? op.operationId,
        parameters,
        method: method.toUpperCase() as "GET" | "POST",
        path,
        pathParams,
        scope: op.security?.[0]?.bearerAuth?.[0] ?? "curatit:read",
      });
    }
  }
  return out;
}

// Anthropic Messages API `tools`
export const toAnthropicTools = (fns: FunctionSpec[]) => fns.map((f) => ({ name: f.name, description: f.description, input_schema: f.parameters }));

// OpenAI-style `tools` (chat completions); the same shape many other hosted APIs accept
export const toOpenAiTools = (fns: FunctionSpec[]) => fns.map((f) => ({ type: "function", function: { name: f.name, description: f.description, parameters: f.parameters } }));
