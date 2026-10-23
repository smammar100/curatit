"use client";

// The welcome flow, /dashboard/welcome: the "Studio" direction, chosen from a three-way
// prototype on 2026-10-11 (after Cosmos's account setup). A full page split in two: one question
// at a time on the left (name and what you do, industries as folders, brands, a taste test), and
// on the right your For you taking shape, the library's wall re-sorting with every pick and
// saying why. On the last step the wall becomes the taste test: tap three on the right. The
// answers save to the profile at the end; "Skip for now" saves what's been answered so far and
// that you've been here, so it doesn't ask again. The feed ranks on them from then on. Open
// again from the account menu to change them.
//
// Since 2026-10-23 on the design system: Skip, Cancel and "No one in particular" are transparent
// Buttons (the 44px hit area is the system's own on touch screens), a profile that can't load is
// a danger Notice with Reload, the wall's ground is bg-muted, and the pickers are in parts.tsx
// and Folders.tsx.
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Symbol from "@/components/assets/Symbol";
import Button from "@/components/fundations/elements/Button";
import CaretLeft from "@/components/fundations/icons/CaretLeft";
import Notice from "@/components/fundations/molecules/Notice";
import { useBoards } from "@/components/dashboard/boards";
import { rank } from "@/components/dashboard/forYou";
import { useProfile } from "@/components/dashboard/profile";
import { cx } from "@/lib/cx";
import { track } from "@/lib/analytics";
import { FolderTiles } from "./Folders";
import { BrandGrid, Collage, Done, Heading, LearnedChips, NameRole, Progress, Ring, TasteGrid, brandsOf, categoriesOf, semibold, type Draft } from "./parts";

const TASTE = 3;
const TASTE_TILES = 16;
// The steps' names in analytics (onboarding_step_completed's `step`), in order
const STEP_NAMES = ["name", "industries", "brands", "taste"] as const;
const STEPS = [
  { title: "What should we call you?", sub: "First name is fine." },
  { title: "Which industries do you work in?", sub: "Pick at least one. Their posts come first." },
  { title: "Brands you keep an eye on?", sub: "Optional. Their new posts go up top." },
  { title: "Tap three that stop your thumb.", sub: "No wrong answers. This is how the feed learns your taste." },
];

export default function Welcome() {
  const router = useRouter();
  const { status, profile, save } = useProfile();
  const { list: posts } = useBoards();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft | null>(null);
  // What the flow started from: whether this is a redo, and the saved taste picks that are
  // still in the library (they lead the taste grid, so a redo can always see and swap them)
  const [start, setStart] = useState<{ redo: boolean; picks: string[] } | null>(null);
  const [saving, setSaving] = useState<"finish" | "skip" | null>(null);
  const [failed, setFailed] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const mounted = useRef(false);
  const started = useRef(false);

  // Start from what's on the profile already (empty the first time, the old answers on a redo)
  useEffect(() => {
    if (status !== "ready" || draft) return;
    const known = new Set(posts.map((p) => p.shortCode));
    const picks = profile.taste.filter((code) => known.has(code));
    setDraft({ name: profile.name, occupation: profile.occupation, industries: profile.industries, brands: profile.brands, taste: picks });
    setStart({ redo: !!profile.onboardedAt, picks });
    // Analytics: the onboarding funnel's welcome step. `redo` marks a visit from the account
    // menu's Personalise your feed, which the funnel leaves out. The ref keeps it to once, even
    // when development runs effects twice.
    if (!started.current) {
      started.current = true;
      track("onboarding_started", { redo: !!profile.onboardedAt });
    }
  }, [status, profile, draft, posts]);

  // Each step (and the end) takes focus to its question, so keyboard and screen-reader users
  // land on it rather than at the top of the page; the first step focuses its name field instead
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    headingRef.current?.focus();
  }, [step]);

  const list = useMemo(() => categoriesOf(posts), [posts]);
  const brands = useMemo(() => brandsOf(posts), [posts]);
  const taste = useMemo(() => {
    const picks = (start?.picks ?? []).flatMap((code) => posts.find((p) => p.shortCode === code) ?? []);
    return [...picks, ...posts.filter((p) => !picks.includes(p))].slice(0, TASTE_TILES);
  }, [posts, start]);
  const ranked = useMemo(() => (draft ? rank(posts, draft) : posts), [posts, draft]);

  if (!draft || !start) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-page px-6" role="status" aria-live="polite">
        {status === "error" ? (
          <Notice
            tone="danger"
            title="We couldn’t load your profile."
            action={
              <Button size="xs" variant="muted" onClick={() => location.reload()}>
                Reload
              </Button>
            }
            className="max-w-sm"
          >
            Check your connection and reload the page.
          </Notice>
        ) : (
          <span className="sr-only">Loading your profile</span>
        )}
      </div>
    );
  }

  const patch = (p: Partial<Draft>) => setDraft((d) => (d ? { ...d, ...p } : d));
  const done = step === STEPS.length;
  const ready = [true, draft.industries.length > 0, true, draft.taste.length >= TASTE][step] ?? true;
  const full = draft.taste.length >= TASTE;

  // Analytics: one event per step finished, with how many things were picked on it (never what)
  const stepDone = (selections: number) =>
    track("onboarding_step_completed", { step: STEP_NAMES[step], step_number: step + 1, selection_count: selections, redo: start.redo });
  const selections = () => [draft.name.trim() ? 1 : 0, draft.industries.length, draft.brands.length, draft.taste.length][step] ?? 0;

  const finish = async () => {
    setSaving("finish");
    setFailed(false);
    const ok = await save({ ...draft, onboardedAt: new Date().toISOString() });
    setSaving(null);
    if (ok) {
      stepDone(draft.taste.length);
      track("onboarding_completed", {
        brand_count: draft.brands.length,
        industry_count: draft.industries.length,
        taste_selection_count: draft.taste.length,
        redo: start.redo,
      });
      setStep(STEPS.length);
    } else setFailed(true);
  };
  // Skip keeps what's been answered so far and notes you've been here, so it doesn't ask again.
  // If that can't be saved, the feed would only send you back, so stay and say so.
  const skip = async () => {
    if (start.redo) return router.push("/dashboard");
    setSaving("skip");
    setFailed(false);
    const ok = await save({ ...draft, onboardedAt: new Date().toISOString() });
    if (ok) {
      track("onboarding_skipped", { completed_step_count: step, step: STEP_NAMES[step] ?? "done" });
      return router.replace("/dashboard");
    }
    setSaving(null);
    setFailed(true);
  };

  const picked = list.filter((c) => draft.industries.includes(c.slug)).map((c) => c.name);
  const caption = done
    ? "Your For you."
    : step === 0
      ? "The library, as it stands."
      : step === 1
        ? picked.length
          ? `${picked.join(", ")} first.`
          : "Pick an industry and watch this change."
        : step === 2
          ? draft.brands.length
            ? `${draft.brands.length} ${draft.brands.length === 1 ? "brand" : "brands"} you follow, up top.`
            : "Follow a brand and its posts move up."
          : "Tap the ones you’d stop on.";
  const count = full ? `${TASTE} of ${TASTE}. Tap one again to swap it.` : `${draft.taste.length} of ${TASTE}`;

  return (
    <div className="min-h-dvh bg-page lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <section className="flex min-h-dvh flex-col px-6 py-5">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center">
          <div>
            {step > 0 && !done && (
              <Button variant="transparent" iconOnly aria-label="Back" onClick={() => setStep((s) => s - 1)}>
                <CaretLeft className="size-3.5" />
              </Button>
            )}
          </div>
          <Symbol className="size-7 text-foreground" aria-hidden="true" />
          <div className="text-right">
            {!done && (
              <Button variant="transparent" size="sm" onClick={skip} disabled={saving !== null}>
                {start.redo ? "Cancel" : saving === "skip" ? "One moment…" : "Skip for now"}
              </Button>
            )}
          </div>
        </div>

        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
          {done ? (
            <Done posts={posts} draft={draft} headingRef={headingRef} />
          ) : (
            <form
              key={step}
              className="welcome-rise"
              onSubmit={(e) => {
                e.preventDefault();
                if (!ready || saving) return;
                if (step === STEPS.length - 1) return finish();
                stepDone(selections());
                setStep((s) => s + 1);
              }}
            >
              <Progress step={step} total={STEPS.length} className="mb-8" />
              <Heading ref={headingRef} align="left" title={STEPS[step].title} sub={STEPS[step].sub} />
              <div className="mt-6">
                {step === 0 && <NameRole value={draft} onChange={patch} />}
                {step === 1 && <FolderTiles list={list} value={draft.industries} onChange={(industries) => patch({ industries })} className="grid-cols-2" />}
                {step === 2 && <BrandGrid brands={brands} value={draft.brands} onChange={(brands) => patch({ brands })} className="grid-cols-4" />}
                {step === 3 && (
                  <>
                    {/* The wall on the right is the test on wide screens; below that, it's here */}
                    <TasteGrid posts={taste.slice(0, 9)} value={draft.taste} onChange={(taste) => patch({ taste })} max={TASTE} className="grid-cols-3 lg:hidden" />
                    <div className="mt-4 flex items-center gap-3 lg:mt-0">
                      <Ring value={draft.taste.length} max={TASTE} className="size-9 shrink-0" />
                      <p className="text-title text-pretty text-foreground tabular-nums" style={semibold} aria-live="polite">
                        {count}
                      </p>
                    </div>
                    <LearnedChips posts={posts} taste={draft.taste} className="mt-4" />
                  </>
                )}
              </div>
              {failed && (
                <Notice tone="danger" live className="mt-4">
                  We couldn’t save that. Check your connection and try again.
                </Notice>
              )}
              <div className="mt-8 flex items-center gap-4">
                <Button type="submit" size="base" variant="default" disabled={!ready || saving !== null} className="w-fit">
                  {step === STEPS.length - 1 ? (saving === "finish" ? "Saving…" : "Open my feed") : "Next"}
                </Button>
                {step === 2 && (
                  <Button
                    variant="transparent"
                    size="sm"
                    onClick={() => {
                      patch({ brands: [] });
                      stepDone(0);
                      setStep((s) => s + 1);
                    }}
                  >
                    No one in particular
                  </Button>
                )}
              </div>
            </form>
          )}
        </div>
      </section>

      {/* Your For you, taking shape. The caption isn't a live region: each pick already says
          whether it's on, and this would say it twice. The ground is the muted tint; a picked
          tile's ring sits inside its own edge, so the ground needn't be solid */}
      <aside className="relative hidden bg-muted lg:block" aria-label="Your feed, taking shape">
        <p className="absolute top-6 right-10 left-10 z-10 text-caption text-muted-foreground">{caption}</p>
        <div className={cx("absolute inset-0 overflow-hidden px-10 pt-14 pb-10", step === 3 && !done && "overflow-y-auto")}>
          {step === 3 && !done ? (
            <TasteGrid posts={taste} value={draft.taste} onChange={(taste) => patch({ taste })} max={TASTE} className="grid-cols-4" />
          ) : (
            // Re-rises only when the wall's posts actually change
            <Collage key={ranked.slice(0, 12).map((p) => p.shortCode).join()} posts={ranked.slice(0, 12)} />
          )}
        </div>
      </aside>
    </div>
  );
}
