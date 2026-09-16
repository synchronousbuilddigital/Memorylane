/* How an album's stored purpose/theme maps to the template a user actually picked. */
export const TEMPLATE_ORDER = ["family", "travel", "birthday", "family-function", "party", "other"] as const;
export type TemplateKey = (typeof TEMPLATE_ORDER)[number];

const LABELS: Record<TemplateKey, string> = {
  family: "Family",
  travel: "Travel",
  birthday: "Birthday",
  "family-function": "Family Function",
  party: "Party",
  other: "Other",
};

export function templateKey(purpose?: string | null, theme?: string | null): TemplateKey {
  const p = (purpose ?? "").toLowerCase();
  if ((TEMPLATE_ORDER as readonly string[]).includes(p) && p !== "other") return p as TemplateKey;
  if (theme?.includes("birthday")) return "birthday";
  if (theme?.includes("family")) return "family";
  if (theme?.includes("travel")) return "travel";
  return "other";
}

export const templateLabel = (k: TemplateKey) => LABELS[k];
export const templateLabelFor = (purpose?: string | null, theme?: string | null) => LABELS[templateKey(purpose, theme)];
