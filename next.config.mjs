/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Genkit and its dependencies include server-side code that should not be bundled
    // in the client-side build. This configuration prevents them from being processed
    // by Webpack for the browser, resolving the silent startup crash.
    if (!isServer) {
      config.externals.push('@genkit-ai/googleai');
      config.externals.push('firebase-admin');
    }

    // The 'handlebars' package, a dependency of Genkit, requires a specific alias
    // to be resolved correctly by Webpack during the build process.
    config.resolve.alias.handlebars = 'handlebars/dist/handlebars.js';
    
    return config;
  },
};

export default nextConfig;
