import type { NextConfig } from "next";
import { backendUrl } from "./src/lib/backendUrl";
import { securityHeaders } from "./src/lib/securityHeaders";
import packageInfo from "./package.json";

const nextConfig: NextConfig = {
  transpilePackages: ["@nbg/shared", "@nbg/art"],
  // Only the version reaches the pages (the footer shows it), not the whole manifest.
  env: { NEXT_PUBLIC_APP_VERSION: packageInfo.version },
  async headers() {
    // The same address as the client: the policy has to allow the backend the page talks to.
    return [{ source: "/(.*)", headers: securityHeaders(backendUrl(), process.env.NODE_ENV !== "production") }];
  },
};

export default nextConfig;
