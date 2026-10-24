"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, Chip, VerifiedBadge, EmptyState } from "@physio/ui";
import { DISCIPLINE_LABELS } from "@physio/shared";

type Discipline = keyof typeof DISCIPLINE_LABELS;

type Professional = {
    userId: string;
    discipline: string;
    specialties: string[];
    bio: string;
    rateKobo: number;
    serviceArea: string;
    verified: boolean;
    photoUrl: string | null;
    languages: string[];
    sessionTypes: string[];
    user: { id: string; name: string };
};

const ALL_DISCIPLINES: { value: Discipline | "ALL"; label: string }[] = [
    { value: "ALL", label: "All" },
    ...Object.entries(DISCIPLINE_LABELS).map(([k, v]) => ({ value: k as Discipline, label: v })),
];

export default function FindProfessionalPage() {
    const [professionals, setProfessionals] = useState<Professional[]>([]);
    const [discipline, setDiscipline] = useState<Discipline | "ALL">("ALL");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch("/api/proxy/physios")
            .then((r) => (r.ok ? r.json() : Promise.reject()))
            .then(setProfessionals)
            .catch(() => setError("Could not load professionals. Please try again."))
            .finally(() => setLoading(false));
    }, []);

    const filtered =
        discipline === "ALL"
            ? professionals
            : professionals.filter((p) => p.discipline === discipline);

    return (
        <div className="mx-auto max-w-3xl p-4">
            <h1 className="text-2xl font-semibold">Find a professional</h1>
            <p className="mt-1 text-sm text-text-muted">All professionals are licence-verified.</p>

            <div className="mt-4 flex flex-wrap gap-2">
                {ALL_DISCIPLINES.map((d) => (
                    <button
                        key={d.value}
                        type="button"
                        onClick={() => setDiscipline(d.value)}
                        className="focus:outline-none"
                    >
                        <Chip variant={discipline === d.value ? "accent" : "default"}>
                            {d.label}
                        </Chip>
                    </button>
                ))}
            </div>

            {loading && (
                <p className="mt-8 text-sm text-text-muted">Loading professionals…</p>
            )}

            {error && (
                <p className="mt-8 text-sm text-danger-700">{error}</p>
            )}

            {!loading && !error && filtered.length === 0 && (
                <EmptyState
                    className="mt-8"
                    title="No professionals found"
                    description={
                        discipline === "ALL"
                            ? "No verified professionals are available right now. Check back soon."
                            : `No verified ${DISCIPLINE_LABELS[discipline as Discipline]} professionals are available right now.`
                    }
                    action={
                        discipline !== "ALL" ? (
                            <button
                                type="button"
                                onClick={() => setDiscipline("ALL")}
                                className="text-sm font-medium text-primary-600 underline"
                            >
                                Show all disciplines
                            </button>
                        ) : undefined
                    }
                />
            )}

            <ul className="mt-6 flex flex-col gap-3">
                {filtered.map((p) => (
                    <li key={p.userId}>
                        <Link href={`/app/book/${p.userId}`}>
                            <Card interactive>
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h2 className="truncate text-lg font-semibold">{p.user.name}</h2>
                                            {p.verified && <VerifiedBadge />}
                                        </div>
                                        <p className="mt-0.5 text-sm text-text-muted">
                                            {DISCIPLINE_LABELS[p.discipline as Discipline] ?? p.discipline}
                                            {p.serviceArea ? ` · ${p.serviceArea}` : ""}
                                        </p>
                                        {p.specialties.length > 0 && (
                                            <p className="mt-1 text-xs text-text-muted">
                                                {p.specialties.join(" · ")}
                                            </p>
                                        )}
                                        {p.bio && (
                                            <p className="mt-2 line-clamp-2 text-sm text-text-muted">{p.bio}</p>
                                        )}
                                    </div>
                                    <div className="shrink-0 text-right">
                                        <p className="text-lg font-semibold text-primary-700">
                                            ₦{(p.rateKobo / 100).toLocaleString()}
                                        </p>
                                        <p className="mt-0.5 text-xs text-text-muted">per session</p>
                                    </div>
                                </div>
                            </Card>
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
}
