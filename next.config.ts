import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // A POS shows live stock and sales, so pages render fresh on every request.
  cacheComponents: false,
  reactCompiler: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
