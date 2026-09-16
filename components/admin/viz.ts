/* Chart parameters for the admin panel.
   One warm series colour, validated against the cream chart surface (#fcfbf9):
   lightness band, chroma floor and >=3:1 contrast all pass. Every chart here is a
   single series, so there is no categorical palette to cycle. */
export const VIZ = {
  surface: "#fcfbf9",
  series: "#a07a2c",
  seriesSoft: "rgba(160,122,44,0.16)",
  grid: "#e8e0d5",
  axis: "#d9cbb8",
  ink: "#1c1917",
  secondary: "#5a4d41",
  muted: "#a3907a",
} as const;

/** A round number at or above the data's peak, so the top gridline reads cleanly. */
export function niceMax(max: number): number {
  if (max <= 0) return 1;
  const pow = 10 ** Math.floor(Math.log10(max));
  for (const step of [1, 2, 2.5, 5, 10]) {
    const candidate = step * pow;
    if (candidate >= max) return candidate;
  }
  return 10 * pow;
}
