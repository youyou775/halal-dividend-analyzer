/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },
  // yahoo-finance2 ships test files with Deno-only imports that webpack
  // otherwise tries (and fails) to bundle. It's only used inside the
  // route handler, so keep it external and let Node resolve it at runtime.
  experimental: {
    serverComponentsExternalPackages: ['yahoo-finance2'],
  },
};

export default nextConfig;
