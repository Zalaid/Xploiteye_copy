/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: 'export',
  trailingSlash: false,
  pageExtensions: ['js', 'jsx', 'ts', 'tsx'],
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  images: {
    unoptimized: true,
    domains: ['localhost'],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8000/api/:path*',
      },
      {
        source: '/web-results/:path*',
        destination: 'http://localhost:8000/web-results/:path*',
      },
      {
        source: '/web-scanner/:path*',
        destination: 'http://localhost:8000/web-scanner/:path*',
      },
    ];
  },
}

module.exports = nextConfig