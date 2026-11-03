import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // The floating dev badge sits on top of the sidebar's footer controls.
  devIndicators: false,
}

export default nextConfig
