import { z } from "zod";
import { FF_TEXT_FIELDS, type TextField } from "@/components/purpose-views/familyFunctionText";
import { BIRTHDAY_TEXT_FIELDS } from "@/components/purpose-views/birthdayText";

/* ---- limits ---------------------------------------------------------------

   None of this was checked before: the editor had no maxLength and the action
   had no validation, so a title could be a megabyte long. A server action is
   an HTTP endpoint, so maxLength alone would only have been a suggestion to a
   cooperating browser — the check that counts is this one.

   The caption limits are derived from the templates' own defaults rather than
   picked out of the air: the longest shipped single-line default is 103
   characters and the longest multiline one 166, so these leave room to write
   more without letting a caption break the layout it sits in. */
export const TITLE_MAX = 80;
export const DESCRIPTION_MAX = 300;
export const FIELD_MAX = 120;            // a single-line caption or heading
export const FIELD_MULTILINE_MAX = 400;  // a paragraph

/* The album's `content` is a JSON blob. It used to be typed `any` and merged
   straight into whatever was already stored, so any key, of any type, at any
   size could be written into it.

   Bounding it by an allowlist of keys was the first instinct and it was
   wrong. Fields are declared in three different ways: the two text-field
   modules below, inline `onContentChange("key", …)` calls scattered through
   the layout components, and vKey/lKey pairs in the travel stats. An
   allowlist covers the 22 declared ones and would have silently dropped
   every edit made through the other ten — the same quiet data loss this was
   meant to prevent, just moved.

   So the declared fields get their own exact limits, and anything else is
   allowed through but held to a plain string, a sane key, and a length. That
   still closes what mattered: no objects, no arrays, no unbounded growth. */
const TEXT_FIELDS: TextField[] = [
  ...Object.values(FF_TEXT_FIELDS).flat(),
  ...Object.values(BIRTHDAY_TEXT_FIELDS).flat(),
];
const FIELD_BY_KEY = new Map(TEXT_FIELDS.map((f) => [f.key, f]));

/** 32 keys are in use today; this is headroom, not a target. */
export const MAX_CONTENT_KEYS = 200;
const KEY_SHAPE = /^[A-Za-z0-9_.]{1,64}$/;

export function checkContent(
  content: unknown,
): { ok: true; value: Record<string, string> } | { ok: false; error: string } {
  if (content === null || typeof content !== "object" || Array.isArray(content)) {
    return { ok: false, error: "That text could not be saved" };
  }
  const entries = Object.entries(content as Record<string, unknown>);
  if (entries.length > MAX_CONTENT_KEYS) {
    return { ok: false, error: "That is too much text for one album" };
  }

  const out: Record<string, string> = {};
  for (const [key, raw] of entries) {
    if (!KEY_SHAPE.test(key)) return { ok: false, error: "That text could not be saved" };
    if (typeof raw !== "string") return { ok: false, error: "That text could not be saved" };

    const field = FIELD_BY_KEY.get(key);
    const max = field ? (field.multiline ? FIELD_MULTILINE_MAX : FIELD_MAX) : FIELD_MULTILINE_MAX;
    if (raw.length > max) {
      const what = field ? `"${field.label}"` : "That text";
      return { ok: false, error: `${what} is too long — keep it under ${max} characters` };
    }
    out[key] = raw;
  }
  return { ok: true, value: out };
}

export const Title = z.string().trim().min(1, "Please give the album a heading").max(TITLE_MAX, `Keep the heading under ${TITLE_MAX} characters`);
export const Description = z.string().trim().max(DESCRIPTION_MAX, `Keep the description under ${DESCRIPTION_MAX} characters`);

/* updateSectionTheme and updateCustomCss used to live here. Nothing in the
   app called either — they were server actions with no caller, which still
   means an HTTP endpoint any signed-in user could reach. updateCustomCss was
   the one worth removing quickly: it stored an unchecked URL that a public
   album page rendered as <link rel="stylesheet">, so it handed anyone a way
   to load arbitrary CSS into somebody else's shared page. Deleted rather than
   validated, because dead code cannot be made safe, only smaller. */

