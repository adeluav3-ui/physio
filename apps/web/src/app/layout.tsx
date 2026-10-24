import type { Metadata, Viewport } from "next";
import { Figtree } from "next/font/google";
import { BRAND } from "@physio/shared";
import "./globals.css";

const figtree = Figtree({
    subsets: ["latin"],
    weight: ["400", "500", "600", "700"],
    variable: "--font-sans",
    display: "swap",
});

export const metadata: Metadata = {
    title: { default: BRAND.name, template: `%s | ${BRAND.name}` },
    description: BRAND.tagline,
    manifest: "/manifest.webmanifest",
    metadataBase: new URL(process.env.APP_URL ?? "http://localhost:3000"),
    openGraph: {
        siteName: BRAND.name,
        type: "website",
    },
};

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    themeColor: "#1b766e",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" className={figtree.variable}>
            <body>{children}</body>
        </html>
    );
}
