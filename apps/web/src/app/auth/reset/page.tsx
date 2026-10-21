"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Card, Input } from "@physio/ui";

function ResetContent() {
    const router = useRouter();
    const params = useSearchParams();
    const token = params.get("token");

    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [done, setDone] = useState(false);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        if (!token) {
            setError("Missing reset token. Open the link from your email.");
            return;
        }
        if (password !== confirm) {
            setError("Passwords do not match");
            return;
        }
        if (password.length < 10) {
            setError("Password must be at least 10 characters");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/proxy/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, password }),
            });
            if (!res.ok) {
                const b = await res.json().catch(() => ({}));
                throw new Error(b.message ?? "Reset failed");
            }
            setDone(true);
            setTimeout(() => router.push("/auth/login"), 1500);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    }

    if (done) {
        return (
            <div className="flex min-h-screen items-center justify-center p-4">
                <Card className="w-full max-w-md p-8 text-center">
                    <h1 className="text-2xl font-semibold">Password updated</h1>
                    <p className="mt-3 text-sm text-text-muted">
                        Redirecting to sign in…
                    </p>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <Card className="w-full max-w-md p-8">
                <h1 className="text-2xl font-semibold">Set a new password</h1>
                <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
                    <Input
                        label="New password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        hint="At least 10 characters, with a letter and a number"
                        required
                    />
                    <Input
                        label="Confirm new password"
                        type="password"
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        required
                    />
                    {error && <p className="text-sm text-danger-700">{error}</p>}
                    <Button type="submit" loading={loading} fullWidth>
                        Save new password
                    </Button>
                </form>
                <p className="mt-4 text-center text-sm text-text-muted">
                    <Link href="/auth/login" className="text-primary-600 underline">
                        Back to sign in
                    </Link>
                </p>
            </Card>
        </div>
    );
}

export default function ResetPage() {
    return (
        <Suspense fallback={<div className="flex min-h-screen items-center justify-center p-4"><Card className="w-full max-w-md p-8 text-center"><p className="text-sm text-text-muted">Loading…</p></Card></div>}>
            <ResetContent />
        </Suspense>
    );
}