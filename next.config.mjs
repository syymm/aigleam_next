/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: [],
  },
  // 确保中间件在开发模式下正确执行
  async rewrites() {
    return [];
  },
  async redirects() {
    return [];
  },
};

export default nextConfig;
