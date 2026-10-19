"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Card, Input } from "@physio/ui";

export default function AdminPhysioReviewPage() {
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const [reason, setReason] = useState("");
    const [loading, setLoading] = useState(false);

    async function decide(decision: "VERIFIED" | "REJECTED") {
        setLoading(true);
        try {
            await fetch("/api/proxy/physios/admin/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: params.id, decision, reason: reason || undefined }),
            });
            router.push("/admin/physios");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="p-6">
            <h1 className="text-2xl font-semibold">Review physio</h1>
            <Card className="mt-6">
                <p className="text-sm text-text-muted">
                    Confirm the licence number with the Medical Rehabilitation Therapists Board of Nigeria
                    before approving. This action is recorded in the audit log.
                </p>
                <div className="mt-4">
                    <Input
                        label="Reason (for rejection or notes)"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                    />
                </div>
                <div className="mt-6 flex gap-3">
                    <Button onClick={() => decide("VERIFIED")} loading={loading}>
                        Approve
                    </Button>
                    <Button variant="danger" onClick={() => decide("REJECTED")} loading={loading}>
                        Reject
                    </Button>
                </div>
            </Card>
        </div>
    );
}