"use client";

// Who's signed in, for the account menu and avatar. The dashboard's pages are static (the
// proxy keeps signed-out visitors away), so the user is read here in the browser, from the
// session cookie Supabase keeps. Signing out anywhere, this tab or another, goes to sign-in.
// The Avatar here is the system's Avatar atom bound to the session (2026-10-23): the picture,
// or the initials on the brand tint, and a Skeleton circle until the session is read.
import { createContext, use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { User as AuthUser } from "@supabase/supabase-js";
import AvatarAtom, { type AvatarProps } from "@/components/fundations/elements/Avatar";
import Skeleton from "@/components/fundations/elements/Skeleton";
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

// The signed-in person's picture, or their initials on the brand's tint (the Avatar atom); a
// Skeleton circle of the same size until the session is read. `decorative` when the name is
// written beside it, or the control holding it is already named
export function Avatar({ size = "md", decorative, className }: Pick<AvatarProps, "size" | "decorative" | "className">) {
  const user = useUser();
  if (!user) return <Skeleton shape="circle" size={size} className={className} />;
  return <AvatarAtom src={user.avatar} name={user.name} size={size} decorative={decorative} className={className} />;
}
