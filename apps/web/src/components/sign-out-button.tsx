"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function SignOutButton({
    style,
    className,
    children,
}: {
    style?: React.CSSProperties;
    className?: string;
    children?: React.ReactNode;
}) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    async function signOut() {
        setLoading(true);
        await fetch("/api/session", { method: "DELETE" }).catch(() => {});
        router.push("/");
        router.refresh();
    }

    return (
        <button
            type="button"
            onClick={signOut}
            disabled={loading}
            className={className}
            style={style}
        >
            {loading ? "Signing out…" : (children ?? "Sign out")}
        </button>
    );
}
