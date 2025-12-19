/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Esta parte resolve problemas com bibliotecas Solana antigas
  webpack: (config) => {
    config.resolve.fallback = { 
      fs: false, 
      path: false, 
      os: false, 
      crypto: false 
    };
    return config;
  },
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
}

module.exports = nextConfig