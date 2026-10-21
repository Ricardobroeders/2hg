import type { RulesSection } from "@/content/rules/types";

/** The at-a-glance panel: label on the left, the number on the right. */
export function RulesFacts({
  facts,
}: {
  facts: readonly { label: string; value: string }[];
}) {
  return (
    <dl className="mt-8 rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-2">
      {facts.map((fact) => (
        <div
          key={fact.label}
          className="flex items-baseline justify-between gap-4 border-b border-white/5 py-2.5 last:border-0"
        >
          <dt className="text-sm text-zinc-400">{fact.label}</dt>
          <dd className="text-right text-sm font-medium tabular-nums text-white">
            {fact.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * Long-form sections. Rule references sit under each section rather than in a
 * footnote, so a reader checking a claim finds the rule number beside it.
 */
export function RulesSections({
  sections,
}: {
  sections: readonly RulesSection[];
}) {
  return (
    <div className="mt-12 space-y-12">
      {sections.map((section) => (
        <section key={section.heading}>
          <h2 className="text-xl font-semibold tracking-tight text-white">
            {section.heading}
          </h2>
          <div className="mt-3 space-y-3">
            {section.body.map((paragraph) => (
              <p key={paragraph} className="text-sm leading-relaxed text-zinc-400">
                {paragraph}
              </p>
            ))}
          </div>
          {section.points && (
            <ul className="mt-4 space-y-2">
              {section.points.map((point) => (
                <li
                  key={point}
                  className="flex gap-2.5 text-sm leading-relaxed text-zinc-400"
                >
                  <span
                    aria-hidden
                    className="mt-2 h-1 w-1 shrink-0 rounded-full bg-emerald-400/60"
                  />
                  {point}
                </li>
              ))}
            </ul>
          )}
          {section.ruleRefs && (
            <p className="mt-3 font-mono text-[11px] text-zinc-600">
              {section.ruleRefs.join(" · ")}
            </p>
          )}
        </section>
      ))}
    </div>
  );
}
