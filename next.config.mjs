/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer, webpack }) => {
    if (!isServer) {
      // Exclude server-only packages from client-side bundle
      config.resolve.fallback = {
        ...config.resolve.fallback,
        'firebase-admin': false,
        'require-in-the-middle': false,
        'express': false,
        '@opentelemetry/exporter-jaeger': false,
        'handlebars': false,
      };
    }

    // Workaround for https://github.com/firebase/genkit/issues/238
    config.plugins.push(new webpack.IgnorePlugin({
        resourceRegExp: /^pre-compiled-content$/
    }));

    return config;
  },
};

export default nextConfig;
