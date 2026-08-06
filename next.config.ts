import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: [
      "framer-motion",
      "recharts",
      "lucide-react",
      "radix-ui",
      "@radix-ui/react-slot",
    ],
  },
};

export default nextConfig;
