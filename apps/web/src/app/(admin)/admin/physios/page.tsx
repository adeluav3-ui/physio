import Link from "next/link";
import { Card } from "@physio/ui";
import { apiFetch } from "@/lib/api";
import { requireSession } from "@/lib/session";

type Pending = {
    userId: string;
    licenceNo: string;
    specialties: string[];
    user: { name: string; email: string; createdAt: string };
};

export default async function AdminPhysiosPage() {
    await requireSession(["ADMIN"]);
    const pending = await apiFetch<Pending[]>("/physios/admin/pending");

    return (
        <div className="p-6">
            <h1 className="text-2xl font-semibold">Physio verification</h1>
            <p className="mt-1 text-sm text-text-muted">{pending.length} awaiting review.</p>

            <ul className="mt-6 flex flex-col gap-3">
                {pending.map((p) => (
                    <li key={p.userId}>
                        <Card>
                            <div className="flex justify-between">
                                <div>
                                    <h2 className="text-lg font-semibold">{p.user.name}</h2>
                                    <p className="text-sm text-text-muted">
                                        {p.user.email} · Licence {p.licenceNo}
                                    </p>
                                    <p className="mt-1 text-sm">{p.specialties.join(" · ")}</p>
                                </div>
                                <Link
                                    href={`/admin/physios/${p.userId}`}
                                    className="self-start rounded-md bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600"
                                >
                                    Review
                                </Link>
                            </div>
                        </Card>
                    </li>
                ))}
                {pending.length === 0 && (
                    <Card className="text-center text-text-muted">No physios waiting for verification.</Card>
                )}
            </ul>
        </div>
    );
}