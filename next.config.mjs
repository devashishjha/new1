
/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // These packages are server-side dependencies of genkit and should not be
    // bundled into the client-side application, as they can cause build errors.
    if (!isServer) {
      // By marking them as external, we tell Webpack to ignore them for the client bundle.
      config.externals.push(
        '@opentelemetry/exporter-jaeger',
        'require-in-the-middle',
        'handlebars'
      );
    }

    return config;
  },
};

export default nextConfig;
