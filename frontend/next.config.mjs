import path from 'node:path';

const backendApiUrl = (process.env.BACKEND_API_URL || 'http://localhost:4000/api').replace(/\/+$/, '');

const nextConfig = {
  poweredByHeader: false,
  turbopack: {
    root: path.resolve(process.cwd(), '..'),
  },
  async rewrites() {
    return [
      {
        source: '/uploads/:path*',
        destination: `${backendApiUrl}/uploads/:path*`,
      },
      {
        source: '/api/:path*',
        destination: `${backendApiUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
