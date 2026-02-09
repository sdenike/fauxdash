const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
  fallbacks: {
    document: "/offline",
  },
  runtimeCaching: [
    // Exclude backup, restore, and settings API routes from caching
    {
      urlPattern: /\/api\/backup/,
      handler: 'NetworkOnly',
    },
    {
      urlPattern: /\/api\/restore/,
      handler: 'NetworkOnly',
    },
    {
      urlPattern: /\/api\/settings/,
      handler: 'NetworkOnly',
    },
    // Never cache auth routes (OAuth state/cookies must always hit the server)
    {
      urlPattern: /\/api\/auth\//,
      handler: 'NetworkOnly',
    },
    // Default API route handling
    {
      urlPattern: ({ sameOrigin, url: { pathname } }) =>
        sameOrigin && pathname.startsWith('/api/') && !pathname.startsWith('/api/auth/'),
      handler: 'NetworkFirst',
      options: {
        cacheName: 'apis',
        networkTimeoutSeconds: 10,
        expiration: {
          maxEntries: 16,
          maxAgeSeconds: 86400,
        },
      },
    },
  ],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  turbopack: {},
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
}

module.exports = withPWA(nextConfig)
