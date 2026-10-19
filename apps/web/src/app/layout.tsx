import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "Physio",
    description: "Online and in-person physiotherapy, from wherever you are.",
    manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    themeColor: "#2a938b",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}