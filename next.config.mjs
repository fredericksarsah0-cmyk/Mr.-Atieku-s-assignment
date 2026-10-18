/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    serverComponentsExternalPackages: ["@node-rs/argon2", "@prisma/client"],
  },
};

export default nextConfig;
