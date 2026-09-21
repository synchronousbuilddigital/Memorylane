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
    domains: ["images.unsplash.com", "res.cloudinary.com"],
  },
};

export default withPWA(nextConfig);
