/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    transpilePackages: ["@physio/ui", "@physio/shared"],
    images: {
        remotePatterns: [
            { protocol: "https", hostname: "**.cloudflarestream.com" },
            { protocol: "https", hostname: "**.mux.com" },
            { protocol: "https", hostname: "**.r2.cloudflarestorage.com" },
        ],
    },
    webpack: (config) => {
        config.resolve.extensionAlias = {
            ".js": [".ts", ".tsx", ".js"],
            ".mjs": [".mts", ".mjs"],
        };
        return config;
    },
};

export default nextConfig;