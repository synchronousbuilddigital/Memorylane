import GlobalLoader from "@/components/GlobalLoader";

/* Shown by Next.js while a page's server data is still being fetched */
export default function Loading() {
  return <GlobalLoader mode="loading" />;
}
