"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type WalletEntry = {
    id: string;
    amountKobo: number;
    type: "DEPOSIT" | "REFUND_CREDIT" | "SESSION_DEBIT";
    note: string | null;
    createdAt: string;
};

type WalletData = {
    balanceKobo: number;
    entries: WalletEntry[];
};

const ENTRY_LABELS: Record<string, string> = {
    DEPOSIT: "Top-up",
    REFUND_CREDIT: "Refund",
    SESSION_DEBIT: "Session payment",
};

const NAV = "#022449";
const MUTED = "#4f6478";
const BORDER = "#d9e3ec";
const GREEN = "#1b7d0e";

const PRESET_AMOUNTS = [
    { label: "₦5,000", kobo: 500_000 },
    { label: "₦10,000", kobo: 1_000_000 },
    { label: "₦20,000", kobo: 2_000_000 },
    { label: "₦50,000", kobo: 5_000_000 },
];

export default function WalletPage() {
    const router = useRouter();
    const [data, setData] = useState<WalletData | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showDeposit, setShowDeposit] = useState(false);
    const [amountInput, setAmountInput] = useState("");
    const [depositing, setDepositing] = useState(false);
    const [depositError, setDepositError] = useState<string | null>(null);

    function fetchBalance(showSpinner = false) {
        if (showSpinner) setRefreshing(true);
        return fetch("/api/proxy/wallet/me")
            .then(r => r.ok ? r.json() : null)
            .then((d: WalletData | null) => { if (d) setData(d); })
            .catch(() => { })
            .finally(() => { setLoading(false); if (showSpinner) setRefreshing(false); });
    }

    useEffect(() => {
        fetchBalance();

        // Re-fetch when user switches back to this tab so a just-processed
        // refund shows up without requiring a manual page reload.
        function onVisible() {
            if (document.visibilityState === "visible") fetchBalance();
        }
        document.addEventListener("visibilitychange", onVisible);
        return () => document.removeEventListener("visibilitychange", onVisible);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function handleDeposit() {
        const naira = Number(amountInput.replace(/,/g, ""));
        if (!naira || naira < 100) {
            setDepositError("Minimum deposit is ₦100.");
            return;
        }
        const amountKobo = Math.round(naira * 100);
        setDepositing(true);
        setDepositError(null);
        try {
            const res = await fetch("/api/proxy/wallet/deposit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amountKobo }),
            });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error((body as { message?: string }).message ?? "Could not start deposit.");
            }
            const { authorizationUrl } = await res.json() as { authorizationUrl: string };
            window.location.href = authorizationUrl;
        } catch (e) {
            setDepositError((e as Error).message);
        } finally {
            setDepositing(false);
        }
    }

    if (loading) {
        return (
            <div style={{ padding: "24px 20px", fontFamily: "'Figtree',system-ui,sans-serif", color: MUTED, font: "400 15px 'Figtree',sans-serif" }}>
                Loading…
            </div>
        );
    }

    const balanceNaira = ((data?.balanceKobo ?? 0) / 100).toLocaleString("en-NG", { minimumFractionDigits: 2 });

    return (
        <div style={{ maxWidth: 480, margin: "0 auto", padding: "24px 20px", fontFamily: "'Figtree',system-ui,sans-serif", color: NAV, display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                <div>
                    <h1 style={{ font: "700 26px 'Figtree',sans-serif", margin: 0 }}>Wallet</h1>
                    <p style={{ font: "400 14px 'Figtree',sans-serif", color: MUTED, marginTop: 4 }}>
                        Your session credits and refunds
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => fetchBalance(true)}
                    disabled={refreshing}
                    style={{ background: "none", border: "none", cursor: refreshing ? "default" : "pointer", color: MUTED, font: "500 13px 'Figtree',sans-serif", padding: "4px 0", marginTop: 4 }}
                >
                    {refreshing ? "Syncing…" : "↻ Sync"}
                </button>
            </div>

            {/* Balance card */}
            <div style={{ background: NAV, borderRadius: 20, padding: "24px 20px", color: "#fff" }}>
                <div style={{ font: "500 13px 'Figtree',sans-serif", color: "#9fc1e0", marginBottom: 4 }}>Available balance</div>
                <div style={{ font: "700 36px 'Figtree',sans-serif" }}>₦{balanceNaira}</div>
                <p style={{ font: "400 13px 'Figtree',sans-serif", color: "#c9d9ec", margin: "8px 0 0" }}>
                    Wallet credits are applied automatically at checkout.
                </p>
            </div>

            {/* Deposit toggle */}
            {!showDeposit ? (
                <button
                    type="button"
                    className="btn"
                    onClick={() => setShowDeposit(true)}
                    style={{ alignSelf: "flex-start", minWidth: 160 }}
                >
                    + Add funds
                </button>
            ) : (
                <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 16, padding: 20 }}>
                    <div style={{ font: "700 16px 'Figtree',sans-serif", marginBottom: 14 }}>Add funds to wallet</div>

                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
                        {PRESET_AMOUNTS.map(p => (
                            <button
                                key={p.kobo}
                                type="button"
                                onClick={() => setAmountInput(String(p.kobo / 100))}
                                style={{
                                    padding: "8px 14px", borderRadius: 10, cursor: "pointer",
                                    font: "600 13px 'Figtree',sans-serif", border: "1.5px solid",
                                    borderColor: amountInput === String(p.kobo / 100) ? NAV : BORDER,
                                    background: amountInput === String(p.kobo / 100) ? NAV : "#fff",
                                    color: amountInput === String(p.kobo / 100) ? "#fff" : NAV,
                                }}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>

                    <label style={{ font: "600 13px 'Figtree',sans-serif", display: "block", marginBottom: 6 }}>
                        Or enter amount (₦)
                    </label>
                    <input
                        type="number"
                        min="100"
                        step="100"
                        className="in"
                        value={amountInput}
                        onChange={e => setAmountInput(e.target.value)}
                        placeholder="e.g. 5000"
                        style={{ marginBottom: 12 }}
                    />

                    {depositError && (
                        <div style={{ background: "#fde8e8", border: "1px solid #f3b4b4", borderRadius: 10, padding: "10px 14px", font: "400 13px 'Figtree',sans-serif", color: "#8f1d1d", marginBottom: 12 }}>
                            {depositError}
                        </div>
                    )}

                    <div style={{ display: "flex", gap: 8 }}>
                        <button
                            type="button"
                            className="btn"
                            disabled={depositing}
                            onClick={handleDeposit}
                            style={{ flex: 1 }}
                        >
                            {depositing ? "Processing…" : "Pay with Paystack"}
                        </button>
                        <button
                            type="button"
                            className="btn btn2"
                            onClick={() => { setShowDeposit(false); setDepositError(null); setAmountInput(""); }}
                            style={{ minWidth: 80 }}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Transaction history */}
            <div>
                <div style={{ font: "700 17px 'Figtree',sans-serif", marginBottom: 10 }}>Recent activity</div>
                {!data || data.entries.length === 0 ? (
                    <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 16, padding: 20, font: "400 14px 'Figtree',sans-serif", color: MUTED }}>
                        No transactions yet.
                    </div>
                ) : (
                    <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 16, overflow: "hidden" }}>
                        {data.entries.map((e, i) => {
                            const isCredit = e.amountKobo > 0;
                            const naira = Math.abs(e.amountKobo / 100).toLocaleString("en-NG", { minimumFractionDigits: 2 });
                            return (
                                <div
                                    key={e.id}
                                    style={{
                                        display: "flex", alignItems: "center", gap: 12, padding: "14px 18px",
                                        borderTop: i > 0 ? `1px solid ${BORDER}` : "none",
                                    }}
                                >
                                    <div style={{
                                        width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                                        background: isCredit ? "#e6f4e1" : "#fff0ef",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        font: "700 16px 'Figtree',sans-serif",
                                        color: isCredit ? GREEN : "#c90000",
                                    }}>
                                        {isCredit ? "+" : "−"}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ font: "600 14px 'Figtree',sans-serif" }}>
                                            {ENTRY_LABELS[e.type] ?? e.type}
                                        </div>
                                        {e.note && (
                                            <div style={{ font: "400 12px 'Figtree',sans-serif", color: MUTED, marginTop: 1 }}>
                                                {e.note}
                                            </div>
                                        )}
                                        <div style={{ font: "400 12px 'Figtree',sans-serif", color: MUTED, marginTop: 1 }}>
                                            {new Date(e.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                                        </div>
                                    </div>
                                    <div style={{ font: "700 15px 'Figtree',sans-serif", color: isCredit ? GREEN : "#c90000", flexShrink: 0 }}>
                                        {isCredit ? "+" : "−"}₦{naira}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
