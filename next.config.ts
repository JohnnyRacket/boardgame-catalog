import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  serverExternalPackages: ['pg', 'unpdf', 'archiver', 'unzipper'],
  experimental: {
    // Photo-add sends a downscaled photo through a server action (default limit is 1MB)
    serverActions: { bodySizeLimit: '6mb' },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
}

export default nextConfig
