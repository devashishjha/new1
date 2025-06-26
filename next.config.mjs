/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // This option prevents server-side packages from being bundled with browser-targeted code.
    // This is crucial for fixing build errors related to server-only dependencies like those used by Genkit.
    serverComponentsExternalPackages: [
      '@genkit-ai/googleai',
      'genkit',
      'firebase-admin',
      '@google-ai/generativelanguage',
      '@google-cloud/firestore',
      '@google-cloud/functions',
      '@google-cloud/storage',
      'google-auth-library',
      'google-gax',
      'long',
      '@grpc/grpc-js',
      'protobufjs',
      'undici',
    ],
  },
  webpack: (config, { isServer }) => {
    // This fixes a known issue with the gRPC library in Next.js by forcing
    // webpack to handle it as an external module on the server.
    if (isServer) {
      config.externals.push({
        '@grpc/grpc-js': 'commonjs @grpc/grpc-js',
      });
    }
    return config;
  },
};

export default nextConfig;
