import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['sharp', 'tesseract.js', 'pdf-parse', 'web-push'],
};

export default nextConfig;
