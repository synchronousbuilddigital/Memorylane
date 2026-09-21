/* Renders an equirectangular texture onto a sphere, offline.

   It reproduces what the page actually does: three shades a Lambertian
   surface as irradiance x albedo / PI, with the same ambient 2.55 and
   directional 0.62 the component uses, and composites onto the same cream
   page colour. So a preview here is what the browser will show. */
import sharp from "sharp";

const PAGE = [0xf8, 0xf6, 0xf3];
const AMB = 2.55, DIR = 0.62;
const L = (() => { const v = [3, 2, 5], n = Math.hypot(...v); return v.map((c) => c / n); })();

const toLin = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
const toSrgb = (v) => { v = Math.max(0, Math.min(1, v)); return 255 * (v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.4) - 0.055); };

export async function renderSphere(texPath, { size = 420, lat0 = 22, lng0 = 78, rim = true } = {}) {
  const { data: tex, info } = await sharp(texPath).raw().toBuffer({ resolveWithObject: true });
  const TW = info.width, TH = info.height, TC = info.channels;
  const out = Buffer.alloc(size * size * 3);
  const R = size / 2 - 2;
  const p0 = (lat0 * Math.PI) / 180;
  const sinP0 = Math.sin(p0), cosP0 = Math.cos(p0);

  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      const X = (px - size / 2 + 0.5) / R;
      const Y = -(py - size / 2 + 0.5) / R;
      const r2 = X * X + Y * Y;
      const o = (py * size + px) * 3;
      if (r2 > 1) {
        // just off the edge, lay a soft walnut rim so the sphere has a boundary
        const d = Math.sqrt(r2);
        const a = rim && d < 1.035 ? (1 - (d - 1) / 0.035) * 0.3 : 0;
        for (let c = 0; c < 3; c++) out[o + c] = PAGE[c] * (1 - a) + [0x8a, 0x75, 0x5b][c] * a;
        continue;
      }
      const Z = Math.sqrt(1 - r2);
      const lat = Math.asin(Z * sinP0 + Y * cosP0);
      const lng = (lng0 * Math.PI) / 180 + Math.atan2(X, Z * cosP0 - Y * sinP0);
      let u = ((lng / Math.PI) * 0.5 + 0.5) % 1; if (u < 0) u += 1;
      const v = 0.5 - lat / Math.PI;
      const tx = Math.min(TW - 1, Math.max(0, Math.round(u * TW)));
      const ty = Math.min(TH - 1, Math.max(0, Math.round(v * TH)));
      const ti = (ty * TW + tx) * TC;
      const ndl = Math.max(0, X * L[0] + Y * L[1] + Z * L[2]);
      const f = (AMB + DIR * ndl) / Math.PI;
      for (let c = 0; c < 3; c++) out[o + c] = toSrgb(toLin(tex[ti + c]) * f);
    }
  }
  return sharp(out, { raw: { width: size, height: size, channels: 3 } });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [tex, dest, sizeS] = process.argv.slice(2);
  (await renderSphere(tex, { size: Number(sizeS || 420) })).png().toFile(dest).then(() => console.log("  ->", dest));
}
