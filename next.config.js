/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Allow the Manus sandbox proxy domain for cross-origin dev requests on mobile
  allowedDevOrigins: [
    '3000-imfu25n3gb9p57i9cck3w-41dae113.us2.manus.computer',
    '*.manus.computer',
  ],
};

module.exports = nextConfig;
