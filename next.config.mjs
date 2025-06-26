/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // This is the crucial part. It tells Next.js that these packages
    // should not be bundled for the browser, as they are server-only.
    serverComponentsExternalPackages: [
      '@google-ai/generativelanguage',
      'google-auth-library',
      'google-gax',
      '@opentelemetry/api',
      '@opentelemetry/sdk-trace-base',
      'handlebars',
      'long',
      'protobufjs',
      '@grpc/grpc-js',
    ],
  },
};

export default nextConfig;
