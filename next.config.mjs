/** @type {import('next').NextConfig} */
const nextConfig = {
  // Every route is static. Exporting plain HTML removes the need for a
  // Workers runtime and the deprecated @cloudflare/next-on-pages adapter.
  output: "export",
  // /games/x/ -> games/x/index.html: no file/folder collisions on static hosts
  trailingSlash: true,
  reactStrictMode: true,
  poweredByHeader: false,
  images: { unoptimized: true },
};

export default nextConfig;
