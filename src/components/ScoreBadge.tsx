import { tierColor, type TwoHgScore } from "@/lib/twohg-score";

export function ScoreBadge({
  score,
  size = "sm",
}: {
  score: TwoHgScore;
  size?: "sm" | "lg";
}) {
  const lg = size === "lg";
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full shadow-sm shadow-black/40 ring-1 ring-inset ${tierColor(
        score.tier,
      )} ${lg ? "px-3 py-1.5 text-sm" : "px-2 py-0.5 text-xs"} font-medium`}
      title={score.summary}
    >
      <span className="tabular-nums font-semibold">{score.score}</span>
      <span className="opacity-75">{score.tier}</span>
    </span>
  );
}

/**
 * The score as a ribbon folded into the top-left corner of the card art.
 *
 * Only the number shows. The tier word ("Strong in 2HG") was a pill lying
 * across the card's printed name — the one thing you scan a grid of art for —
 * and the hue already carries the tier, so the word was paying rent twice.
 *
 * Colour is not information a screen reader gets, so the tier still goes out
 * as text; it reads as part of the enclosing link's name.
 *
 * The triangle is a clip-path on a plain square rather than the design's SVG:
 * the parent's `overflow-hidden rounded-xl` supplies the rounded corner for
 * free, so the badge follows the tile's radius instead of hard-coding it.
 */
export function ScoreCorner({ score }: { score: TwoHgScore }) {
  return (
    <span
      className={`absolute left-0 top-0 size-11 [clip-path:polygon(0_0,100%_0,0_100%)] ${tierColor(
        score.tier,
      )}`}
      title={score.summary}
    >
      {/* Parallel to the hypotenuse and centred on the inner half of the
          square — the geometry the design specifies, as fractions so it holds
          if the badge is resized. */}
      <span
        aria-hidden="true"
        className="absolute left-[6.7%] top-[6.7%] grid size-[52%] -rotate-45 place-items-center text-[13px] font-bold leading-none tabular-nums"
      >
        {score.score}
      </span>
      <span className="sr-only">
        2HG score {score.score}, {score.tier}
      </span>
    </span>
  );
}

/** Horizontal 0–100 meter with the neutral baseline marked at 50. */
export function ScoreMeter({ score }: { score: TwoHgScore }) {
  return (
    <div className="space-y-1.5">
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-sky-400 to-emerald-400"
          style={{ width: `${score.score}%` }}
        />
        <div className="absolute inset-y-0 left-1/2 w-px bg-white/40" />
      </div>
      <div className="flex justify-between text-[11px] text-zinc-500">
        <span>Weak in 2HG</span>
        <span>Neutral</span>
        <span>Format staple</span>
      </div>
    </div>
  );
}
