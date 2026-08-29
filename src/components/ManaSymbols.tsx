/**
 * Renders Scryfall mana symbols as artwork instead of `{3}{B}` literals.
 *
 * Scryfall writes every symbol as a braced token, in both `mana_cost` and
 * inside oracle text, so one tokenizer serves both. The filename for a token
 * is the token lowercased with the braces and slashes removed — `{W/U}` is
 * `wu.svg`, `{2/W}` is `2w.svg`, `{B/G/P}` is `bgp.svg`.
 */

/** Tokens whose glyph can't be a filename. */
const ALIASES: Record<string, string> = { "½": "half", "∞": "infinity" };

/**
 * Every file in `public/images/mana`. An unknown token falls back to its raw
 * text rather than a broken image, so a symbol printed on some future set
 * degrades to `{N}` instead of vanishing.
 *
 * Regenerate with:
 *   ls public/images/mana | sed 's/\.svg$//' | sort | tr '\n' ' '
 */
const AVAILABLE = new Set(
  ("0 1 10 100 1000000 11 12 13 14 15 16 17 18 19 2 20 2b 2g 2r 2u 2w 3 4 5 6 7 8 9 a b bg " +
    "bgp bp br brp c cb cg chaos cp cr cu cw d e g gp gu gup gw gwp h half hr hw infinity l " +
    "p pw q r rg rgp rp rw rwp s t t-alt t-original tk u ub ubp up ur urp w wb wbp wp wu wup x y z"
  ).split(" "),
);

function fileFor(token: string): string | null {
  const inner = token.slice(1, -1);
  const name = ALIASES[inner] ?? inner.replace(/\//g, "").toLowerCase();
  return AVAILABLE.has(name) ? name : null;
}

/** Matches a single braced symbol, capturing so `split` keeps the delimiters. */
const SYMBOL = /(\{[^{}]{1,10}\})/g;

/**
 * Non-global twin of SYMBOL. Deliberately separate: `.test()` on a /g regex
 * advances its `lastIndex`, so reusing SYMBOL here would match every other
 * call and drop half the symbols.
 */
const IS_SYMBOL = /^\{[^{}]{1,10}\}$/;

type Size = "sm" | "md" | "lg";

/** Heights, in `em`, so symbols track whatever type size they sit in. */
const SIZES: Record<Size, string> = {
  sm: "h-[0.9em]",
  md: "h-[1.05em]",
  lg: "h-[1.25em]",
};

function Symbol({ token, size }: { token: string; size: Size }) {
  const file = fileFor(token);

  if (!file) {
    // Unrecognised symbol — show the token so the card still reads correctly.
    return <span className="font-mono text-[0.9em]">{token}</span>;
  }

  return (
    // Width is left to the intrinsic aspect ratio: most symbols are circles,
    // but a few ({1000000}, {∞}) are wide pills and must not be squashed.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/images/mana/${file}.svg`}
      alt={token}
      className={`inline-block w-auto shrink-0 align-[-0.14em] ${SIZES[size]}`}
    />
  );
}

/**
 * A mana cost on its own — `{3}{B}`. Symbols get a hair of tracking between
 * them, the way they're printed on a card.
 */
export function ManaCost({
  cost,
  size = "md",
  className = "",
}: {
  cost?: string | null;
  size?: Size;
  className?: string;
}) {
  if (!cost) return null;

  const tokens = cost.match(SYMBOL);
  if (!tokens?.length) return null;

  return (
    <span
      className={`inline-flex items-center gap-[0.12em] ${className}`}
      // The alt text of each image would otherwise be read as "{3} {B}".
      aria-label={`Mana cost ${cost}`}
      role="img"
    >
      {tokens.map((token, i) => (
        <Symbol key={`${token}-${i}`} token={token} size={size} />
      ))}
    </span>
  );
}

/**
 * Prose with symbols embedded — oracle text, reminder text, rules quotes.
 * Newlines are preserved by the caller's `whitespace-pre-line`.
 */
export function ManaText({
  text,
  size = "sm",
}: {
  text?: string | null;
  size?: Size;
}) {
  if (!text) return null;

  return (
    <>
      {text.split(SYMBOL).map((part, i) =>
        IS_SYMBOL.test(part) ? (
          <Symbol key={i} token={part} size={size} />
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}
