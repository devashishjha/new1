/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer, dev }) => {
    if (dev && !isServer) {
      config.cache = false;
    }
    return config;
  },
  allowedDevOrigins: [
    'https://3000-firebase-studio-1750651018378.cluster-73qgvk7hjjadkrjeyexca5ivva.cloudworkstations.dev',
    'https://3001-firebase-studio-1750651018378.cluster-73qgvk7hjjadkrjeyexca5ivva.cloudworkstations.dev',
    'https://3002-firebase-studio-1750651018378.cluster-73qgvk7hjjadkrjeyexca5ivva.cloudworkstations.dev',
    'https://6000-firebase-studio-1750651018378.cluster-73qgvk7hjjadkrjeyexca5ivva.cloudworkstations.dev',
    'https://9000-firebase-studio-1750651018378.cluster-73qgvk7hjjadkrjeyexca5ivva.cloudworkstations.dev',
  ],
};

export default nextConfig;
