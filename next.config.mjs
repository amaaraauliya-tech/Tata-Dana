import path from 'path';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ["images.unsplash.com", "api.telegram.org"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  webpack: (config, { dev }) => {
    if (dev) {
      config.cache = false;
    }
    config.resolve.alias = {
      ...config.resolve.alias,
      '@supabase/supabase-js': path.resolve('./node_modules/@supabase/supabase-js/dist/index.cjs'),
    };
    return config;
  },
};

export default nextConfig;
