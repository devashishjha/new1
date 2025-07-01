/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'lh3.googleusercontent.com',
            },
            {
                protocol: 'https',
                hostname: 'placehold.co',
            },
        ],
    },
    experimental: {
    },
    allowedDevOrigins: ["3000-firebase-studio-1750651018378.cluster-73qgvk7hjjadkrjeyexca5ivva.cloudworkstations.dev"]
};

export default nextConfig;
