import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, Section } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "What Two-Headed Giant collects, why, where it is stored, and how to have it deleted.",
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated="2026-08-28"
      intro="Two-Headed Giant is run by Ricardo Broeders, based in the Netherlands. This page describes exactly what the site collects and what it does not. It is deliberately specific rather than generic, because most of the answers here are “nothing”."
    >
      <Section heading="The short version">
        <ul>
          <li>
            You can browse cards, build a team and share it{" "}
            <strong>without an account</strong>.
          </li>
          <li>
            There are <strong>no analytics, no advertising and no tracking
            scripts</strong> on this site. No third-party tag of any kind is
            loaded.
          </li>
          <li>We do not sell or share your data, and we send no marketing email.</li>
          <li>
            Pairings you share are <strong>public to anyone with the link</strong>.
          </li>
        </ul>
      </Section>

      <Section heading="What we collect">
        <p>
          <strong>If you never sign in:</strong> we store the team pairing you
          choose to save — its name, deck names, commanders, card names and
          quantities, and the time it was created or changed. It is not linked
          to you. Your browser holds a secret edit token that lets you change it
          later.
        </p>
        <p>
          <strong>If you sign in with Google:</strong> we receive and store your
          name, email address, profile picture URL and a Google account
          identifier. We ask Google only for <code>email</code>,{" "}
          <code>profile</code> and <code>openid</code> — never your Gmail,
          contacts, Drive or anything else. Pairings you save while signed in
          are linked to your account.
        </p>
        <p>
          <strong>In your browser:</strong> the deck builder keeps your
          in-progress decks, a cache of card data and a reference to your share
          link in <code>localStorage</code>. That stays on your device and is
          never sent to us except when you press share.
        </p>
        <p>
          <strong>Server logs:</strong> our host records standard request logs
          including IP address, user agent and requested path. We do not use
          them to build a profile of you.
        </p>
      </Section>

      <Section heading="Cookies">
        <p>
          We set cookies only to keep you signed in. There is a short-lived
          cookie during the Google sign-in handshake, and a session cookie
          afterwards. Both are strictly necessary — without them login cannot
          work.
        </p>
        <p>
          There are <strong>no advertising, analytics or profiling cookies</strong>.
          If you never sign in, we set no cookies at all.
        </p>
      </Section>

      <Section heading="Who else sees your data">
        <ul>
          <li>
            <strong>Neon</strong> (a Databricks company) hosts our database and
            authentication. Your account and pairings live in a Postgres
            database in Frankfurt, Germany (EU).
          </li>
          <li>
            <strong>Vercel</strong> hosts and serves the site, and processes
            request logs.
          </li>
          <li>
            <strong>Google</strong> — only if you choose to sign in with Google.
            Google tells us who you are; we tell Google nothing about you.
          </li>
          <li>
            <strong>Scryfall</strong> provides card data and images. Card images
            load directly from Scryfall in your browser, so{" "}
            <strong>your IP address is visible to Scryfall</strong> whenever you
            view a page showing card art. This is true whether or not you have
            an account.
          </li>
          <li>
            <strong>Card marketplaces</strong> — TCGplayer, Card Kingdom and
            Cardmarket. We never send them your data. Buy links are affiliate
            links carrying only a partner code, and we may earn a commission if
            you purchase. Once you follow one, that marketplace&apos;s own
            privacy policy applies.
          </li>
        </ul>
      </Section>

      <Section heading="Share links are public">
        <p>
          A saved pairing gets an unlisted address like{" "}
          <code>/t/abc123</code>. The address is hard to guess, but it is{" "}
          <strong>not private</strong>: anyone you send it to can open it, it
          can be forwarded, and it is built to be indexed by search engines so
          that pairings are discoverable. Do not put anything in a deck or team
          name that you would not want published.
        </p>
      </Section>

      <Section heading="How long we keep it">
        <p>
          Pairings are kept until they are deleted. Account data is kept while
          your account exists. Ask us to delete either and we will.
        </p>
      </Section>

      <Section heading="Your rights">
        <p>
          Under the GDPR you may request a copy of your data, have it corrected
          or erased, object to how it is used, or ask for it in a portable
          format. Email{" "}
          <a href="mailto:info@ricardobroeders.nl">info@ricardobroeders.nl</a>{" "}
          and we will act on it.
        </p>
        <p>
          If you are unhappy with how we handle a request, you can complain to
          the Dutch data protection authority, the{" "}
          <a
            href="https://autoriteitpersoonsgegevens.nl"
            target="_blank"
            rel="noopener noreferrer"
          >
            Autoriteit Persoonsgegevens
          </a>
          .
        </p>
      </Section>

      <Section heading="Children">
        <p>
          This site is not directed at children under 16. If you believe a child
          has given us personal data, contact us and we will remove it.
        </p>
      </Section>

      <Section heading="Changes and contact">
        <p>
          If this policy changes materially we will update the date at the top.
          Questions go to{" "}
          <a href="mailto:info@ricardobroeders.nl">info@ricardobroeders.nl</a>.
        </p>
        <p>
          See also our <Link href="/terms">Terms of Service</Link>.
        </p>
      </Section>
    </LegalPage>
  );
}
