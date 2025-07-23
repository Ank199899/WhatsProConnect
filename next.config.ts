import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for Docker
  output: 'standalone',

  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  serverExternalPackages: ['whatsapp-web.js'],

  experimental: {
    serverActions: {
      allowedOrigins: [
        'localhost:3000', 'localhost:3001',
        '127.0.0.1:3000', '127.0.0.1:3001',
        'whatsapp-frontend:3000', 'whatsapp-backend:3001'
      ]
    }
  },

  images: {
    domains: ['localhost', '127.0.0.1', 'whatsapp-frontend', 'whatsapp-backend'],
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/uploads/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '3000',
        pathname: '/uploads/**',
      },
      {
        protocol: 'http',
        hostname: 'whatsapp-frontend',
        port: '3000',
        pathname: '/uploads/**',
      }
    ]
  },

  async rewrites() {
    return [
      {
        source: '/uploads/:path*',
        destination: '/api/uploads/:path*'
      }
    ];
  },

  // Environment variables for runtime
  env: {
    WHATSAPP_BACKEND_URL: process.env.WHATSAPP_BACKEND_URL || 'http://whatsapp-backend:3006',
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3008',
  }
};

export default nextConfig;
