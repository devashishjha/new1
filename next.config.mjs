/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer, webpack }) => {
    if (!isServer) {
      // These are server-side dependencies that should not be bundled on the client.
      // We can ignore them with a mock.
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /@opentelemetry\/exporter-jaeger/,
        })
      );
       config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /require-in-the-middle/,
        })
      );
    }

    return config;
  },
};

export default nextConfig;
