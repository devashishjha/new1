import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    // These packages are required by Genkit, but are not used in the client-side
    // bundle. This prevents webpack from trying to bundle them, which would
    // cause a build failure.
    if (!isServer) {
        config.externals.push(
            '@opentelemetry/exporter-jaeger',
            'handlebars'
        );
    }
    return config;
  }
};

export default nextConfig;
