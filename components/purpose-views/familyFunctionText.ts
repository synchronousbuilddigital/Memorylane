/* Editable text for the Family Function template.
   Each slot's words live in the album's `content` JSON under these keys; when a key is
   missing or blank the default below is shown, so nothing ever renders empty. */

export type TextField = { key: string; label: string; defaultValue: string; multiline?: boolean };

export const FF_TEXT_FIELDS = {
  hall: [
    { key: "hall.label", label: "Small label", defaultValue: "Family Gallery" },
    { key: "hall.heading", label: "Heading (one line per row)", defaultValue: "Walk Through\nOur Memories", multiline: true },
    {
      key: "hall.body",
      label: "Paragraph",
      defaultValue: "Every photograph on these walls is a real moment — a laugh, a celebration, a quiet afternoon together. Walk through and let the memories come alive.",
      multiline: true,
    },
    { key: "hall.note1", label: "Note 1", defaultValue: "Family is everything ♡" },
    { key: "hall.note2", label: "Note 2", defaultValue: "Every moment matters" },
    { key: "hall.note3", label: "Note 3", defaultValue: "Together is our favourite place" },
  ],
  projector: [
    { key: "projector.heading", label: "Heading (one line per row)", defaultValue: "Movie\nNight", multiline: true },
    { key: "projector.subtitle", label: "Subtitle — {count} becomes the number of photos", defaultValue: "A timeless collection of {count} cherished memories.", multiline: true },
  ],
  wall: [
    { key: "wall.label", label: "Small label", defaultValue: "The Family Wall" },
    { key: "wall.heading", label: "Heading", defaultValue: "Every Face, Every Moment" },
    { key: "wall.subtitle", label: "Subtitle — {count} becomes the number of photos", defaultValue: "{count} memories on wooden tiles — they turn on their own, or turn one yourself.", multiline: true },
  ],
} satisfies Record<string, TextField[]>;

export type Content = Record<string, unknown>;

// `content` arrives as an object from Prisma, or occasionally as a JSON string
export function parseContent(raw: unknown): Content {
  if (!raw) return {};
  if (typeof raw === "string") { try { return JSON.parse(raw) as Content; } catch { return {}; } }
  return typeof raw === "object" ? (raw as Content) : {};
}

export function textOf(content: Content | null | undefined, key: string, fallback: string): string {
  const v = content?.[key];
  return typeof v === "string" && v.trim().length > 0 ? v : fallback;
}

export function fillCount(s: string, count: number) {
  return s.replace(/\{count\}/g, String(count));
}

// Text with "\n" rendered as line breaks
export function lines(s: string) {
  return s.split("\n");
}
