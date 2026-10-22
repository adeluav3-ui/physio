"use client";

import { useEffect, useState } from "react";
import { Card } from "@physio/ui";

export default function PhysioPendingPage() {
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        fetch("/api/proxy/auth/me")
            .then((r) => {
                if (!r.ok) throw new Error("Not signed in");
                return r.json();
            })
            .then((user) => {
                if (user.role !== "PHYSIO") throw new Error("Wrong role");
                setChecking(false);
            })
            .catch(() => {
                window.location.href = "/auth/login?next=/pro/onboarding/pending";
            });
    }, []);

    if (checking) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <p className="text-sm text-text-muted">Loading…</p>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-md p-4">
            <Card className="p-8 text-center">
                <h1 className="text-2xl font-semibold">Application received</h1>
                <p className="mt-3 text-sm text-text-muted">
                    We're reviewing your licence details. This usually takes 1–2 business days.
                    You'll receive an email when your profile is live.
                </p>
            </Card>
        </div>
    );
}