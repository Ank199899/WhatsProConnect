import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    serverComponentsExternalPackages: ['whatsapp-web.js'],
  },
  async rewrites() {
    return [
      // Only proxy specific backend API routes, not all API routes
      {
        source: '/api/backend/:path*',
        destination: 'http://192.168.1.230:3001/api/:path*',
      },
    ];
  },
};

export default nextConfig;
