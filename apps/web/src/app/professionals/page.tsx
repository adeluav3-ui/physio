import { Suspense } from "react";
import type { Metadata } from "next";
import { BRAND, DISCIPLINE_LABELS } from "@physio/shared";
import ProfessionalsClient from "./professionals-client";
import { apiFetch } from "@/lib/api";

export const metadata: Metadata = {
    title: "Find a Professional",
    description: `Search verified rehabilitation professionals on ${BRAND.name}.`,
};

export type PublicProfessional = {
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

async function ProfessionalsList() {
    let professionals: PublicProfessional[] = [];
    try {
        professionals = await apiFetch<PublicProfessional[]>("/physios");
    } catch {
        // Serve empty state rather than hard crash on first load
    }
    return <ProfessionalsClient professionals={professionals} />;
}

export default function FindProfessionalsPage() {
    return (
        <main className="mx-auto max-w-4xl px-4 py-10">
            <h1 className="text-3xl font-semibold text-ink">Find a professional</h1>
            <p className="mt-2 text-base text-text-muted">
                Every professional on {BRAND.name} is licence-verified before they can see patients.
            </p>

            <Suspense fallback={<p className="mt-8 text-sm text-text-muted">Loading professionals…</p>}>
                <ProfessionalsList />
            </Suspense>
        </main>
    );
}
