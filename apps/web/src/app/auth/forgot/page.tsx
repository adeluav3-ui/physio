"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, Card, Input } from "@physio/ui";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [done, setDone] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            const res = await fetch("/api/proxy/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            if (!res.ok) {
                const b = await res.json().catch(() => ({}));
                throw new Error(b.message ?? "Request failed");
            }
            setDone(true);
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
                    <h1 className="text-2xl font-semibold">Check your email</h1>
                    <p className="mt-3 text-sm text-text-muted">
                        If an account exists for <strong>{email}</strong>, a reset link has been sent.
                    </p>
                    <Link
                        href="/auth/login"
                        className="mt-6 inline-block text-sm font-medium text-primary-600 underline"
                    >
                        Back to sign in
                    </Link>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <Card className="w-full max-w-md p-8">
                <h1 className="text-2xl font-semibold">Forgot your password?</h1>
                <p className="mt-2 text-sm text-text-muted">
                    Enter your email and we'll send you a reset link.
                </p>
                <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
                    <Input
                        label="Email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    {error && <p className="text-sm text-danger-700">{error}</p>}
                    <Button type="submit" loading={loading} fullWidth>
                        Send reset link
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