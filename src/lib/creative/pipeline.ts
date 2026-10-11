// Creative Intelligence: the versions an analysis is made under. The pipeline version (taxonomy +
// prompt) is part of every job's key, so bumping either in versions.json makes posts eligible for
// a new analysis (reconcile with --include-stale); the model is part of each version's input
// fingerprint instead, so a re-run with the same model and input is skipped for free.
import versions from "./versions.json";

export const PROMPT_VERSION = versions.prompt;
export const PIPELINE_VERSION = `${versions.taxonomy}+${versions.prompt}`;
