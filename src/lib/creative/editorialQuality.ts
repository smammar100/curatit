// Exact editorial deduplication shared by validation and the public projection.
// Do not hide all uncertainty or cannot_verify notes: a missing chart source can matter.
export const proseKey = (value: string) => value.toLowerCase().replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();

export function uniqueProse(values: string[], alreadyShown: string[] = []): string[] {
  const seen = new Set(alreadyShown.map(proseKey));
  return values.filter((value) => {
    const key = proseKey(value);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// Reject boilerplate-only sentences, not concrete missing evidence ("The chart omits
// its sample size"). A mixed sentence must be rewritten to retain its useful observation.
export function isVerificationBoilerplate(value: string): boolean {
  return /^(?:(?:we |i )?(?:cannot|can't) (?:check|verify|validate) (?:the )?(?:data|claims|figures|prices)|(?:the )?(?:data|claims|figures|prices) (?:cannot|can't) be (?:independently )?(?:checked|verified|validated))[.!]?$/i.test(value.trim())
    || /^(?:[^.!?;]+?\b(?:is|are|was|were|remain|remains|has been|have been)\s+(?:not\s+)?(?:independently\s+|externally\s+)?(?:verified|unverified|checked|tested|validated|confirmed)|[^.!?;]+?\brequire(?:s)?\s+independent\s+verification)[.!]?$/i.test(value.trim())
    || /^Hex samples come from each image\./i.test(value.trim());
}
