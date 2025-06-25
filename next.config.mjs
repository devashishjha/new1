/** @type {import('next').NextConfig} */
const nextConfig = {
  // The `serverComponentsExternalPackages` option allows you to opt-out of
  // bundling certain packages on the server, and instead treat them as
  // external. This is useful for packages that are not compatible with
  // the Edge runtime, or that are only used on the server.
  serverComponentsExternalPackages: [
    '@google-ai/generative-ai',
    'firebase-admin',
    '@opentelemetry/api',
    '@opentelemetry/sdk-trace-base',
    'long',
    'protobufjs',
    'google-auth-library',
    'gaxios',
    'googleapis-common',
    'https-proxy-agent',
    'node-fetch',
  ],
  // The `webpack` option allows you to customize the webpack configuration.
  // In this case, we are aliasing the `firebase-admin` package to a dummy
  // module on the client-side, to avoid it being bundled and causing errors.
  webpack: (config, {isServer}) => {
    if (!isServer) {
      config.resolve.alias['firebase-admin'] = false;
    }
    return config;
  },
};

export default nextConfig;
