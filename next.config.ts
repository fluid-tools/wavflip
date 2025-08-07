/** @type {import('next').NextConfig} */
import { withBotId } from 'botid/next/config';

const nextConfig = withBotId({
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
      {
        protocol: 'https',
        hostname: '**.s3.us-east-1.amazonaws.com',
      },
    ],
  },
  skipTrailingSlashRedirect: true,
})

export default nextConfig