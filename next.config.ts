import type { NextConfig } from "next";

// موقع ثابت بالكامل (بلا خادم): يُستضاف على أي خادم ملفات أو Vercel، ويعمل دون اتصال بقاعدة بيانات.
const nextConfig: NextConfig = {
  output: "export",
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || undefined,
  trailingSlash: true,
  images: { unoptimized: true },
  turbopack: {
    root: __dirname,
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
