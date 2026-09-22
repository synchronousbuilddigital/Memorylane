import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  eslint: {
    // Still on: the repo carries ~134 pre-existing lint findings (mostly
    // `no-explicit-any`). Clear those, then set this to false.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Off: the project typechecks clean, so a type error should stop a deploy.
    // This is how a missing auth check gets caught before it ships.
    ignoreBuildErrors: false,
  },
  images: {
    /* remotePatterns, not domains.

       `domains` allowlists a HOST and then permits any path on it, which made
       /_next/image an open image proxy: an unauthenticated request could pull
       any image on Unsplash or on anyone's Cloudinary account through this
       server, transformed and — on Vercel, where optimization is billed per
       source image — charged to us. A single request fetched 6MB this way.

       Scoping to our own cloud closes the Cloudinary half. Unsplash is gone
       entirely rather than scoped, because every photo there is /photo-<id>
       and there is no prefix to narrow; the stock photography it used to
       serve now lives in our own Cloudinary under memory_lane/stock.

       `domains` is deprecated in Next 14 and removed in 16, so this had to
       move regardless. */
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        // our cloud name — public, it appears in every delivery URL
        pathname: "/ttntkum2/**",
      },
    ],
    // a transformation is paid for once and then served from cache, so a long
    // life is what stops repeat visitors costing anything
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
};

export default withPWA(nextConfig);
