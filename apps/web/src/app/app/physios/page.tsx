"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

// ── Types ────────────────────────────────────────────────────────────────────

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
    // enriched client-side
    nextSlot?: string | null;
    bestFit?: boolean;
};

type SortKey = "ranked" | "soonest" | "price" | "rated";

// ── Styles ───────────────────────────────────────────────────────────────────

const S = {
    page: { minHeight: "100dvh", background: "#f4f8fb", color: "#022449", fontFamily: "'Figtree',system-ui,sans-serif" },
    strip: { height: "5px", background: "linear-gradient(90deg,#4eb91e 0%,#0eaf90 50%,#076889 100%)" },
    inner: { maxWidth: "680px", margin: "0 auto", padding: "0 20px" },
    header: { padding: "18px 0 12px", display: "flex", flexDirection: "column" as const, gap: "12px" },
    btn: (sm?: boolean): React.CSSProperties => ({
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        minHeight: sm ? "40px" : "44px", padding: sm ? "0 16px" : "0 20px",
        borderRadius: sm ? "10px" : "12px",
        background: "#1b7d0e", color: "#fff",
        font: `600 ${sm ? "14px" : "15px"} 'Figtree',sans-serif`, border: 0, cursor: "pointer",
        textDecoration: "none",
    }),
    btn2: (sm?: boolean): React.CSSProperties => ({
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        minHeight: sm ? "40px" : "44px", padding: sm ? "0 16px" : "0 20px",
        borderRadius: sm ? "10px" : "12px",
        background: "#fff", color: "#022449",
        font: `600 ${sm ? "14px" : "15px"} 'Figtree',sans-serif`,
        border: "1px solid #c3d1de", cursor: "pointer", textDecoration: "none",
    }),
    chip: (active?: boolean, variant?: "ok" | "warn"): React.CSSProperties => ({
        display: "inline-block", padding: "4px 10px", borderRadius: "99px",
        font: "600 12px 'Figtree',sans-serif",
        background: variant === "ok" ? "#e3f4e8" : variant === "warn" ? "#fdf1d8" : active ? "#e6f4e1" : "#e3f1f6",
        color: variant === "ok" ? "#1d5c34" : variant === "warn" ? "#7a4f00" : active ? "#0f5a08" : "#07506b",
        border: active && !variant ? "1px solid #1b7d0e" : "none",
    }),
    pillChip: (on: boolean): React.CSSProperties => ({
        display: "inline-block", padding: "9px 14px", borderRadius: "99px",
        font: "600 14px 'Figtree',sans-serif",
        background: on ? "#e6f4e1" : "#fff", color: on ? "#0f5a08" : "#022449",
        border: on ? "1.5px solid #1b7d0e" : "1.5px solid #c3d1de",
        cursor: "pointer",
    }),
    card: (muted?: boolean): React.CSSProperties => ({
        background: muted ? "#eef3f8" : "#fff",
        border: `1px solid ${muted ? "#d9e3ec" : "#d9e3ec"}`,
        borderRadius: "16px", padding: "14px",
        marginBottom: "10px",
    }),
    avatar: { width: "52px", height: "52px", borderRadius: "50%", background: "#cfe3ee", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" as const },
    sortRow: { display: "flex", gap: "8px", overflowX: "auto" as const, paddingBottom: "2px" },
    sortChip: (on: boolean): React.CSSProperties => ({
        flexShrink: 0, padding: "5px 12px", borderRadius: "99px",
        font: "600 12px 'Figtree',sans-serif", cursor: "pointer",
        background: on ? "#e6f4e1" : "#fff",
        color: on ? "#0f5a08" : "#022449",
        border: on ? "1px solid #1b7d0e" : "1px solid #c3d1de",
    }),
    overlay: { position: "fixed" as const, inset: 0, background: "rgba(2,36,73,0.4)", zIndex: 40, display: "flex", alignItems: "flex-end" },
    sheet: { background: "#fff", borderRadius: "20px 20px 0 0", width: "100%", maxHeight: "85vh", overflowY: "auto" as const, padding: "20px" },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtSlot(iso: string | null | undefined): string {
    if (!iso) return "—";
    const d = new Date(iso);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const tomorrow = new Date(now); tomorrow.setDate(tomorrow.getDate() + 1);
    const isTomorrow = d.toDateString() === tomorrow.toDateString();
    const time = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    if (isToday) return `Today, ${time}`;
    if (isTomorrow) return `Tomorrow, ${time}`;
    return `${d.toLocaleDateString("en-GB", { weekday: "short" })}, ${time}`;
}

function isBestFit(p: Professional, keyword: string) {
    if (!keyword) return false;
    const kw = keyword.toLowerCase();
    return (
        p.specialties.some((s) => s.toLowerCase().includes(kw)) ||
        (p.bio ?? "").toLowerCase().includes(kw)
    );
}

function sortList(list: Professional[], key: SortKey): Professional[] {
    return [...list].sort((a, b) => {
        if (key === "price") return a.rateKobo - b.rateKobo;
        if (key === "soonest") {
            if (!a.nextSlot && !b.nextSlot) return 0;
            if (!a.nextSlot) return 1;
            if (!b.nextSlot) return -1;
            return a.nextSlot.localeCompare(b.nextSlot);
        }
        // "ranked" and "rated" — best-fit first, then soonest slot
        if (a.bestFit && !b.bestFit) return -1;
        if (!a.bestFit && b.bestFit) return 1;
        if (!a.nextSlot && !b.nextSlot) return 0;
        if (!a.nextSlot) return 1;
        if (!b.nextSlot) return -1;
        return a.nextSlot.localeCompare(b.nextSlot);
    });
}

// ── Filter state ──────────────────────────────────────────────────────────────

type Filters = {
    language: string;
    mode: string;
    specialty: string;
};
const DEFAULT_FILTERS: Filters = { language: "", mode: "", specialty: "" };

const LANGUAGES = ["English", "Yoruba", "Igbo", "Hausa"];
const MODES = [{ value: "VIDEO", label: "Video" }, { value: "CHAT", label: "Chat" }];
const SPECIALTIES = ["Shoulder", "Back and neck", "Stroke", "Children", "Sports", "Post-op", "Neuro"];

// ── Main component ────────────────────────────────────────────────────────────

function FindPhysioInner() {
    const searchParams = useSearchParams();
    const complaint = searchParams.get("complaint") ?? "";
    const discipline = searchParams.get("discipline") ?? "";

    const [professionals, setProfessionals] = useState<Professional[]>([]);
    const [loading, setLoading] = useState(true);
    const [sort, setSort] = useState<SortKey>("ranked");
    const [filters, setFilters] = useState<Filters>({ ...DEFAULT_FILTERS, specialty: complaint });
    const [appliedFilters, setAppliedFilters] = useState<Filters>({ ...DEFAULT_FILTERS, specialty: complaint });
    const [showFilters, setShowFilters] = useState(false);
    const [filterCount, setFilterCount] = useState(0);

    const loadPhysios = useCallback(async (f: Filters) => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (discipline) params.set("discipline", discipline);
            if (f.language) params.set("language", f.language);
            if (f.mode) params.set("mode", f.mode);
            if (f.specialty) params.set("specialty", f.specialty);

            const res = await fetch(`/api/proxy/physios?${params}`);
            if (!res.ok) return;
            const list: Professional[] = await res.json();

            // Enrich with best-fit flag
            const keyword = f.specialty || complaint;
            const enriched = list.map((p) => ({ ...p, bestFit: isBestFit(p, keyword) }));
            setProfessionals(enriched);

            // Fire-and-forget: load next slots for each physio
            enriched.forEach((p) => {
                fetch(`/api/proxy/booking/slots/${p.userId}/next`)
                    .then((r) => r.ok ? r.json() : { startsAt: null })
                    .then(({ startsAt }: { startsAt: string | null }) => {
                        setProfessionals((prev) =>
                            prev.map((x) => x.userId === p.userId ? { ...x, nextSlot: startsAt } : x)
                        );
                    })
                    .catch(() => { });
            });
        } finally {
            setLoading(false);
        }
    }, [discipline, complaint]);

    useEffect(() => {
        void loadPhysios(appliedFilters);
    }, [loadPhysios, appliedFilters]);

    function applyFilters() {
        const count = [filters.language, filters.mode, filters.specialty].filter(Boolean).length;
        setFilterCount(count);
        setAppliedFilters({ ...filters });
        setShowFilters(false);
    }

    function clearFilters() {
        const reset = { ...DEFAULT_FILTERS, specialty: complaint };
        setFilters(reset);
        setFilterCount(0);
        setAppliedFilters(reset);
        setShowFilters(false);
    }

    function matchQuickly() {
        const withSlots = professionals.filter((p) => p.nextSlot);
        if (withSlots.length === 0) return;
        const best = withSlots[0];
        if (best) window.location.href = `/app/book/${best.userId}`;
    }

    const sorted = sortList(professionals, sort);
    const withSlots = sorted.filter((p) => p.nextSlot);
    const noSlots = sorted.filter((p) => !p.nextSlot);
    const displayed = [...withSlots, ...noSlots];

    return (
        <div style={S.page}>
            <div style={S.strip} />
            <div style={S.inner}>
                <div style={S.header}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <Link href="/app" style={{ font: "400 14px 'Figtree',sans-serif", color: "#4f6478", textDecoration: "none" }}>← Back</Link>
                    </div>
                    <h1 style={{ font: "700 24px/1.2 'Figtree',sans-serif", margin: 0 }}>
                        {discipline ? `Choose a ${discipline.toLowerCase().replace(/_/g, " ")}` : "Choose a professional"}
                    </h1>
                    {complaint && (
                        <p style={{ font: "400 14px/1.45 'Figtree',sans-serif", color: "#4f6478", margin: 0 }}>
                            For {complaint.toLowerCase()}. Listed by how well they fit your problem, then by the soonest time.
                        </p>
                    )}

                    <div style={{ display: "flex", gap: "8px" }}>
                        <button style={{ ...S.btn2(true), flex: 1, justifyContent: "center" }} onClick={matchQuickly}>
                            Match me quickly
                        </button>
                        <button style={S.btn2(true)} onClick={() => setShowFilters(true)}>
                            Filters{filterCount > 0 ? ` (${filterCount})` : ""}
                        </button>
                    </div>

                    <div style={S.sortRow}>
                        {([
                            { key: "ranked", label: "Ranked" },
                            { key: "soonest", label: "Soonest" },
                            { key: "price", label: "Lowest price" },
                        ] as Array<{ key: SortKey; label: string }>).map((o) => (
                            <button key={o.key} style={S.sortChip(sort === o.key)} onClick={() => setSort(o.key)}>
                                {o.label}
                            </button>
                        ))}
                    </div>
                </div>

                {loading && <p style={{ font: "400 14px 'Figtree',sans-serif", color: "#4f6478", padding: "20px 0" }}>Loading…</p>}

                {!loading && displayed.length === 0 && (
                    <div style={{ ...S.card(), textAlign: "center", padding: "32px" }}>
                        <p style={{ font: "400 15px 'Figtree',sans-serif", color: "#4f6478" }}>No verified professionals are available right now.</p>
                    </div>
                )}

                <div style={{ paddingBottom: "32px" }}>
                    {displayed.map((p) => {
                        const hasSlot = !!p.nextSlot;
                        return (
                            <div key={p.userId} style={S.card(!hasSlot)}>
                                <div style={{ display: "flex", gap: "12px" }}>
                                    <div style={S.avatar}>
                                        {p.photoUrl
                                            ? <img src={p.photoUrl} alt={p.user.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                            : null}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ font: "700 16px 'Figtree',sans-serif", color: hasSlot ? "#022449" : "#4f6478" }}>
                                            {p.user.name}
                                        </div>
                                        <div style={{ font: "400 13px 'Figtree',sans-serif", color: "#4f6478", marginTop: "2px" }}>
                                            {p.specialties.slice(0, 2).join(" · ")}{p.specialties.length > 2 ? " · …" : ""}
                                            {p.languages.length > 0 ? ` · ${p.languages.join(", ")}` : ""}
                                        </div>
                                        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "6px" }}>
                                            {p.bestFit && <span style={S.chip(false, "ok")}>Best fit</span>}
                                            {!hasSlot && <span style={S.chip(false, "warn")}>No open times</span>}
                                            {p.sessionTypes.includes("VIDEO") && <span style={S.chip()}>Video</span>}
                                            {p.sessionTypes.includes("CHAT") && <span style={S.chip()}>Chat</span>}
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: "flex", alignItems: "center", marginTop: "10px", paddingTop: "10px", borderTop: `1px solid ${hasSlot ? "#e4ebf2" : "#d9e3ec"}` }}>
                                    {hasSlot ? (
                                        <>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ font: "400 12px 'Figtree',sans-serif", color: "#4f6478" }}>Next free</div>
                                                <div style={{ font: "600 14px 'Figtree',sans-serif" }}>{fmtSlot(p.nextSlot)}</div>
                                            </div>
                                            <div style={{ marginRight: "12px", textAlign: "right" }}>
                                                <div style={{ font: "700 15px 'Figtree',sans-serif" }}>₦10,000</div>
                                                <div style={{ font: "400 11px 'Figtree',sans-serif", color: "#4f6478" }}>first consult</div>
                                            </div>
                                            <div style={{ display: "flex", flexDirection: "column", gap: "6px", flexShrink: 0 }}>
                                                <Link href={`/app/book/${p.userId}`} style={{ ...S.btn(true) }}>Book</Link>
                                                <Link href={`/app/book/express/${p.userId}`} style={{ ...S.btn(true), background: "#0d6e8a" }}>Express</Link>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div style={{ flex: 1, font: "400 12px 'Figtree',sans-serif", color: "#4f6478" }}>
                                                Fully booked this month
                                            </div>
                                            <button
                                                style={S.btn2(true)}
                                                onClick={() => alert(`Waitlist not yet implemented for ${p.user.name}`)}
                                            >
                                                Join waitlist
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Filters sheet */}
            {showFilters && (
                <div style={S.overlay} onClick={() => setShowFilters(false)}>
                    <div style={S.sheet} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                            <h2 style={{ font: "700 24px 'Figtree',sans-serif", margin: 0 }}>Filters</h2>
                            <button style={{ ...S.chip(), cursor: "pointer", border: 0, padding: "8px 14px", font: "600 13px 'Figtree',sans-serif" }} onClick={clearFilters}>
                                Clear all
                            </button>
                        </div>

                        <FilterGroup label="Area of practice">
                            {SPECIALTIES.map((s) => (
                                <button key={s} style={S.pillChip(filters.specialty === s)} onClick={() => setFilters((f) => ({ ...f, specialty: f.specialty === s ? "" : s }))}>
                                    {s}
                                </button>
                            ))}
                        </FilterGroup>

                        <FilterGroup label="Language">
                            {LANGUAGES.map((l) => (
                                <button key={l} style={S.pillChip(filters.language === l)} onClick={() => setFilters((f) => ({ ...f, language: f.language === l ? "" : l }))}>
                                    {l}
                                </button>
                            ))}
                        </FilterGroup>

                        <FilterGroup label="Visit type">
                            {MODES.map((m) => (
                                <button key={m.value} style={S.pillChip(filters.mode === m.value)} onClick={() => setFilters((f) => ({ ...f, mode: f.mode === m.value ? "" : m.value }))}>
                                    {m.label}
                                </button>
                            ))}
                        </FilterGroup>

                        <div style={{ marginTop: "20px", paddingTop: "16px", borderTop: "1px solid #d9e3ec" }}>
                            <button style={{ ...S.btn(), width: "100%", justifyContent: "center" }} onClick={applyFilters}>
                                Show results
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div style={{ marginBottom: "16px" }}>
            <div style={{ font: "600 13px 'Figtree',sans-serif", marginBottom: "8px" }}>{label}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>{children}</div>
        </div>
    );
}

export default function FindPhysioPage() {
    return (
        <Suspense fallback={<div style={{ padding: "40px 20px", color: "#4f6478", fontFamily: "'Figtree',sans-serif" }}>Loading…</div>}>
            <FindPhysioInner />
        </Suspense>
    );
}
