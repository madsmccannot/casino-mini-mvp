/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  turbopack: {
    // Reown's nested WalletConnect packages can ship a workspace TypeScript
    // copy of viem. Resolve all viem imports to the pinned compiled package.
    resolveAlias: { viem: './node_modules/viem' },
  },
}

module.exports = nextConfig
