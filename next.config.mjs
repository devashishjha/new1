/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // This is the key to preventing server-only dependencies from being bundled
    // into the client-side code, which can cause build failures.
    // We are explicitly listing packages that should only be on the server.
    serverComponentsExternalPackages: [
      'genkit',
      '@genkit-ai/googleai',
      'firebase-admin',
      'google-auth-library',
      '@google-cloud/functions-framework',
      'long',
      '@grpc/grpc-js',
      'protobufjs',
      'undici',
      'yargs',
      '@opentelemetry/api',
      '@opentelemetry/core',
      '@opentelemetry/exporter-trace-otlp-http',
      '@opentelemetry/resources',
      '@opentelemetry/sdk-trace-base',
      '@opentelemetry/sdk-trace-node',
      '@opentelemetry/semantic-conventions',
      'handlebars',
    ],
  },
};

export default nextConfig;
