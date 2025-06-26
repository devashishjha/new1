
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  webpack: (config, { isServer }) => {
    // This is to solve a potential bug in genkit where it includes server-only code in the client bundle.
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        'firebase-admin': false,
      };
    }
    return config;
  },
};

export default nextConfig;
