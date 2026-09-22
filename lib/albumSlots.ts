import { FF_TEXT_FIELDS, type TextField } from "@/components/purpose-views/familyFunctionText";
import { BIRTHDAY_TEXT_FIELDS } from "@/components/purpose-views/birthdayText";

/* Which picture-slots each template has.

   `position` on an Image is not an ordering index — it is the slot the
   picture belongs to. That is why several images share a position, and why
   the numbers have gaps: family-classic has no slot 2 because its template
   has nothing there. Anything that decides a position by counting the images
   already in an album is therefore wrong; it would produce a number that is
   not a slot at all, and the picture would render nowhere.

   These used to live inside FixedSlotEditor, which is a client component, so
   the server had no way to tell a real slot from a made-up one. They are
   here so the editor and the API can agree on the same definition. The
   layout components stay in the editor — this is only the data. */

export type SlotConfig = {
  label: string;
  dbPosition: number;
  allowMultiple?: boolean;
  maxFiles?: number;
  textFields?: TextField[];
};

export const SLOTS_BY_THEME: Record<string, SlotConfig[]> = {
  "family-classic": [
    { label: "Hero Background Slideshow", allowMultiple: true, maxFiles: 6, dbPosition: 0 },
    { label: "Animated Photo Ribbon", allowMultiple: true, maxFiles: 20, dbPosition: 1 },
    { label: "Interactive Scrapbook", allowMultiple: true, maxFiles: 20, dbPosition: 3 },
    { label: "Floating 3D Parallax Stack", allowMultiple: true, maxFiles: 15, dbPosition: 4 },
  ],
  "family-mosaic": [
    { label: "Large Horizontal (Top)", dbPosition: 0 },
    { label: "Small Square 1", dbPosition: 1 },
    { label: "Small Square 2", dbPosition: 2 },
    { label: "Tall Vertical (Right)", dbPosition: 3 },
    { label: "Large Horizontal (Middle)", dbPosition: 4 },
    { label: "Small Square 3", dbPosition: 5 },
    { label: "Tall Vertical (Left)", dbPosition: 6 },
    { label: "Small Square 4", dbPosition: 7 },
  ],
  "travel-suitcase": [
    { label: "Suitcase Polaroids (10-15)", allowMultiple: true, maxFiles: 15, dbPosition: 0 },
    { label: "Map Journey (10-15 images)", allowMultiple: true, maxFiles: 15, dbPosition: 1 },
    { label: "3D Tunnel Experience (8-24 images)", allowMultiple: true, maxFiles: 24, dbPosition: 2 },
    { label: "3D Vintage Astrolabe (up to 12 images)", allowMultiple: true, maxFiles: 12, dbPosition: 3 },
  ],
  "event-birthday": [
    { label: "Floating Lanterns (10-15 images)", allowMultiple: true, maxFiles: 15, dbPosition: 0, textFields: BIRTHDAY_TEXT_FIELDS.cubes },
    { label: "3D Gift Box Unwrap (5-10 images)", allowMultiple: true, maxFiles: 10, dbPosition: 1, textFields: BIRTHDAY_TEXT_FIELDS.gift },
    { label: "Ferris Wheel (10-24 images)", allowMultiple: true, maxFiles: 24, dbPosition: 2, textFields: BIRTHDAY_TEXT_FIELDS.wheel },
    { label: "Magical Wishing Tree (10-14 images)", allowMultiple: true, maxFiles: 14, dbPosition: 3, textFields: BIRTHDAY_TEXT_FIELDS.tree },
  ],
  "event-family": [
    { label: "3D Spiraling Filmstrip (up to 50 images)", allowMultiple: true, maxFiles: 50, dbPosition: 0 },
    { label: "3D Hallway Gallery (up to 20 images)", allowMultiple: true, maxFiles: 20, dbPosition: 1, textFields: FF_TEXT_FIELDS.hall },
    { label: "Vintage Movie Projector (Infinite images)", allowMultiple: true, maxFiles: 100, dbPosition: 2, textFields: FF_TEXT_FIELDS.projector },
    { label: "Flip-Cube Photo Wall (up to 60 images)", allowMultiple: true, maxFiles: 60, dbPosition: 3, textFields: FF_TEXT_FIELDS.wall },
  ],
};

/* Two themes are older names for the same layouts, and albums still carry
   them, so they have to keep resolving to the same slots. */
const ALIASES: Record<string, string> = {
  ribbon: "family-classic",
  everyday: "family-mosaic",
};

export function slotsForTheme(theme: string | null | undefined): SlotConfig[] {
  if (!theme) return [];
  return SLOTS_BY_THEME[ALIASES[theme] ?? theme] ?? [];
}

/** The slot at this position, or null when the template has no such slot. */
export function slotAt(theme: string | null | undefined, position: number): SlotConfig | null {
  return slotsForTheme(theme).find((s) => s.dbPosition === position) ?? null;
}
