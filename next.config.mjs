/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // This is to fix a build error with genkit
    // https://github.com/firebase/genkit/issues/118
    config.resolve.fallback = {
      ...config.resolve.fallback,
      'async_hooks': false,
    };
    return config;
  },
  experimental: {
    // These packages are server-side only and should not be bundled
    serverComponentsExternalPackages: [
      '@genkit-ai/core',
      '@genkit-ai/googleai',
      '@opentelemetry/api',
      '@opentelemetry/exporter-jaeger',
      '@opentelemetry/instrumentation',
      '@opentelemetry/resources',
      '@opentelemetry/sdk-node',
      '@opentelemetry/sdk-trace-base',
      '@opentelemetry/sdk-trace-node',
      '@opentelemetry/semantic-conventions',
      'dotenv',
      'express',
      'firebase-admin',
      'handlebars',
      'long',
      'require-in-the-middle',
      'undici',
      'zod',
    ],
  },
};

export default nextConfig;
