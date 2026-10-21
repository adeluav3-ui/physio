"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Input } from "@physio/ui";
import { loginSchema } from "@physio/shared";
import Link from "next/link";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        const parsed = loginSchema.safeParse({ email, password });
        if (!parsed.success) {
            setError(parsed.error.issues[0]?.message ?? "Invalid input");
            return;
        }
        setLoading(true);
        try {
            const res = await fetch("/api/proxy/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(parsed.data),
            });
            if (!res.ok) {
                const body = await res.json();
                throw new Error(body.message ?? "Login failed");
            }
            const { accessToken, user } = await res.json();
            await fetch("/api/session", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token: accessToken }),
            });
            router.push(user.role === "PATIENT" ? "/app" : user.role === "PHYSIO" ? "/pro" : "/admin");
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <Card className="w-full max-w-md p-8">
                <h1 className="text-2xl font-semibold">Sign in</h1>
                <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
                    <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    {error && <p className="text-sm text-danger-700">{error}</p>}
                    <Button type="submit" loading={loading} fullWidth>
                        Sign in
                    </Button>
                    <div className="text-right">
                        <Link href="/auth/forgot" className="text-sm text-primary-600 underline">
                            Forgot password?
                        </Link>
                    </div>
                </form>
            </Card>
        </div>
    );
}