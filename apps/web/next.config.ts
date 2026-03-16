import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  transpilePackages: ["@ai-diary/ui", "@ai-diary/types"],
  outputFileTracingRoot: path.join(__dirname, "../../"),
};

export default nextConfig;
