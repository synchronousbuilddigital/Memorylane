/* A faint handmade-paper grain over the whole page, the same texture the login page uses,
   generated inline so it never depends on a third-party host. */
const NOISE = encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.36  0 0 0 0 0.29  0 0 0 0 0.21  0 0 0 0.5 0'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>`,
);

export default function PaperGrain() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[1] opacity-[0.16] mix-blend-multiply"
      style={{ backgroundImage: `url("data:image/svg+xml,${NOISE}")`, backgroundSize: "240px 240px" }}
    />
  );
}
