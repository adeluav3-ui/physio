"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Props {
    href: string;
    className?: string;
    children: React.ReactNode;
}

export function LockedLink({ href, className, children }: Props) {
    const [open, setOpen] = useState(false);
    const [code, setCode] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    useEffect(() => {
        if (open) setTimeout(() => inputRef.current?.focus(), 50);
    }, [open]);

    async function submit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            const res = await fetch("/api/access", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code }),
            });
            if (res.ok) {
                router.push(href);
            } else {
                const body = await res.json().catch(() => ({}));
                setError(body.error ?? "Incorrect code");
                setCode("");
                inputRef.current?.focus();
            }
        } catch {
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            <button type="button" className={className} onClick={() => setOpen(true)}>
                {children}
            </button>

            {open && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
                    onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
                >
                    <div className="w-full max-w-sm rounded-xl bg-surface p-6 shadow-xl">
                        <h2 className="text-lg font-semibold text-text">Early access</h2>
                        <p className="mt-1 text-sm text-text-muted">
                            Rehab360 is not yet open to the public. Enter your access code to continue.
                        </p>

                        <form onSubmit={submit} className="mt-5 flex flex-col gap-3">
                            <input
                                ref={inputRef}
                                type="password"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                placeholder="Access code"
                                autoComplete="off"
                                className="w-full rounded-md border border-border bg-bg px-3 py-2.5 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                            {error && (
                                <p className="text-xs font-medium text-red-600">{error}</p>
                            )}
                            <button
                                type="submit"
                                disabled={loading || !code}
                                className="mt-1 inline-flex min-h-[42px] items-center justify-center rounded-md bg-primary-500 px-4 text-sm font-medium text-text-inverse transition-colors hover:bg-primary-600 disabled:opacity-50"
                            >
                                {loading ? "Checking…" : "Continue"}
                            </button>
                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                className="text-xs text-text-muted hover:text-text"
                            >
                                Cancel
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
