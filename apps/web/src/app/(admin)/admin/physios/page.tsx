import Link from "next/link";
import { Card, Chip } from "@physio/ui";
import { apiFetch } from "@/lib/api";
import { requireSession } from "@/lib/session";
import { DISCIPLINE_LABELS } from "@physio/shared";

type Pending = {
    userId: string;
    discipline: string;
    licenceNo: string;
    licensingBody: string | null;
    specialties: string[];
    bio: string;
    serviceArea: string;
    user: { name: string; email: string; createdAt: string };
};

export default async function AdminProfessionalsPage() {
    await requireSession(["ADMIN"]);
    const pending = await apiFetch<Pending[]>("/physios/admin/pending");

    return (
        <div className="p-6">
            <h1 className="text-2xl font-semibold">Professional verification</h1>
            <p className="mt-1 text-sm text-text-muted">{pending.length} awaiting review.</p>

            <ul className="mt-6 flex flex-col gap-3">
                {pending.map((p) => (
                    <li key={p.userId}>
                        <Card>
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h2 className="font-semibold">{p.user.name}</h2>
                                        <Chip variant="accent">
                                            {DISCIPLINE_LABELS[p.discipline as keyof typeof DISCIPLINE_LABELS] ?? p.discipline}
                                        </Chip>
                                    </div>
                                    <p className="mt-1 text-sm text-text-muted">
                                        {p.user.email} · Licence <span className="font-mono">{p.licenceNo}</span>
                                    </p>
                                    {p.licensingBody && (
                                        <p className="mt-0.5 text-xs text-text-muted">Board: {p.licensingBody}</p>
                                    )}
                                    <p className="mt-1 text-sm text-text-muted">
                                        {p.specialties.join(" · ")} · {p.serviceArea}
                                    </p>
                                    <p className="mt-1 text-xs text-text-muted">
                                        Applied {new Date(p.user.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                                <Link
                                    href={`/admin/physios/${p.userId}`}
                                    className="shrink-0 rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-dark"
                                >
                                    Review
                                </Link>
                            </div>
                        </Card>
                    </li>
                ))}
                {pending.length === 0 && (
                    <Card padding="lg" className="text-center text-text-muted">
                        No professionals waiting for verification.
                    </Card>
                )}
            </ul>
        </div>
    );
}