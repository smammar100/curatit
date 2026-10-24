// The reasons the unsubscribe page offers (stored by key in public.email_unsubscribes.reason,
// whose check constraint lists the same keys). Kept apart from src/lib/unsubscribe.ts, which
// reads secrets, so the page's client form can import them.
export const UNSUBSCRIBE_REASONS = {
  too_many: "Too many emails",
  not_relevant: "Not relevant to my work",
  never_signed_up: "I never signed up for these",
  other: "Something else",
} as const;
export type UnsubscribeReason = keyof typeof UNSUBSCRIBE_REASONS;
export const NOTE_MAX = 500;
