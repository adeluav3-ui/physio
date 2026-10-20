"use client";

import Link from "next/link";
import { Button, Card } from "@physio/ui";

export default function Home() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-bg p-6">
            <div className="text-center">
                <h1 className="text-4xl font-semibold text-text">Physio</h1>
                <p className="mt-3 max-w-md text-base text-text-muted">
                    Online and in-person physiotherapy, from wherever you are.
                </p>
            </div>

            <Card className="w-full max-w-md">
                <div className="flex flex-col gap-3">
                    <Button asChild fullWidth>
                        <Link href="/auth/signup">Create an account</Link>
                    </Button>
                    <Button asChild variant="secondary" fullWidth>
                        <Link href="/auth/login">Sign in</Link>
                    </Button>
                </div>
            </Card>
        </main>
    );
}