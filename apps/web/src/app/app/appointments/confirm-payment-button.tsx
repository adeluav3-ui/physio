"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ConfirmPaymentButton({ reference }: { reference: string }) {
    const router = useRouter();
    const [state, setState] = useState<"idle" | "checking" | "done" | "failed">("idle");

    async function handleClick() {
        setState("checking");
        try {
            const res = await fetch(`/api/proxy/payments/confirm-callback/${encodeURIComponent(reference)}`);
            if (!res.ok) { setState("failed"); return; }
            const { status } = await res.json() as { status: string };
            if (status === "CONFIRMED") {
                setState("done");
                router.refresh();
            } else {
                setState("failed");
            }
        } catch {
            setState("failed");
        }
    }

    if (state === "done") return <span className="text-xs text-green-700 font-medium">Confirmed!</span>;
    if (state === "failed") return <span className="text-xs text-red-600">Could not confirm — contact support with ref: {reference}</span>;

    return (
        <button
            type="button"
            disabled={state === "checking"}
            onClick={handleClick}
            className="mt-3 inline-block rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
            {state === "checking" ? "Checking…" : "Confirm payment"}
        </button>
    );
}
