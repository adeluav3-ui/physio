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
    async rewrites() {
        return [
            {
                source: "/api/proxy/:path*",
                destination: `${process.env.API_URL ?? "http://localhost:4000"}/api/:path*`,
            },
        ];
    },
};

export default nextConfig;