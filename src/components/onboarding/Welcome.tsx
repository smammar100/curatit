"use client";

// The welcome flow, /dashboard/welcome: the "Studio" direction, chosen from a three-way
// prototype on 2026-10-11 (after Cosmos's account setup). A full page split in two: one question
// at a time on the left (name and what you do, industries as folders, brands), and
// on the right your For you taking shape, the library's wall re-sorting with every pick and
// saying why. The end drops the wall and stands alone in the middle of the page. The answers save to the profile at the end; "Skip for now" saves what's been answered so far and
// that you've been here, so it doesn't ask again. The feed ranks on them from then on. Open
// again from the account menu to change them.
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
import { BrandGrid, Collage, Done, Heading, NameRole, Progress, brandsOf, categoriesOf, type Draft } from "./parts";

// The steps' names in analytics (onboarding_step_completed's `step`), in order. A fourth, the
// taste test (tap three posts), was taken out on 2026-10-23 at the owner's request; picks saved
// before then stay on the profile and still count in For you
const STEP_NAMES = ["name", "industries", "brands"] as const;
const STEPS = [
  { title: "What should we call you?", sub: "First name is fine." },
  { title: "Which industries do you work in?", sub: "Pick at least one. Their posts come first." },
  { title: "Brands you keep an eye on?", sub: "Optional. Their new posts go up top." },
];

// A quiet text button with a 44px hit area that doesn't change the layout (Button has no
// text-only variant at that height: transparent fills on hover, and its 44px size sets 14px)
const textButton =
  "-mx-2 inline-flex h-11 items-center rounded-full px-2 text-body font-medium text-secondary-foreground transition-colors duration-150 ease-out-quint hover:text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-border-focus disabled:pointer-events-none disabled:text-disabled-foreground";

export default function Welcome() {
  const router = useRouter();
  const { status, profile, save } = useProfile();
  const { list: posts } = useBoards();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft | null>(null);
  // Whether this is a redo (opened again from the account menu)
  const [start, setStart] = useState<{ redo: boolean } | null>(null);
  const [saving, setSaving] = useState<"finish" | "skip" | null>(null);
  const [failed, setFailed] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const mounted = useRef(false);
  const started = useRef(false);

  // Start from what's on the profile already (empty the first time, the old answers on a redo)
  useEffect(() => {
    if (status !== "ready" || draft) return;
    setDraft({ name: profile.name, occupation: profile.occupation, industries: profile.industries, brands: profile.brands, taste: profile.taste });
    setStart({ redo: !!profile.onboardedAt });
    // Analytics: the onboarding funnel's welcome step. `redo` marks a visit from the account
    // menu's Personalise your feed, which the funnel leaves out. The ref keeps it to once, even
    // when development runs effects twice.
    if (!started.current) {
      started.current = true;
      track("onboarding_started", { redo: !!profile.onboardedAt });
    }
  }, [status, profile, draft]);

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
  const ranked = useMemo(() => (draft ? rank(posts, draft) : posts), [posts, draft]);

  if (!draft || !start) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-page px-6" role="status" aria-live="polite">
        {status === "error" ? (
          <div className="max-w-sm text-center">
            <p className="text-subtitle font-medium text-primary-foreground">We couldn’t load your profile.</p>
            <p className="mt-2 text-body text-secondary-foreground">Check your connection and reload the page.</p>
            <Button type="button" size="base" variant="muted" onClick={() => location.reload()} className="mx-auto mt-6 w-fit">
              Reload
            </Button>
          </div>
        ) : (
          <span className="sr-only">Loading your profile</span>
        )}
      </div>
    );
  }

  const patch = (p: Partial<Draft>) => setDraft((d) => (d ? { ...d, ...p } : d));
  const done = step === STEPS.length;
  const ready = [true, draft.industries.length > 0, true][step] ?? true;

  // Analytics: one event per step finished, with how many things were picked on it (never what)
  const stepDone = (selections: number) =>
    track("onboarding_step_completed", { step: STEP_NAMES[step], step_number: step + 1, selection_count: selections, redo: start.redo });
  const selections = () => [draft.name.trim() ? 1 : 0, draft.industries.length, draft.brands.length][step] ?? 0;

  // `last` is a change made on the way out (No one in particular clears the brands), which the
  // draft in this render doesn't have yet
  const finish = async (last: Partial<Draft> = {}) => {
    const answers = { ...draft, ...last };
    setDraft(answers);
    setSaving("finish");
    setFailed(false);
    const ok = await save({ ...answers, onboardedAt: new Date().toISOString() });
    setSaving(null);
    if (ok) {
      stepDone(answers.brands.length);
      track("onboarding_completed", {
        brand_count: answers.brands.length,
        industry_count: answers.industries.length,
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
  const caption =
    step === 0
      ? "The library, as it stands."
      : step === 1
        ? picked.length
          ? `${picked.join(", ")} first.`
          : "Pick an industry and watch this change."
        : draft.brands.length
          ? `${draft.brands.length} ${draft.brands.length === 1 ? "brand" : "brands"} you follow, up top.`
          : "Follow a brand and its posts move up.";

  return (
    // The end drops the wall and stands alone, centred on the whole page
    <div className={cx("min-h-dvh bg-page", !done && "lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]")}>
      <section className="flex min-h-dvh flex-col px-6 py-5">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center">
          <div>
            {step > 0 && !done && (
              <Button variant="transparent" size="lg" shape="pill" iconOnly aria-label="Back" onClick={() => setStep((s) => s - 1)}>
                <CaretLeft size="sm" />
              </Button>
            )}
          </div>
          <Symbol className="size-7 text-primary-foreground" aria-hidden="true" />
          <div className="text-right">
            {!done && (
              <button type="button" onClick={skip} disabled={saving !== null} className={textButton}>
                {start.redo ? "Cancel" : saving === "skip" ? "One moment…" : "Skip for now"}
              </button>
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
              </div>
              {failed && (
                <Notice tone="danger" live className="mt-4">
                  We couldn’t save that. Check your connection and try again.
                </Notice>
              )}
              <div className="mt-8 flex items-center gap-4">
                <Button type="submit" size="base" variant="default" disabled={!ready || saving !== null} className="w-fit">
                  {step === STEPS.length - 1 ? (saving === "finish" ? "Saving…" : "Build my feed") : "Next"}
                </Button>
                {step === 2 && (
                  <button type="button" onClick={() => finish({ brands: [] })} disabled={saving !== null} className={textButton}>
                    No one in particular
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      </section>

      {/* Your For you, taking shape. The caption isn't a live region: each pick already says
          whether it's on, and this would say it twice */}
      {!done && (
        <aside className="relative hidden bg-base-50 lg:block" aria-label="Your feed, taking shape">
          <p className="absolute top-6 right-10 left-10 z-10 text-caption text-secondary-foreground">{caption}</p>
          <div className="absolute inset-0 overflow-hidden px-10 pt-14 pb-10">
            {/* Re-rises only when the wall's posts actually change */}
            <Collage key={ranked.slice(0, 12).map((p) => p.shortCode).join()} posts={ranked.slice(0, 12)} />
          </div>
        </aside>
      )}
    </div>
  );
}
