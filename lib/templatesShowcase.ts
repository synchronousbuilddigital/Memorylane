/* The templates as the home page presents them. One source of truth for the showcase,
   the hero's counts, and the live numbers — add a template here and every section follows. */
export type ShowcaseTemplate = {
  id: "family" | "travel" | "birthday" | "family-function";
  chapter: string;
  name: string;
  kicker: string;
  tagline: string;
  description: string;
  scenes: string[];
  image: string;
  loop: string;
  tone: "light" | "dark";
  note: string;
};

export const SHOWCASE: ShowcaseTemplate[] = [
  {
    id: "family",
    chapter: "01",
    name: "Family",
    kicker: "A scrapbook that breathes",
    tagline: "Little moments, big stories ♡",
    description: "A warm, cream-paper scrapbook. Photos hang from a ribbon, a slideshow fills the hero, and a 3D stack of prints floats beside the story you write.",
    scenes: ["Hero slideshow", "Photo ribbon", "Interactive scrapbook", "Floating 3D stack"],
    image: "/templates/family.jpg",
    loop: "/templates/family.webp",
    tone: "light",
    note: "Different memories, same love",
  },
  {
    id: "travel",
    chapter: "02",
    name: "Travel",
    kicker: "Every journey, unpacked",
    tagline: "Somewhere new ♡",
    description: "A leather suitcase that unlocks to reveal your trip: polaroids inside, a map that traces the route, a tunnel of moments, and an astrolabe that spins through the places you went.",
    scenes: ["Suitcase reveal", "Map journey", "3D tunnel", "Vintage astrolabe"],
    image: "/templates/travel.jpg",
    loop: "/templates/travel.webp",
    tone: "dark",
    note: "Same places, different you",
  },
  {
    id: "birthday",
    chapter: "03",
    name: "Birthday",
    kicker: "A night sky of wishes",
    tagline: "Let's celebrate ♡",
    description: "Photo cubes drift up through a sky of lanterns, a gift box unwraps into your pictures, a brass ferris wheel turns, and wishes hang from a blossoming tree.",
    scenes: ["Floating photo cubes", "Gift box unwrap", "Ferris wheel", "Wishing tree"],
    image: "/templates/birthday.jpg",
    loop: "/templates/birthday.webp",
    tone: "dark",
    note: "High on moments",
  },
  {
    id: "family-function",
    chapter: "04",
    name: "Family Function",
    kicker: "The whole clan, on film",
    tagline: "Together is our favourite place ♡",
    description: "A spiralling filmstrip winds through a candlelit room, a walnut hallway hangs your photographs in brass frames, a projector rolls a movie night, and a wall of wooden cubes turns to show every face.",
    scenes: ["3D spiralling filmstrip", "Hallway gallery", "Movie projector", "Flip-cube wall"],
    image: "/templates/family-function.jpg",
    loop: "/templates/family-function.webp",
    tone: "dark",
    note: "Family is everything",
  },
];

export const SCENE_COUNT = SHOWCASE.reduce((n, t) => n + t.scenes.length, 0);
