/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  // This app never uses next/image, so disable the built-in image
  // optimization API route entirely (closes its attack surface rather
  // than relying on staying patched for a feature we don't use).
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
