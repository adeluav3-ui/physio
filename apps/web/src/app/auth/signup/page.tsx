"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Card, Input } from "@physio/ui";
import { signUpSchema } from "@physio/shared";

export default function SignupPage() {
    const router = useRouter();
    const [wantsPhysio, setWantsPhysio] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        const parsed = signUpSchema.safeParse({ email, password, name });
        if (!parsed.success) {
            setError(parsed.error.issues[0]?.message ?? "Invalid input");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/proxy/auth/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(parsed.data),
            });

            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.message ?? "Signup failed");
            }

            setDone(true);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    }

    if (done) {
        const nextPath = wantsPhysio ? "/pro/onboarding/apply" : "/app";
        return (
            <div className="flex min-h-screen items-center justify-center p-4">
                <Card className="w-full max-w-md p-8 text-center">
                    <h1 className="text-2xl font-semibold">Check your email</h1>
                    <p className="mt-3 text-sm text-text-muted">
                        We sent a verification link to <strong>{email}</strong>. Click it to activate your
                        {wantsPhysio ? " account, then complete your physio application." : " account."}
                    </p>
                    <p className="mt-4 text-xs text-text-muted">
                        In dev mode with placeholder email keys, you can verify directly:
                    </p>
                    <Button
                        className="mt-3"
                        variant="secondary"
                        fullWidth
                        onClick={() =>
                            router.push(
                                `/auth/verify?email=${encodeURIComponent(email)}&dev=1&next=${encodeURIComponent(nextPath)}`,
                            )
                        }
                    >
                        Verify now (dev)
                    </Button>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <Card className="w-full max-w-md p-8">
                <h1 className="text-2xl font-semibold">Create your account</h1>

                <div className="mt-6">
                    <p className="text-sm font-medium text-text">I am a</p>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                        <button
                            type="button"
                            onClick={() => setWantsPhysio(false)}
                            className={`h-12 rounded-md border text-sm font-medium ${!wantsPhysio
                                    ? "border-primary-500 bg-primary-50 text-primary-700"
                                    : "border-border bg-surface text-text"
                                }`}
                        >
                            Patient
                        </button>
                        <button
                            type="button"
                            onClick={() => setWantsPhysio(true)}
                            className={`h-12 rounded-md border text-sm font-medium ${wantsPhysio
                                    ? "border-primary-500 bg-primary-50 text-primary-700"
                                    : "border-border bg-surface text-text"
                                }`}
                        >
                            Physiotherapist
                        </button>
                    </div>
                    {wantsPhysio && (
                        <p className="mt-2 text-xs text-text-muted">
                            You'll provide your licence details after signing up. All physios are verified
                            before appearing to patients.
                        </p>
                    )}
                </div>

                <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
                    <Input label="Full name" value={name} onChange={(e) => setName(e.target.value)} required />
                    <Input
                        label="Email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <Input
                        label="Password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        hint="At least 10 characters, with a letter and a number"
                        required
                    />
                    {error && <p className="text-sm text-danger-700">{error}</p>}
                    <Button type="submit" loading={loading} fullWidth>
                        Create account
                    </Button>
                </form>

                <p className="mt-4 text-center text-sm text-text-muted">
                    Already have an account?{" "}
                    <Link href="/auth/login" className="text-primary-600 underline">
                        Sign in
                    </Link>
                </p>
            </Card>
        </div>
    );
}
