import type { NextConfig } from "next";

/** Backend origin for server-side rewrites (not exposed to the browser). */
const API_ORIGIN = (process.env.API_URL ?? "http://localhost:3000").replace(
  /\/$/,
  ""
);

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${API_ORIGIN}/:path*`,
      },
    ];
  },
};

export default nextConfig;
