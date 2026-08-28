"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";

/**
 * Start the Google OAuth handshake.
 *
 * Better Auth answers with the provider URL to bounce the browser to rather
 * than redirecting itself, so the redirect is ours to perform. `redirect()`
 * throws to unwind, which is why it sits outside the try.
 */
export async function signInWithGoogle(
  _prevState: { error: string } | null,
  formData: FormData,
): Promise<{ error: string } | null> {
  // Where to land after Google sends the user back. Constrained to a path so a
  // crafted form value can't turn our sign-in into an open redirect.
  const raw = (formData.get("next") as string | null) ?? "/account";
  const next = raw.startsWith("/") && !raw.startsWith("//") ? raw : "/account";

  let url: string | undefined;

  try {
    const { data, error } = await auth.signIn.social({
      provider: "google",
      callbackURL: next,
    });

    if (error) {
      return {
        error:
          error.code?.startsWith("NETWORK_") ?
            "Couldn't reach the sign-in service. Try again in a moment."
          : (error.message ?? "Couldn't start Google sign-in."),
      };
    }

    url = data?.url;
  } catch {
    return { error: "Couldn't start Google sign-in. Try again in a moment." };
  }

  if (!url) return { error: "Google sign-in is unavailable right now." };

  redirect(url);
}

export async function signOut() {
  try {
    await auth.signOut();
  } catch {
    // A failed revoke shouldn't strand the user on a page they wanted to leave.
  }
  redirect("/");
}
