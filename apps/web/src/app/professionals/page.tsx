import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import ProfessionalsClient from "./professionals-client";

export const metadata: Metadata = {
    title: "Find a specialist",
    description: "Search verified rehabilitation professionals on Rehab360.",
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
    pilotParticipant: boolean;
    user: { id: string; name: string };
};

async function ProfessionalsList() {
    let professionals: PublicProfessional[] = [];
    try {
        professionals = await apiFetch<PublicProfessional[]>("/physios");
    } catch {
        /* serve empty state */
    }
    return <ProfessionalsClient professionals={professionals} />;
}

export default function FindProfessionalsPage() {
    return (
        <div style={{ width: "100%", fontFamily: "'Figtree',system-ui,sans-serif", color: "#022449", background: "#f4f8fb" }}>
            <div style={{ maxWidth: "1160px", margin: "0 auto", padding: "0 24px" }}>
                <header style={{ display: "flex", flexWrap: "wrap" as const, gap: "16px", alignItems: "center", justifyContent: "space-between", padding: "20px 0" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <a href="/"><img src="/brand/logo-horizontal-web.png" alt="Rehab360" style={{ height: "46px", width: "auto", display: "block" }} /></a>
                    <div style={{ display: "flex", gap: "12px" }}>
                        <Link href="/auth/login" className="btn btn2">Log in</Link>
                        <Link href="/auth/signup" className="btn">Sign up</Link>
                    </div>
                </header>
                <h1 style={{ font: "700 34px 'Figtree',sans-serif", marginTop: "12px", marginBottom: 0 }}>Find a specialist</h1>
                <Suspense fallback={<p className="muted" style={{ font: "400 14px 'Figtree',sans-serif", margin: "20px 0 12px" }}>Loading…</p>}>
                    <ProfessionalsList />
                </Suspense>
            </div>
        </div>
    );
}
