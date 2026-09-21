/* Bakes /public/globe/earth.webp — the equirectangular texture the globe wears.
 *
 *   node scripts/bake-globe.mjs
 *
 * It has to be a *true* equirectangular projection, because the globe places
 * pins by latitude and longitude and trusts the texture to agree with the
 * maths. x is a straight map of longitude, y a straight map of latitude, and
 * nothing is squashed or offset.
 *
 * Drawn in layers, bottom to top: ocean, land, the lat/long grid, country
 * borders, coastline. Country boundaries come from world-atlas, which is
 * Natural Earth at 1:110m — the right weight for a sphere this size. Anything
 * finer turns into noise once it is wrapped round a ball 700px wide.
 *
 * The palette is the site's: parchment sea, pale land, walnut lines, brass
 * grid. It is meant to sit on a cream page with no dark card behind it.
 */
import { mkdir } from "node:fs/promises";
import sharp from "sharp";

/* 50m, not 110m. At 110m the coastlines are so simplified that the Gulf is
   a smooth blob and small islands vanish — fine when the globe only ever sat
   at one size, obvious the moment the wheel could zoom into it. */
const SRC = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json";
const OUT_DEFAULT = "public/globe/earth.webp";
const W = 4096;
const H = 2048;

/* Palettes. Pick one with `node scripts/bake-globe.mjs <name>`, then reload.

   Two things were learned the hard way here. The land has to be darker than
   the cream page, or the sphere loses its silhouette and reads as a ghost —
   the first pass had land at #f7f1e6 against a #f8f6f3 page, a contrast
   ratio of 1.05, which is to say none. And the country borders want to be
   warm: drawn in a cool grey they sink into the land, where walnut stays
   legible and matches the rest of the site.

   `atlas-deep` is the one in use: a sea that reads as water, parchment land
   deep enough to hold its own edge against the page, walnut borders and a
   brass grid. The others are kept as alternatives — swapping is one command
   and a reload. */
const PALETTES = {
  "warm-deep": { SEA: "#b99a6a", LAND: "#efe3c9", BORDER: "#9c8258", COAST: "#5c3a1c", GRID: "#8a6a2e", AXIS: "#6f5420" },
  "atlas-teal": { SEA: "#9db9b3", LAND: "#f2e8d2", BORDER: "#8a9b93", COAST: "#3f5c55", GRID: "#b08a34", AXIS: "#8a6a1e" },
  "atlas-deep": { SEA: "#9db9b3", LAND: "#eadcbd", BORDER: "#9a8260", COAST: "#3f5c55", GRID: "#a8801f", AXIS: "#8a6a1e" },
  "atlas-warm": { SEA: "#9db9b3", LAND: "#f2e8d2", BORDER: "#a18a68", COAST: "#3f5c55", GRID: "#b08a34", AXIS: "#8a6a1e" },
  "dusk-blue": { SEA: "#a8b6c4", LAND: "#f1e7d5", BORDER: "#93a0ad", COAST: "#4a5a6b", GRID: "#b08a34", AXIS: "#8a6a1e" },
  "sepia-rich": { SEA: "#c9ab7a", LAND: "#f5ecd9", BORDER: "#a88a63", COAST: "#4a2c14", GRID: "#9a7422", AXIS: "#7d5c18" },
};

const NAME = process.argv[2] && !process.argv[2].startsWith("--") ? process.argv[2] : "atlas-deep";
const OUT_ARG = process.argv.find((a) => a.startsWith("--out="))?.slice(6);
if (!PALETTES[NAME]) {
  console.error(`\n  Unknown palette "${NAME}". Try: ${Object.keys(PALETTES).join(", ")}\n`);
  process.exit(1);
}
const { SEA, LAND, BORDER, COAST, GRID, AXIS } = PALETTES[NAME];

/* Thinner than the 110m pass: finer geometry at the old weights reads as
   clutter, because the detail and the stroke start to compete. */
const W_MINOR = 1.4;
const W_GRID = 2.2;
const W_AXIS = 3.2;
const W_BORDER = 2.4;
const W_COAST = 3.0;

/* ---- topojson, decoded by hand -------------------------------------------
   Arcs are delta-encoded against a quantised grid: each point is an offset
   from the one before, and the whole thing is scaled and translated back into
   degrees. Doing it here rather than adding a dependency for one script. */

function decodeArcs(topo) {
  const [sx, sy] = topo.transform.scale;
  const [tx, ty] = topo.transform.translate;
  return topo.arcs.map((arc) => {
    let x = 0;
    let y = 0;
    return arc.map(([dx, dy]) => {
      x += dx;
      y += dy;
      return [x * sx + tx, y * sy + ty];
    });
  });
}

/** A ring is a list of arc indices; a negative index means that arc, reversed. */
function ringOf(indices, arcs) {
  const out = [];
  for (const i of indices) {
    const arc = i < 0 ? arcs[~i].slice().reverse() : arcs[i];
    // consecutive arcs share their join point, so drop the repeat
    if (out.length) out.push(...arc.slice(1));
    else out.push(...arc);
  }
  return out;
}

/** Every ring in a geometry, whatever shape of geometry it is. */
function ringsOf(geom, arcs) {
  if (geom.type === "GeometryCollection") return geom.geometries.flatMap((g) => ringsOf(g, arcs));
  if (geom.type === "Polygon") return geom.arcs.map((r) => ringOf(r, arcs));
  if (geom.type === "MultiPolygon") return geom.arcs.flatMap((poly) => poly.map((r) => ringOf(r, arcs)));
  return [];
}

/* ---- projection ---------------------------------------------------------- */

const px = (lng) => ((lng + 180) / 360) * W;
const py = (lat) => ((90 - lat) / 180) * H;
const r1 = (n) => Math.round(n * 10) / 10;

/** A ring as an SVG path, with longitudes unwrapped.

    A ring that crosses the antimeridian arrives with its longitudes folded
    back into [-180, 180], so consecutive points can leap the whole width of
    the map. Splitting the path there leaves open subpaths that fill into
    wrong shapes — a streak across Asia, a torn Antarctica. Instead let the
    longitude run past ±180 so the ring stays one continuous loop, and draw
    the whole layer three times, one world to the left and one to the right,
    so whichever copy falls on the canvas is the one that shows. */
function pathOf(ring) {
  let d = "";
  let shift = 0;
  let prevLng = null;
  for (const [lng, lat] of ring) {
    if (prevLng !== null) {
      if (lng - prevLng > 180) shift -= 360;
      else if (lng - prevLng < -180) shift += 360;
    }
    prevLng = lng;
    d += (d === "" ? "M" : "L") + `${r1(px(lng + shift))} ${r1(py(lat))}`;
  }
  return d + "Z";
}

const pathsOf = (rings) => rings.map(pathOf).join("");

/* ---- the grid ------------------------------------------------------------ */

/* Two grids, not one. The 15° lines carry the globe at rest; the 5° lines
   are almost invisible there but give the zoomed view something to sit on,
   which is the difference between a map and a blank cream field. */
function graticule(major, minor) {
  const at = (step, skipMultiplesOf) => {
    const d = [];
    for (let lng = -180 + step; lng < 180; lng += step) {
      if (lng === 0 || (skipMultiplesOf && lng % skipMultiplesOf === 0)) continue;
      const x = r1(px(lng));
      d.push(`M${x} 0L${x} ${H}`);
    }
    for (let lat = -90 + step; lat < 90; lat += step) {
      if (lat === 0 || (skipMultiplesOf && lat % skipMultiplesOf === 0)) continue;
      const y = r1(py(lat));
      d.push(`M0 ${y}L${W} ${y}`);
    }
    return d.join("");
  };
  return {
    minor: at(minor, major),          // every 5°, but not where a 15° line already runs
    lines: at(major, 0),
    axes: `M${r1(px(0))} 0L${r1(px(0))} ${H}M0 ${r1(py(0))}L${W} ${r1(py(0))}`,
  };
}

/* ---- bake ---------------------------------------------------------------- */

const res = await fetch(SRC);
if (!res.ok) throw new Error(`Could not fetch world-atlas: ${res.status}`);
const topo = await res.json();

const arcs = decodeArcs(topo);
const land = pathsOf(ringsOf(topo.objects.land, arcs));
const countries = pathsOf(ringsOf(topo.objects.countries, arcs));
const grid = graticule(15, 5);

const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <path id="land" d="${land}"/>
    <path id="borders" d="${countries}"/>
  </defs>
  <rect width="${W}" height="${H}" fill="${SEA}"/>
${[-W, 0, W].map((dx) => `  <g transform="translate(${dx} 0)"><use xlink:href="#land" fill="${LAND}" fill-rule="evenodd"/></g>`).join("\n")}
  <path d="${grid.minor}" fill="none" stroke="${GRID}" stroke-width="${W_MINOR}" stroke-opacity="0.20"/>
  <path d="${grid.lines}" fill="none" stroke="${GRID}" stroke-width="${W_GRID}" stroke-opacity="0.42"/>
  <path d="${grid.axes}" fill="none" stroke="${AXIS}" stroke-width="${W_AXIS}" stroke-opacity="0.6"/>
${[-W, 0, W].map((dx) => `  <g transform="translate(${dx} 0)"><use xlink:href="#borders" fill="none" stroke="${BORDER}" stroke-width="${W_BORDER}" stroke-linejoin="round"/></g>`).join("\n")}
${[-W, 0, W].map((dx) => `  <g transform="translate(${dx} 0)"><use xlink:href="#land" fill="none" stroke="${COAST}" stroke-width="${W_COAST}" stroke-linejoin="round"/></g>`).join("\n")}
</svg>`;

const OUT = OUT_ARG || OUT_DEFAULT;
await mkdir(OUT.slice(0, OUT.lastIndexOf("/")) || ".", { recursive: true });
await sharp(Buffer.from(svg), { density: 72 })
  .resize(W, H)
  .webp({ quality: 88, effort: 6 })
  .toFile(OUT);

const stat = await (await import("node:fs/promises")).stat(OUT);

console.log(`\n  ${OUT} — ${W}x${H}, ${(stat.size / 1024).toFixed(0)}KB, palette "${NAME}"`);
console.log(`  countries: ${topo.objects.countries.geometries.length}, grid every 15°`);
