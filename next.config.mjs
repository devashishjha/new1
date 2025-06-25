/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // This option instructs Next.js to keep these packages on the server side
    // and not bundle them for the client. This is essential for libraries like
    // Genkit that have server-only dependencies.
    serverComponentsExternalPackages: [
      '@genkit-ai/googleai',
      '@google-cloud/functions-framework',
      'express',
      'firebase-admin',
      'long',
      'protobufjs',
      '@grpc/grpc-js',
      'gaxios',
      'google-auth-library',
      'googleapis',
      'googleapis-common',
      '@opentelemetry/api',
      '@opentelemetry/core',
      '@opentelemetry/sdk-trace-base',
      'handlebars',
    ],
  },
};

export default nextConfig;
