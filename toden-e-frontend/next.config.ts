// In your next.config.ts file

import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // The only change is this line: from "redirects" to "rewrites"
  async rewrites() {
    return [
      {
        source: '/',
        destination: '/home',
      },
      // Note: "permanent: true" is not used for rewrites
    ];
  },
};

export default nextConfig;