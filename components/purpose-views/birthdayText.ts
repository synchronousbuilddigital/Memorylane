/* Editable text for the Birthday template. Keys match what Birthday3DLayout reads from the
   album's `content` JSON; a blank value falls back to the default. Slot 1's title and
   description are the album heading and description. */
import type { TextField } from "./familyFunctionText";

export const BIRTHDAY_TEXT_FIELDS = {
  cubes: [
    { key: "caption_0", label: "Cube caption 1", defaultValue: "Some Madness ♡" },
    { key: "caption_1", label: "Cube caption 2", defaultValue: "Good Friends ♡" },
    { key: "caption_2", label: "Cube caption 3", defaultValue: "Next Stop More Life ♡" },
    { key: "caption_3", label: "Cube caption 4", defaultValue: "Unforgettable ♡" },
    { key: "caption_4", label: "Cube caption 5", defaultValue: "Cheers ♡" },
  ],
  gift: [
    { key: "s2_title", label: "Heading (one line per row)", defaultValue: "Open\nwith love", multiline: true },
    { key: "s2_description", label: "Subtitle", defaultValue: "Every photo, a gift." },
  ],
  wheel: [
    { key: "s3_title", label: "Heading (one line per row)", defaultValue: "Ride the\nMemories", multiline: true },
    { key: "s3_description", label: "Subtitle", defaultValue: "Every cabin, a moment worth the climb." },
  ],
  tree: [
    { key: "s4_title", label: "Heading (one line per row)", defaultValue: "A Tree of\nBeautiful Moments", multiline: true },
    { key: "s4_description", label: "Subtitle", defaultValue: "Every photo a story, every branch a memory, and every light a moment we'll always keep.", multiline: true },
  ],
} satisfies Record<string, TextField[]>;
