import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    /* config options here */
    async rewrites() {
        return [
            {
                source: "/:path*",
                destination: "/pages/:path*"
            }
        ];
    }
};

export default nextConfig;
