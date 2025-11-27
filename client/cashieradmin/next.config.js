/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Don't run ESLint during production builds
    // ESLint should be run separately in CI/CD
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
