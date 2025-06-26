/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // This option tells Next.js to keep specified packages on the server,
    // preventing them from being incorrectly bundled into client-side code.
    // This is crucial for fixing module-not-found errors related to server-only libraries.
    serverComponentsExternalPackages: [
      '@genkit-ai/googleai',
      'genkit',
      'zod',
      '@google-cloud/functions-framework',
      'firebase-functions',
      'express',
      // @grpc/grpc-js is a native dependency used by Google's AI libraries and
      // is a common cause of build failures if not externalized.
      '@grpc/grpc-js'
    ],
  },
  webpack: (config) => {
    // This rule ensures that any native Node.js modules (.node files)
    // are correctly handled by webpack, which is another common requirement
    // for libraries like @grpc/grpc-js.
    config.module.rules.push({
      test: /\.node$/,
      use: 'node-loader',
    });

    // Return the modified configuration.
    return config;
  },
};

export default nextConfig;
