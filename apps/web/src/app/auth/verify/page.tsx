"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button, Card } from "@physio/ui";

function VerifyContent() {
    const router = useRouter();
    const params = useSearchParams();
    const token = params.get("token");
    const email = params.get("email");
    const dev = params.get("dev") === "1";
    const next = params.get("next") ?? "/app";

    const [status, setStatus] = useState<"working" | "success" | "error">("working");
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function verify() {
            try {
                if (dev) {
                    const res = await fetch("/api/proxy/auth/dev-verify", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ email }),
                    });
                    if (!res.ok) {
                        const b = await res.json().catch(() => ({}));
                        throw new Error(b.message ?? "Dev verify failed");
                    }
                    setStatus("success");
                    return;
                }

                if (!token) throw new Error("Missing verification token");

                const res = await fetch("/api/proxy/auth/verify-email", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ token }),
                });
                if (!res.ok) {
                    const b = await res.json().catch(() => ({}));
                    throw new Error(b.message ?? "Verification failed");
                }
                setStatus("success");
            } catch (err) {
                setError((err as Error).message);
                setStatus("error");
            }
        }
        verify();
    }, [token, email, dev]);

    if (status === "working") {
        return <p className="text-sm text-text-muted">Verifying your email…</p>;
    }

    if (status === "success") {
        return (
            <>
                <h1 className="text-2xl font-semibold">Email verified</h1>
                <p className="mt-3 text-sm text-text-muted">Your account is active. You can now sign in.</p>
                <Button
                    className="mt-6"
                    fullWidth
                    onClick={() => router.push(`/auth/login?next=${encodeURIComponent(next)}`)}
                >
                    Go to sign in
                </Button>
            </>
        );
    }

    return (
        <>
            <h1 className="text-2xl font-semibold text-danger-700">Verification failed</h1>
            <p className="mt-3 text-sm text-text-muted">{error}</p>
            <Button className="mt-6" variant="secondary" fullWidth onClick={() => router.push("/auth/login")}>
                Back to sign in
            </Button>
        </>
    );
}

export default function VerifyPage() {
    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <Card className="w-full max-w-md p-8 text-center">
                <Suspense fallback={<p className="text-sm text-text-muted">Loading…</p>}>
                    <VerifyContent />
                </Suspense>
            </Card>
        </div>
    );
}