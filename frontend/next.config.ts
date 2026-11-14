import type { NextConfig } from "next";
import { securityHeaders } from "./src/lib/securityHeaders";

const nextConfig: NextConfig = {
  transpilePackages: ["@nbg/shared"],
  async headers() {
    // The same default as the client (src/lib/socket.ts): the policy has to allow the backend the page talks to.
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000";
    return [{ source: "/(.*)", headers: securityHeaders(socketUrl, process.env.NODE_ENV !== "production") }];
  },
};

export default nextConfig;
