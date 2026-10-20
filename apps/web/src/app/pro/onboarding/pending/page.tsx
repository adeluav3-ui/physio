import { Card } from "@physio/ui";
import { requireSession } from "@/lib/session";

export default async function PhysioPendingPage() {
    await requireSession(["PHYSIO"]);
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