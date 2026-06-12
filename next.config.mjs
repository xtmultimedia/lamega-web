/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  // mysql2 is required at runtime by lib/prisma.ts. Mark it external so the
  // standalone tracer copies it (and its full dep tree) into the bundle.
  experimental: {
    serverComponentsExternalPackages: ["mysql2"],
  },
};

export default nextConfig;
