"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@physio/ui";

export function SignOutButton() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    async function signOut() {
        setLoading(true);
        try {
            await fetch("/api/session", { method: "DELETE" });
            router.push("/auth/login");
            router.refresh();
        } finally {
            setLoading(false);
        }
    }

    return (
        <Button variant="ghost" size="sm" onClick={signOut} loading={loading}>
            Sign out
        </Button>
    );
}