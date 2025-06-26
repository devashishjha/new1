/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: [
      '@genkit-ai/googleai',
      'genkit',
      '@google-cloud/functions-framework',
      'firebase-admin',
      'gaxios',
      'google-auth-library',
      'google-gax',
      '@grpc/grpc-js',
      'long',
      'protobufjs',
      '@genkit-ai/core',
      'express',
      'handlebars',
      '@opentelemetry/api',
      '@opentelemetry/core',
      '@opentelemetry/exporter-trace-otlp-http',
      '@opentelemetry/instrumentation',
      '@opentelemetry/resources',
      '@opentelemetry/sdk-trace-base',
      '@opentelemetry/sdk-trace-node',
      '@opentelemetry/semantic-conventions',
    ],
  },
  webpack: (config, { isServer }) => {
    // This is to fix a build issue with gRPC, which is a dependency of google-gax used by Genkit.
    // It prevents webpack from trying to bundle the native gRPC module.
    if (isServer) {
        config.externals.push({
            '@grpc/grpc-js': 'commonjs @grpc/grpc-js',
        });
    }
    return config;
  },
};

export default nextConfig;
