import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  serverExternalPackages: ['whatsapp-web.js'],
  async rewrites() {
    return [
      // Only proxy specific backend API routes, not all API routes
      {
        source: '/api/backend/:path*',
        destination: 'http://192.168.1.230:3006/api/:path*', // Production IP and Backend Port
      },
    ];
  },
};

export default nextConfig;
