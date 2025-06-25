
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: [
      '@genkit-ai/googleai',
      '@opentelemetry/api',
      '@opentelemetry/core',
      '@opentelemetry/exporter-trace-otlp-http',
      '@opentelemetry/resources',
      '@opentelemetry/sdk-node',
      '@opentelemetry/sdk-trace-base',
      '@opentelemetry/sdk-trace-node',
      '@opentelemetry/semantic-conventions',
      'firebase-admin',
      'gaxios',
      'google-auth-library',
      'google-gax',
      'googleapis',
      'handlebars',
      'long',
    ],
  },
};

export default nextConfig;
