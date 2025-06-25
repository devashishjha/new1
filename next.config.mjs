
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // This option tells Next.js to not bundle these packages and their dependencies
    // into the client-side JavaScript, as they are only used on the server.
    // This resolves build errors caused by server-only code.
    serverComponentsExternalPackages: ['@genkit-ai/googleai', 'genkit'],
  },
};

export default nextConfig;
