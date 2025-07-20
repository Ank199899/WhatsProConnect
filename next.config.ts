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
        destination: 'http://localhost:3001/api/:path*', // FIXED PORT: Backend always 3001
      },
    ];
  },
};

export default nextConfig;
