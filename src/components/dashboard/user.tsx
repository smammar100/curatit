"use client";

// Who's signed in, for the account menu and avatar. The dashboard's pages are static (the
// proxy keeps signed-out visitors away), so the user is read here in the browser, from the
// session cookie Supabase keeps. Signing out anywhere, this tab or another, goes to sign-in.
// The Avatar here is Glaze's Avatar bound to the session (2026-10-24): the picture, or the
// initials, and a Skeleton circle of the same size until the session is read.
import { createContext, use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { User as AuthUser } from "@supabase/supabase-js";
import { Avatar as GlazeAvatar } from "@/components/glaze/ui/avatar";
import { Skeleton } from "@/components/glaze/ui/skeleton";
import { cn } from "@/lib/glaze/utils";
import { identify, resetAnalytics } from "@/lib/analytics";
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

// The signed-in person's picture, or their initials (Glaze's Avatar); a Skeleton circle of the
// same size until the session is read. `decorative` when the name is written beside it, or the
// control holding it is already named
const SKELETON = { xs: "size-4", sm: "size-5", default: "size-6", lg: "size-8" } as const;
export function Avatar({ size = "default", decorative, className }: { size?: keyof typeof SKELETON; decorative?: boolean; className?: string }) {
  const user = useUser();
  if (!user) return <Skeleton className={cn(SKELETON[size], "rounded-pill", className)} />;
  return <GlazeAvatar src={user.avatar ?? undefined} name={user.name} size={size} decorative={decorative} className={className} />;
}
