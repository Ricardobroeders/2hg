import type { Metadata } from "next";
import Link from "next/link";
import { SignInForm } from "./SignInForm";

export const metadata: Metadata = {
  title: "Sign in",
  description:
    "Sign in to keep your 2HG team pairings across devices. Building and sharing works without an account.",
  // Nothing here should ever rank.
  robots: { index: false, follow: false },
};

export default async function SignInPage({
  searchParams,
}: PageProps<"/auth/sign-in">) {
  const params = await searchParams;
  const raw = params.next;
  const next = typeof raw === "string" ? raw : "/account";

  return (
    <div className="mx-auto flex max-w-md flex-col justify-center px-4 py-20 sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight text-white">
        Sign in
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-zinc-400">
        Keeps your pairings across devices and puts your name on the ones you
        share.
      </p>

      <SignInForm next={next} />

      <p className="mt-8 border-t border-white/10 pt-6 text-xs leading-relaxed text-zinc-500">
        You don&apos;t need an account to build a team or send a share link —
        that works signed out and always will.{" "}
        <Link
          href="/team"
          className="text-zinc-400 underline underline-offset-2 hover:text-zinc-200"
        >
          Back to the builder
        </Link>
        .
      </p>
    </div>
  );
}
