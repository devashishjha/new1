/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    allowedDevOrigins: ["*.cloudworkstations.dev"],
  },
  webpack: (config) => {
    // This configuration helps suppress warnings from 'genkit' and its dependencies.
    // These warnings are related to optional features (like specific tracing exporters)
    // and older library patterns that are not critical to the application's function.
    // By marking them as "external", we tell Next.js not to bundle them, which cleans up the build output.
    config.externals.push(
      '@opentelemetry/exporter-jaeger',
      '@opentelemetry/instrumentation',
      'handlebars'
    );
    return config;
  },
};

module.exports = nextConfig;
