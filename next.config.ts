import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
    resolveAlias: {
      tailwindcss: path.resolve(__dirname, "node_modules/tailwindcss"),
      "@tailwindcss/postcss": path.resolve(__dirname, "node_modules/@tailwindcss/postcss"),
    },
  },
};

export default nextConfig;
