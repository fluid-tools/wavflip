/** @type {import('next').NextConfig} */
const nextConfig = {
  // async redirects() {
  //   return [
  //     {
  //       source: '/discord',
  //       destination: 'https://discord.gg/gzYXwXq2h9',
  //       permanent: true,
  //     },
  //   ];
  // },
  // async rewrites() {
  //   return [
  //     {
  //       source: '/ingest/static/:path*',
  //       destination: 'https://us-assets.i.posthog.com/static/:path*',
  //     },
  //     {
  //       source: '/ingest/:path*',
  //       destination: 'https://us.i.posthog.com/:path*',
  //     },
  //     {
  //       source: '/ingest/decide',
  //       destination: 'https://us.i.posthog.com/decide',
  //     },
  //   ];
  // },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.vercel-storage.com',
      },
      {
        protocol: 'https',
        hostname: '**.googleusercontent.com',
      },
      // youtube
      {
        protocol: 'https',
        hostname: '**.youtube.com',
      },
      {
        protocol: 'https',
        hostname: '**.ytimg.com',
      },
      // pbs.twimg.com
      {
        protocol: 'https',
        hostname: '**.pbs.twimg.com',
      },
      {
        protocol: 'https',
        hostname: '**.wavflip.com',
      },
    ],
  },
  // External packages that should be bundled separately
  // serverExternalPackages: ['@react-email/render'],
  // This is required to support PostHog trailing slash API requests
  skipTrailingSlashRedirect: true,
};

export default nextConfig;