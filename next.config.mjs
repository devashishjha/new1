/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { dev }) => {
    // This is a workaround for a Webpack caching issue that can occur in some
    // development environments. Disabling the cache prevents the `ENOENT` error.
    if (dev) {
      config.cache = false;
    }
    return config;
  },
  // This is needed to allow the Next.js dev server to work correctly in the web-based IDE.
  allowedDevOrigins: [
      'https://*.cloudworkstations.dev',
  ],
};

export default nextConfig;
