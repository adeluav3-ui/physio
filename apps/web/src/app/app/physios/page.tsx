import Link from "next/link";
import { Card, StatusBadge } from "@physio/ui";
import { apiFetch } from "@/lib/api";
import { requireSession } from "@/lib/session";

type Physio = {
    userId: string;
    specialties: string[];
    bio: string;
    rateKobo: number;
    serviceArea: string;
    user: { name: string };
};

export default async function PhysioDirectoryPage() {
    await requireSession(["PATIENT"]);
    const physios = await apiFetch<Physio[]>("/physios");

    return (
        <div className="mx-auto max-w-3xl p-4">
            <h1 className="text-2xl font-semibold">Find a physio</h1>
            <p className="mt-1 text-sm text-text-muted">All physios are licence-verified.</p>

            <ul className="mt-6 flex flex-col gap-3">
                {physios.map((p) => (
                    <li key={p.userId}>
                        <Link href={`/app/book/${p.userId}`}>
                            <Card interactive>
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <h2 className="text-lg font-semibold">{p.user.name}</h2>
                                        <p className="mt-1 text-sm text-text-muted">
                                            {p.specialties.join(" · ")} · {p.serviceArea}
                                        </p>
                                        <p className="mt-2 line-clamp-2 text-sm text-text-muted">{p.bio}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-semibold text-primary-700">
                                            ₦{(p.rateKobo / 100).toLocaleString()}
                                        </p>
                                        <StatusBadge status="VERIFIED" tone="success" />
                                    </div>
                                </div>
                            </Card>
                        </Link>
                    </li>
                ))}
                {physios.length === 0 && (
                    <Card padding="lg" className="text-center text-text-muted">
                        No physios available right now. Check back soon.
                    </Card>
                )}
            </ul>
        </div>
    );
}