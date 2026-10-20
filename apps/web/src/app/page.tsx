import Link from "next/link";
import { Card } from "@physio/ui";

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
                    <Link
                        href="/auth/signup"
                        className="inline-flex h-12 w-full items-center justify-center rounded-md bg-primary-500 px-4 text-base font-medium text-text-inverse transition-colors hover:bg-primary-600"
                    >
                        Create an account
                    </Link>
                    <Link
                        href="/auth/login"
                        className="inline-flex h-12 w-full items-center justify-center rounded-md border border-border bg-surface px-4 text-base font-medium text-text transition-colors hover:bg-neutral-50"
                    >
                        Sign in
                    </Link>
                </div>
            </Card>
        </main>
    );
}