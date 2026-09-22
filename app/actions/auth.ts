"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { checkCredentials, createAccount, endSession, pruneSessions, startSession } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { rateLimit } from "@/lib/security";

export type AuthState = { error: string | null; email: string };

/** Only allow same-site relative redirects (no `//evil.com`). */
function safeNext(value: FormDataEntryValue | null) {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/") && !next.startsWith("//") ? next : "/library";
}

const emailSchema = z.string().trim().email("Enter a valid email address.").max(254);
const passwordSchema = z
  .string()
  .min(10, "Use at least 10 characters for your password.")
  .max(200, "That password is too long.");

export async function signInAction(_state: AuthState, form: FormData): Promise<AuthState> {
  const email = String(form.get("email") ?? "");
  const password = String(form.get("password") ?? "");

  try {
    rateLimit(`signin:${email.toLowerCase()}`, 10);
  } catch (error) {
    if (error instanceof AppError) return { error: error.message, email };
    throw error;
  }

  const userId = email && password ? checkCredentials(email, password) : null;
  if (!userId) return { error: "That email and password don't match an account.", email };

  pruneSessions();
  await startSession(userId);
  redirect(safeNext(form.get("next")));
}

export async function signUpAction(_state: AuthState, form: FormData): Promise<AuthState> {
  const email = String(form.get("email") ?? "");
  const password = String(form.get("password") ?? "");
  const confirm = String(form.get("confirm") ?? "");

  const parsedEmail = emailSchema.safeParse(email);
  if (!parsedEmail.success) return { error: parsedEmail.error.issues[0].message, email };
  const parsedPassword = passwordSchema.safeParse(password);
  if (!parsedPassword.success) return { error: parsedPassword.error.issues[0].message, email };
  if (password !== confirm) return { error: "The passwords don't match.", email };

  let userId: string;
  try {
    rateLimit("signup:global", 30);
    userId = createAccount(parsedEmail.data, password);
  } catch (error) {
    if (error instanceof AppError) return { error: error.message, email };
    throw error;
  }

  await startSession(userId);
  redirect(safeNext(form.get("next")));
}

export async function signOutAction() {
  await endSession();
  redirect("/");
}
