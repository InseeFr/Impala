import type { NextConfig } from "next";
import { name, version } from "./package.json";

const nextConfig: NextConfig = {
    env: {
        NEXT_PUBLIC_NAME: name,
        NEXT_PUBLIC_VERSION: version
    },
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
