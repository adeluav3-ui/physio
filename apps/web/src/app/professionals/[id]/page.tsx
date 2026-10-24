import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { BRAND, DISCIPLINE_LABELS } from "@physio/shared";
import { Card, Chip, VerifiedBadge } from "@physio/ui";
import { apiFetch, ApiError } from "@/lib/api";
import type { PublicProfessional } from "../page";

type Props = { params: Promise<{ id: string }> };

async function fetchProfile(id: string): Promise<PublicProfessional | null> {
    try {
        return await apiFetch<PublicProfessional>(`/physios/${id}`);
    } catch (err) {
        if (err instanceof ApiError && err.status === 404) return null;
        throw err;
    }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params;
    const p = await fetchProfile(id);
    if (!p) return { title: "Professional not found" };
    const discipline =
        DISCIPLINE_LABELS[p.discipline as keyof typeof DISCIPLINE_LABELS] ?? p.discipline;
    return {
        title: p.user.name,
        description: `${p.user.name} — ${discipline} on ${BRAND.name}. ${p.bio ?? ""}`.trim(),
        openGraph: {
            title: `${p.user.name} | ${BRAND.name}`,
            description: p.bio ?? `${discipline} professional on ${BRAND.name}`,
            type: "profile",
        },
    };
}

export default async function PublicProfilePage({ params }: Props) {
    const { id } = await params;
    const p = await fetchProfile(id);
    if (!p) notFound();

    const discipline =
        DISCIPLINE_LABELS[p.discipline as keyof typeof DISCIPLINE_LABELS] ?? p.discipline;

    return (
        <main className="mx-auto max-w-2xl px-4 py-10">
            <Link
                href="/professionals"
                className="mb-6 inline-flex items-center gap-1 text-sm text-text-muted hover:text-ink"
            >
                ← All professionals
            </Link>

            <Card className="mt-4" padding="lg">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-semibold">{p.user.name}</h1>
                            {p.verified && <VerifiedBadge />}
                        </div>
                        <p className="mt-1 text-base text-text-muted">{discipline}</p>
                        {p.serviceArea && (
                            <p className="mt-0.5 text-sm text-text-muted">{p.serviceArea}</p>
                        )}
                    </div>
                    <div className="text-right">
                        <p className="text-2xl font-semibold text-primary-700">
                            ₦{(p.rateKobo / 100).toLocaleString()}
                        </p>
                        <p className="text-xs text-text-muted">per session</p>
                    </div>
                </div>

                {p.bio && (
                    <p className="mt-6 text-sm leading-relaxed text-text">{p.bio}</p>
                )}

                {p.specialties.length > 0 && (
                    <div className="mt-6">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
                            Specialties
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {p.specialties.map((s) => (
                                <Chip key={s}>{s}</Chip>
                            ))}
                        </div>
                    </div>
                )}

                {p.sessionTypes.length > 0 && (
                    <div className="mt-5">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
                            Session types
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {p.sessionTypes.map((s) => (
                                <Chip key={s} variant="accent">
                                    {s}
                                </Chip>
                            ))}
                        </div>
                    </div>
                )}

                {p.languages.length > 0 && (
                    <div className="mt-5">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
                            Languages
                        </p>
                        <p className="text-sm text-text">{p.languages.join(", ")}</p>
                    </div>
                )}

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                    <Link
                        href={`/auth/signup?next=/app/book/${p.userId}`}
                        className="flex h-11 flex-1 items-center justify-center rounded-lg bg-accent px-6 text-sm font-semibold text-white hover:bg-accent-dark"
                    >
                        Book a session
                    </Link>
                    <Link
                        href="/auth/login"
                        className="flex h-11 flex-1 items-center justify-center rounded-lg border border-border bg-surface px-6 text-sm font-medium text-ink hover:bg-neutral-50"
                    >
                        Sign in to book
                    </Link>
                </div>
            </Card>
        </main>
    );
}
