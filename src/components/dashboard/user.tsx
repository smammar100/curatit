"use client";

// Who's signed in, for the account menu and avatar. The dashboard's pages are static (the
// proxy keeps signed-out visitors away), so the user is read here in the browser, from the
// session cookie Supabase keeps. Signing out anywhere, this tab or another, goes to sign-in.
import { createContext, use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { User as AuthUser } from "@supabase/supabase-js";
import { identify, resetAnalytics } from "@/lib/analytics";
import { cx } from "@/lib/cx";
import { createClient } from "@/utils/supabase/client";

export type User = { name: string; email: string; avatar: string | null };

const UserContext = createContext<User | null>(null);

// Google gives full_name and avatar_url (the same fields public.profiles is filled from); an
// email sign-up has neither, so the name is the address's first part
function fromAuth(user: AuthUser): User {
  const meta = user.user_metadata ?? {};
  const email = user.email ?? "";
  return {
    name: meta.full_name || meta.name || email.split("@")[0] || "You",
    email,
    avatar: meta.avatar_url || meta.picture || null,
  };
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const { data } = createClient().auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        resetAnalytics();
        setUser(null);
        return router.replace("/signin");
      }

      if (session?.user && (event === "INITIAL_SESSION" || event === "SIGNED_IN")) {
        const currentUser = fromAuth(session.user);
        identify(session.user.id, {
          name: currentUser.name,
          ...(session.user.email ? { email: session.user.email } : {}),
        });
        setUser(currentUser);
        return;
      }

      setUser(session?.user ? fromAuth(session.user) : null);
    });
    return () => data.subscription.unsubscribe();
  }, [router]);

  return <UserContext value={user}>{children}</UserContext>;
}

export const useUser = () => use(UserContext);

const initials = (name: string) =>
  name
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");

// The signed-in person's picture, or their initials on the brand's tint; an empty circle until the
// session is read
export function Avatar({ className }: { className?: string }) {
  const user = useUser();
  const [broken, setBroken] = useState(false);
  const base = cx("flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full text-caption font-medium", className);
  if (!user) return <span aria-hidden="true" className={cx(base, "bg-component")} />;
  if (user.avatar && !broken) {
    return (
      // Google's avatar host isn't in next.config's image list, and it's 96px: a plain img
      <img src={user.avatar} alt={user.name} referrerPolicy="no-referrer" onError={() => setBroken(true)} className={cx(base, "bg-component object-cover")} />
    );
  }
  return (
    <span role="img" aria-label={user.name} className={cx(base, "bg-brand-subtle text-on-brand-subtle-foreground")}>
      {initials(user.name)}
    </span>
  );
}
