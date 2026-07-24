/** @type {import('next').NextConfig} */
const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "base-uri 'self'",
      "connect-src 'self'",
      "font-src 'self' data:",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "img-src 'self' data: blob: https://*.r2.cloudflarestorage.com https://*.r2.dev",
      "media-src 'self' blob:",
      "object-src 'none'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "worker-src 'self' blob:",
      "upgrade-insecure-requests"
    ].join("; ")
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload"
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff"
  },
  {
    key: "X-Frame-Options",
    value: "DENY"
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin"
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), geolocation=(), microphone=(), payment=(), usb=()"
  }
];

const nextConfig = {
  output: "standalone",
  devIndicators: false,
  experimental: {
    optimizePackageImports: ["lucide-react"]
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
        headers: securityHeaders,
        source: "/:path*"
      },
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
