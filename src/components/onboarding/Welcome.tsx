"use client";

// The welcome flow, /dashboard/welcome: the "Studio" direction, chosen from a three-way
// prototype on 2026-10-11 (after Cosmos's account setup). A full page split in two: one question
// at a time on the left (name and what you do, industries as folders, brands, a taste test), and
// on the right your For you taking shape, the library's wall re-sorting with every pick and
// saying why. On the last step the wall becomes the taste test: tap three on the right. The
// answers save to the profile at the end (or "Skip for now", which saves only that you've been
// here), and the feed ranks on them from then on. Open again from the account menu to change them.
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Symbol from "@/components/assets/Symbol";
import Button from "@/components/fundations/elements/Button";
import CaretLeft from "@/components/fundations/icons/CaretLeft";
import { useBoards } from "@/components/dashboard/boards";
import { rank } from "@/components/dashboard/forYou";
import { useProfile } from "@/components/dashboard/profile";
import { cx } from "@/lib/cx";
import { FolderTiles } from "./Folders";
import { BrandGrid, Collage, Done, Heading, LearnedChips, NameRole, Progress, Ring, TasteGrid, brandsOf, categoriesOf, type Draft } from "./parts";

const TASTE = 3;
const STEPS = [
  { title: "What should we call you?", sub: "First name is fine." },
  { title: "Which industries do you work in?", sub: "Pick any. Their posts come first." },
  { title: "Brands you keep an eye on?", sub: "Optional. Their new posts go up top." },
  { title: "Tap three that stop your thumb.", sub: "No wrong answers. This is how the feed learns your taste." },
];

export default function Welcome() {
  const router = useRouter();
  const { status, profile, save } = useProfile();
  const { list: posts } = useBoards();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState<"finish" | "skip" | null>(null);
  const [failed, setFailed] = useState(false);

  // Start from what's on the profile already (empty the first time, the old answers on a redo)
  useEffect(() => {
    if (status === "ready" && !draft) setDraft({ name: profile.name, occupation: profile.occupation, industries: profile.industries, brands: profile.brands, taste: profile.taste });
  }, [status, profile, draft]);

  const list = useMemo(() => categoriesOf(posts), [posts]);
  const brands = useMemo(() => brandsOf(posts), [posts]);
  const taste = useMemo(() => posts.slice(0, 16), [posts]);
  const ranked = useMemo(() => (draft ? rank(posts, draft) : posts), [posts, draft]);

  if (!draft) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-white px-6" role="status" aria-live="polite">
        {status === "error" ? (
          <div className="max-w-sm text-center">
            <p className="text-subtitle font-medium text-base-900">We couldn’t load your profile.</p>
            <p className="mt-2 text-body text-base-600">Check your connection and reload the page.</p>
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
  const redo = !!profile.onboardedAt;
  const done = step === STEPS.length;
  const ready = [true, draft.industries.length > 0, true, draft.taste.length >= TASTE][step] ?? true;

  const finish = async () => {
    setSaving("finish");
    setFailed(false);
    const ok = await save({ ...draft, onboardedAt: new Date().toISOString() });
    setSaving(null);
    if (ok) setStep(STEPS.length);
    else setFailed(true);
  };
  // Skip keeps whatever's on the profile and only notes you've been here
  const skip = async () => {
    if (redo) return router.push("/dashboard");
    setSaving("skip");
    await save({ onboardedAt: new Date().toISOString() });
    router.replace("/dashboard");
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
          : `${draft.taste.length} of ${TASTE}. Tap the ones you’d stop on.`;

  return (
    <div className="min-h-dvh bg-white lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <section className="flex min-h-dvh flex-col px-6 py-5">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center">
          <div>
            {step > 0 && !done && (
              <button type="button" onClick={() => setStep((s) => s - 1)} aria-label="Back" className="flex size-10 items-center justify-center rounded-full text-base-900 transition-[background-color] duration-150 hover:bg-base-50">
                <CaretLeft className="size-4" />
              </button>
            )}
          </div>
          <Symbol className="size-7 text-base-900" />
          <div className="text-right">
            {!done && (
              <button type="button" onClick={skip} disabled={saving !== null} className="text-body font-medium text-base-500 hover:text-base-900 disabled:opacity-50">
                {redo ? "Cancel" : saving === "skip" ? "One moment…" : "Skip for now"}
              </button>
            )}
          </div>
        </div>

        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
          {done ? (
            <Done posts={posts} draft={draft} />
          ) : (
            <form
              key={step}
              className="welcome-rise"
              onSubmit={(e) => {
                e.preventDefault();
                if (!ready || saving) return;
                if (step === STEPS.length - 1) finish();
                else setStep((s) => s + 1);
              }}
            >
              <Progress step={step} total={STEPS.length} className="mb-8" />
              <Heading align="left" title={STEPS[step].title} sub={STEPS[step].sub} />
              <div className="mt-6">
                {step === 0 && <NameRole value={draft} onChange={patch} />}
                {step === 1 && <FolderTiles list={list} value={draft.industries} onChange={(industries) => patch({ industries })} className="grid-cols-2" />}
                {step === 2 && <BrandGrid brands={brands} value={draft.brands} onChange={(brands) => patch({ brands })} className="grid-cols-5" />}
                {step === 3 && (
                  <>
                    {/* The wall on the right is the test on wide screens; below that, it's here */}
                    <TasteGrid posts={taste.slice(0, 9)} value={draft.taste} onChange={(taste) => patch({ taste })} max={TASTE} className="grid-cols-3 lg:hidden" />
                    <div className="hidden items-center gap-3 lg:flex">
                      <Ring value={draft.taste.length} max={TASTE} className="size-9" />
                      <p className="text-title font-medium text-base-900 tabular-nums">
                        {draft.taste.length} of {TASTE}
                      </p>
                    </div>
                    <LearnedChips posts={posts} taste={draft.taste} className="mt-4" />
                  </>
                )}
              </div>
              {failed && (
                <p role="alert" className="mt-4 text-body text-danger-600">
                  We couldn’t save that. Check your connection and try again.
                </p>
              )}
              <div className="mt-8 flex items-center gap-4">
                <Button type="submit" size="base" variant="default" disabled={!ready || saving !== null} className="w-fit disabled:opacity-50">
                  {step === STEPS.length - 1 ? (saving === "finish" ? "Saving…" : "Open my feed") : "Next"}
                </Button>
                {step === 2 && (
                  <button type="button" onClick={() => setStep((s) => s + 1)} className="text-body font-medium text-base-500 hover:text-base-900">
                    No one in particular
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      </section>

      {/* Your For you, taking shape */}
      <aside className="relative hidden bg-base-50 lg:block" aria-label="Your feed, taking shape">
        <p className="absolute top-6 right-10 left-10 z-10 text-caption text-base-600" aria-live="polite">
          {caption}
        </p>
        <div className={cx("absolute inset-0 overflow-hidden px-10 pt-14 pb-10", step === 3 && !done && "overflow-y-auto")}>
          {step === 3 && !done ? (
            <TasteGrid posts={taste} value={draft.taste} onChange={(taste) => patch({ taste })} max={TASTE} className="grid-cols-4" />
          ) : (
            <Collage key={`${step}-${draft.industries.join()}-${draft.brands.join()}-${draft.taste.join()}`} posts={ranked.slice(0, 12)} />
          )}
        </div>
      </aside>
    </div>
  );
}
