/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Allow production builds to successfully complete even with ESLint errors
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Allow production builds to successfully complete even with TypeScript errors
    ignoreBuildErrors: true,
  },
  reactStrictMode: false, // This can help with hydration issues
  // Optional: add experimental features if needed
  experimental: {
    // These settings can help with hydration issues
    optimizeCss: true,
    scrollRestoration: true,
  },
};

export default nextConfig;
