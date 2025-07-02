/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        allowedDevOrigins: ["https://3001-firebase-studio-1750651018378.cluster-73qgvk7hjjadkrjeyexca5ivva.cloudworkstations.dev"]
    },
    webpack: (config, { dev }) => {
        if (dev) {
          // Disabling webpack cache to work around a filesystem issue that can
          // occur in certain development environments.
          config.cache = false;
        }
        return config;
    },
};

export default nextConfig;
