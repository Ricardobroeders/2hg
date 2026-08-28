"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";

/**
 * Sign-in itself runs in the browser (see `SignInForm`) because the OAuth
 * challenge cookie has to be set on the browser directly. Sign-out is safe to
 * do server-side: there's no handshake, just a revoke and a cleared cookie.
 */
export async function signOut() {
  try {
    await auth.signOut();
  } catch {
    // A failed revoke shouldn't strand the user on a page they wanted to leave.
  }
  redirect("/");
}
