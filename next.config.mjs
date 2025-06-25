/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // This is the key to preventing server-only dependencies from being
    // bundled into client-side code. This resolves the build instability.
    serverComponentsExternalPackages: [
      'genkit',
      '@genkit-ai/core',
      '@genkit-ai/googleai',
      'firebase-admin',
      'long',
      'protobufjs',
      'handlebars',
      'require-in-the-middle',
      // All @opentelemetry packages are server-only
      '@opentelemetry/api',
      '@opentelemetry/core',
      '@opentelemetry/exporter-jaeger',
      '@opentelemetry/instrumentation',
      '@opentelemetry/resources',
      '@opentelemetry/sdk-node',
      '@opentelemetry/sdk-trace-base',
      '@opentelemetry/sdk-trace-node',
      '@opentelemetry/semantic-conventions',
    ],
  },
};

export default nextConfig;
