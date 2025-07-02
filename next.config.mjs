/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: [
    'https://3001-firebase-studio-1750651018378.cluster-73qgvk7hjjadkrjeyexca5ivva.cloudworkstations.dev',
    'https://3002-firebase-studio-1750651018378.cluster-73qgvk7hjjadkrjeyexca5ivva.cloudworkstations.dev',
  ],
  webpack: (config, { dev }) => {
    if (dev) {
      config.cache = false;
    }
    return config;
  },
};

export default nextConfig;
