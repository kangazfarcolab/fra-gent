/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  rewrites: async () => {
    return [
      {
        source: '/api/:path*',
        destination: 'http://backend:8000/api/:path*',
      },
    ];
  },
}

module.exports = nextConfig
