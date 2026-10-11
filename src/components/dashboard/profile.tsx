"use client";

// The signed-in person's profile: their name and their onboarding answers (what they do, the
// industries, the brands, the posts that stopped their thumb), read from public.profiles in the
// browser once the page is up, like the boards. The feed ranks on them (forYou.ts) and sends
// anyone without onboarded_at to /dashboard/welcome. Saving is optimistic: the change shows at
// once and is undone if the write fails. The name is also written to the auth account's
// metadata, which is where the account menu reads it.
import { createContext, use, useEffect, useRef, useState, type ReactNode } from "react";
import { createClient } from "@/utils/supabase/client";

export type Profile = {
  name: string;
  occupation: string | null;
  // Category slugs
  industries: string[];
  // Brand slugs
  brands: string[];
  // Short codes
  taste: string[];
  onboardedAt: string | null;
};

export const EMPTY_PROFILE: Profile = { name: "", occupation: null, industries: [], brands: [], taste: [], onboardedAt: null };

type Row = { full_name: string | null; occupation: string | null; industries: string[] | null; brands: string[] | null; taste_posts: string[] | null; onboarded_at: string | null };
const COLUMNS = "full_name, occupation, industries, brands, taste_posts, onboarded_at";

type Value = {
  status: "loading" | "ready" | "error";
  profile: Profile;
  // Resolves false when the write failed (and the change was undone)
  save: (patch: Partial<Profile>) => Promise<boolean>;
};

const ProfileContext = createContext<Value | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Value["status"]>("loading");
  const [profile, setProfile] = useState<Profile>(EMPTY_PROFILE);
  const current = useRef(profile);
  current.current = profile;

  useEffect(() => {
    let gone = false;
    (async () => {
      // Row Level Security returns only the signed-in person's row
      const { data, error } = await createClient().from("profiles").select(COLUMNS).limit(1).maybeSingle<Row>();
      if (gone) return;
      if (error) return setStatus("error");
      if (data) {
        setProfile({
          name: data.full_name ?? "",
          occupation: data.occupation,
          industries: data.industries ?? [],
          brands: data.brands ?? [],
          taste: data.taste_posts ?? [],
          onboardedAt: data.onboarded_at,
        });
      }
      setStatus("ready");
    })();
    return () => {
      gone = true;
    };
  }, []);

  const save = async (patch: Partial<Profile>) => {
    const before = current.current;
    const next = { ...before, ...patch };
    setProfile(next);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setProfile(before);
      return false;
    }
    const row: Partial<Row> = {};
    if ("name" in patch) row.full_name = next.name.trim() || null;
    if ("occupation" in patch) row.occupation = next.occupation;
    if ("industries" in patch) row.industries = next.industries;
    if ("brands" in patch) row.brands = next.brands;
    if ("taste" in patch) row.taste_posts = next.taste;
    if ("onboardedAt" in patch) row.onboarded_at = next.onboardedAt;
    const { error } = await supabase.from("profiles").update(row).eq("id", user.id);
    if (error) {
      setProfile(before);
      return false;
    }
    // The account menu shows the name from the auth account, so keep that in step too
    if ("name" in patch && next.name.trim()) await supabase.auth.updateUser({ data: { full_name: next.name.trim() } });
    return true;
  };

  return <ProfileContext value={{ status, profile, save }}>{children}</ProfileContext>;
}

export function useProfile() {
  const value = use(ProfileContext);
  if (!value) throw new Error("useProfile needs ProfileProvider");
  return value;
}
