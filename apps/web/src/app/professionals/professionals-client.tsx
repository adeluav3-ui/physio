"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, Chip, VerifiedBadge, EmptyState } from "@physio/ui";
import { DISCIPLINE_LABELS } from "@physio/shared";
import type { PublicProfessional } from "./page";

type DisciplineFilter = keyof typeof DISCIPLINE_LABELS | "ALL";

const FILTERS: { value: DisciplineFilter; label: string }[] = [
    { value: "ALL", label: "All disciplines" },
    ...Object.entries(DISCIPLINE_LABELS).map(([k, v]) => ({
        value: k as keyof typeof DISCIPLINE_LABELS,
        label: v,
    })),
];

export default function ProfessionalsClient({
    professionals,
}: {
    professionals: PublicProfessional[];
}) {
    const [discipline, setDiscipline] = useState<DisciplineFilter>("ALL");

    const filtered =
        discipline === "ALL"
            ? professionals
            : professionals.filter((p) => p.discipline === discipline);

    return (
        <div>
            <div className="mt-6 flex flex-wrap gap-2">
                {FILTERS.map((f) => (
                    <button
                        key={f.value}
                        type="button"
                        onClick={() => setDiscipline(f.value)}
                        className="focus:outline-none"
                    >
                        <Chip variant={discipline === f.value ? "accent" : "default"}>
                            {f.label}
                        </Chip>
                    </button>
                ))}
            </div>

            {filtered.length === 0 ? (
                <EmptyState
                    className="mt-10"
                    title="No professionals found"
                    description={
                        discipline === "ALL"
                            ? "No verified professionals are available right now. Check back soon."
                            : `No verified ${DISCIPLINE_LABELS[discipline as keyof typeof DISCIPLINE_LABELS]} professionals are available right now.`
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
            ) : (
                <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                    {filtered.map((p) => (
                        <li key={p.userId}>
                            <Link href={`/professionals/${p.userId}`} className="block h-full">
                                <Card interactive className="h-full">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h2 className="truncate font-semibold">{p.user.name}</h2>
                                                {p.verified && <VerifiedBadge />}
                                            </div>
                                            <p className="mt-0.5 text-sm text-text-muted">
                                                {DISCIPLINE_LABELS[p.discipline as keyof typeof DISCIPLINE_LABELS] ?? p.discipline}
                                                {p.serviceArea ? ` · ${p.serviceArea}` : ""}
                                            </p>
                                            {p.bio && (
                                                <p className="mt-2 line-clamp-2 text-sm text-text-muted">
                                                    {p.bio}
                                                </p>
                                            )}
                                        </div>
                                        <div className="shrink-0 text-right">
                                            <p className="font-semibold text-primary-700">
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
            )}
        </div>
    );
}
