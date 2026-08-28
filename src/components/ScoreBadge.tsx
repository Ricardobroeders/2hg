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
