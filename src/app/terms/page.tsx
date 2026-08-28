import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, Section } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "The terms for using Two-Headed Giant, including what our card ratings are and are not.",
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      updated="2026-08-28"
      intro="These terms cover your use of Two-Headed Giant, a card database and team-pairing tool for Magic: The Gathering's Two-Headed Giant format, operated by Ricardo Broeders in the Netherlands. By using the site you accept them."
    >
      <Section heading="What this site is">
        <p>
          Two-Headed Giant rates cards and evaluates two decks as a team for the
          Two-Headed Giant format. It is an independent project in active
          development. Features may change or disappear, and the site may be
          unavailable at times.
        </p>
      </Section>

      <Section heading="Our ratings are opinions, not facts">
        <p>
          The 2HG rating and any pairing analysis are{" "}
          <strong>heuristics derived from card text</strong>, not measured
          results from real play. They are our reasoned opinion about how the
          format changes a card&apos;s value, and every card page shows the
          rules that produced its score so you can judge them yourself.
        </p>
        <p>
          <strong>
            Do not treat anything here as an authoritative ruling on legality or
            on what will win a game.
          </strong>{" "}
          Format rules and card legality change. Before an event, confirm the
          rules with the official source and with your organiser.
        </p>
      </Section>

      <Section heading="Accounts">
        <p>
          You do not need an account. If you create one via Google, keep access
          to that Google account secure — anyone who controls it controls your
          pairings. You must be at least 16. Tell us at{" "}
          <a href="mailto:info@ricardobroeders.nl">info@ricardobroeders.nl</a>{" "}
          if you want your account deleted.
        </p>
      </Section>

      <Section heading="What you post">
        <p>
          Decklists and team names you save remain yours. By saving one you give
          us permission to store it and to display it to anyone holding its
          share link, which is what makes sharing work. You confirm you have the
          right to post what you post.
        </p>
        <p>
          Shared pairings are public to anyone with the link and are intended to
          be discoverable by search engines. Do not put personal information,
          abusive content, or anything unlawful into a deck or team name. We may
          remove content that breaks these terms.
        </p>
      </Section>

      <Section heading="Acceptable use">
        <ul>
          <li>Do not scrape, overload or attempt to disrupt the service.</li>
          <li>Do not attempt to access pairings or accounts that are not yours.</li>
          <li>Do not use the site to break the law or infringe others&apos; rights.</li>
        </ul>
      </Section>

      <Section heading="Affiliate links">
        <p>
          Buy links to TCGplayer, Card Kingdom and Cardmarket are affiliate
          links, and we may earn a commission on purchases made through them at
          no extra cost to you. This never changes a card&apos;s rating —
          ratings are produced before and independently of any pricing or
          commission.
        </p>
        <p>
          Prices and stock come from those marketplaces and may be out of date.
          Any purchase is a contract between you and that marketplace, not us.
        </p>
      </Section>

      <Section heading="Magic: The Gathering and Scryfall">
        <p>
          Two-Headed Giant is unofficial fan content. It is{" "}
          <strong>not produced by, endorsed by, or affiliated with Wizards of
          the Coast</strong>. Magic: The Gathering, card names, card images and
          related marks are property of Wizards of the Coast LLC.
        </p>
        <p>
          Card data and images are provided by{" "}
          <a
            href="https://scryfall.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            Scryfall
          </a>
          , who are likewise not affiliated with this site.
        </p>
      </Section>

      <Section heading="No warranty, and limits on liability">
        <p>
          The site is provided &ldquo;as is&rdquo;. We do not guarantee that it
          will be available, accurate, or free of errors, and we do not warrant
          that any rating or suggestion will improve your results.
        </p>
        <p>
          To the extent the law allows, we are not liable for indirect or
          consequential loss, lost data, or losses arising from tournament
          outcomes or purchases made through links here. Nothing in these terms
          limits liability that cannot lawfully be limited.
        </p>
      </Section>

      <Section heading="Ending access">
        <p>
          You may stop using the site at any time and ask us to delete your
          account and pairings. We may suspend access that breaks these terms or
          threatens the service.
        </p>
      </Section>

      <Section heading="Governing law and changes">
        <p>
          These terms are governed by the law of the Netherlands, and the Dutch
          courts have jurisdiction. Nothing here removes consumer rights you
          have under the law of your own country.
        </p>
        <p>
          If these terms change materially we will update the date at the top.
          Questions go to{" "}
          <a href="mailto:info@ricardobroeders.nl">info@ricardobroeders.nl</a>.
        </p>
        <p>
          See also our <Link href="/privacy">Privacy Policy</Link>.
        </p>
      </Section>
    </LegalPage>
  );
}
