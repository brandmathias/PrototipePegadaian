/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  experimental: {
    optimizePackageImports: ["lucide-react"],
    inlineCss: true
  },
  images: {
    deviceSizes: [360, 414, 640, 768, 1024, 1280, 1536],
    formats: ["image/avif", "image/webp"],
    imageSizes: [64, 96, 128, 256, 384],
    minimumCacheTTL: 86400,
    qualities: [60, 68, 72, 75],
    remotePatterns: [
      {
        hostname: "**.r2.cloudflarestorage.com",
        protocol: "https"
      },
      {
        hostname: "**.r2.dev",
        protocol: "https"
      }
    ]
  },
  async headers() {
    return [
      {
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable"
          }
        ],
        source: "/uploads/:path*"
      },
      {
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable"
          }
        ],
        source: "/brand/:path*"
      },
      {
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable"
          }
        ],
        source: "/assets/:path*"
      }
    ];
  }
};

export default nextConfig;
