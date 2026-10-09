// Joins class names, dropping falsy values and repeated tokens.
export function cx(...values: (string | false | null | undefined)[]) {
  const tokens = values.filter(Boolean).join(" ").split(/\s+/).filter(Boolean);
  return [...new Set(tokens)].join(" ");
}
