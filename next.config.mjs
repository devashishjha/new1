/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        // This is a workaround for a Webpack caching issue that can occur in some dev environments.
        webpackCache: false,
    },
    // This is to allow cross-origin requests from the development environment.
    allowedDevOrigins: ["https://*.cloudworkstations.dev"],
};

export default nextConfig;
