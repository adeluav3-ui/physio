"use client";

import { useEffect, useState } from "react";

type Payout = {
    id: string;
    amountKobo: number;
    createdAt: string;
    appointment: {
        id: string;
        startsAt: string;
        patient: { user: { name: string } };
    };
};

type Withdrawal = {
    id: string;
    amountKobo: number;
    status: "PENDING" | "APPROVED" | "REJECTED";
    bankName: string;
    accountNumber: string;
    accountName: string;
    adminNote: string | null;
    createdAt: string;
};

type Wallet = {
    availableKobo: number;
    totalEarnedKobo: number;
    payouts: Payout[];
    withdrawals: Withdrawal[];
};

const NIGERIAN_BANKS = [
    "Access Bank", "Citibank Nigeria", "EcoBank", "Fidelity Bank",
    "First Bank of Nigeria", "First City Monument Bank (FCMB)", "Guaranty Trust Bank (GTBank)",
    "Heritage Bank", "Keystone Bank", "Opay", "PalmPay", "Polaris Bank",
    "Providus Bank", "Stanbic IBTC Bank", "Standard Chartered", "Sterling Bank",
    "Union Bank", "United Bank for Africa (UBA)", "Unity Bank",
    "Wema Bank", "Zenith Bank",
];

function fmt(kobo: number) {
    return `₦${(kobo / 100).toLocaleString("en-NG", { minimumFractionDigits: 0 })}`;
}

function fmtDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}

const STATUS_LABEL: Record<string, string> = {
    PENDING: "Pending review",
    APPROVED: "Approved",
    REJECTED: "Rejected",
};

const STATUS_COLOR: Record<string, React.CSSProperties> = {
    PENDING: { background: "#fdf1d8", color: "#7a4f00" },
    APPROVED: { background: "#e3f4e8", color: "#1d5c34" },
    REJECTED: { background: "#fde8e8", color: "#8f1d1d" },
};

export default function ProWalletPage() {
    const [wallet, setWallet] = useState<Wallet | null>(null);
    const [loading, setLoading] = useState(true);
    const [showWithdraw, setShowWithdraw] = useState(false);

    // Withdrawal form state
    const [amount, setAmount] = useState("");
    const [bankName, setBankName] = useState("");
    const [accountNumber, setAccountNumber] = useState("");
    const [accountName, setAccountName] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [submitDone, setSubmitDone] = useState(false);

    useEffect(() => {
        fetch("/api/proxy/payments/me/wallet")
            .then((r) => r.ok ? r.json() : null)
            .then((data: Wallet | null) => { if (data) setWallet(data); })
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    async function submitWithdrawal() {
        setSubmitError(null);
        const amountNaira = Number(amount);
        if (!amountNaira || amountNaira < 500) {
            setSubmitError("Minimum withdrawal is ₦500.");
            return;
        }
        if (!bankName || !accountNumber || !accountName) {
            setSubmitError("Please fill in all bank details.");
            return;
        }
        if (!/^\d{10}$/.test(accountNumber)) {
            setSubmitError("Account number must be exactly 10 digits.");
            return;
        }
        const amountKobo = Math.round(amountNaira * 100);
        if (wallet && amountKobo > wallet.availableKobo) {
            setSubmitError(`Maximum you can withdraw is ${fmt(wallet.availableKobo)}.`);
            return;
        }
        setSubmitting(true);
        try {
            const res = await fetch("/api/proxy/payments/me/withdrawal", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amountKobo, bankName, accountNumber, accountName }),
            });
            if (!res.ok) {
                const b = await res.json().catch(() => ({}));
                throw new Error((b as { message?: string }).message ?? "Request failed.");
            }
            const newWithdrawal: Withdrawal = await res.json();
            setWallet((prev) => prev ? ({
                ...prev,
                availableKobo: prev.availableKobo - amountKobo,
                withdrawals: [newWithdrawal, ...prev.withdrawals],
            }) : prev);
            setSubmitDone(true);
            setAmount(""); setBankName(""); setAccountNumber(""); setAccountName("");
        } catch (e) {
            setSubmitError((e as Error).message);
        } finally {
            setSubmitting(false);
        }
    }

    if (loading) {
        return <div className="muted" style={{ font: "400 15px 'Figtree',sans-serif", padding: "20px 0" }}>Loading…</div>;
    }

    const available = wallet?.availableKobo ?? 0;
    const totalEarned = wallet?.totalEarnedKobo ?? 0;
    const payouts = wallet?.payouts ?? [];
    const withdrawals = wallet?.withdrawals ?? [];

    return (
        <div style={{ maxWidth: "680px" }}>
            <div style={{ marginBottom: "24px" }}>
                <h1 style={{ font: "700 24px 'Figtree',sans-serif", margin: 0 }}>Wallet</h1>
                <p className="muted" style={{ font: "400 14px 'Figtree',sans-serif", marginTop: "4px" }}>
                    Your earnings are released 24 hours after each session note is signed.
                </p>
            </div>

            {/* Balance cards */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginBottom: "24px" }}>
                <div className="card" style={{ flex: "1 1 200px", background: "#0f5a08", border: "none", padding: "20px 24px" }}>
                    <div style={{ font: "400 13px 'Figtree',sans-serif", color: "rgba(255,255,255,0.75)" }}>Available to withdraw</div>
                    <div style={{ font: "700 28px 'Figtree',sans-serif", color: "#fff", marginTop: "4px" }}>{fmt(available)}</div>
                </div>
                <div className="card" style={{ flex: "1 1 200px", padding: "20px 24px" }}>
                    <div style={{ font: "400 13px 'Figtree',sans-serif" }} className="muted">Total earned (all time)</div>
                    <div style={{ font: "700 28px 'Figtree',sans-serif", marginTop: "4px" }}>{fmt(totalEarned)}</div>
                </div>
            </div>

            {/* Withdraw button */}
            {available > 0 && !showWithdraw && (
                <button
                    type="button"
                    className="btn"
                    style={{ marginBottom: "24px" }}
                    onClick={() => { setShowWithdraw(true); setSubmitDone(false); }}
                >
                    Withdraw funds
                </button>
            )}

            {/* Withdrawal form */}
            {showWithdraw && (
                <div className="card" style={{ marginBottom: "24px" }}>
                    <h2 style={{ font: "700 17px 'Figtree',sans-serif", margin: "0 0 16px" }}>Request withdrawal</h2>

                    {submitDone ? (
                        <div style={{ background: "#e8f7e5", border: "1px solid #b6dcc2", borderRadius: "10px", padding: "14px 16px", font: "400 14px 'Figtree',sans-serif", color: "#1d5c34" }}>
                            Your withdrawal request has been submitted. We will process it within 1–2 business days and transfer to your bank account.
                            <br /><br />
                            <button type="button" className="btn btn2" style={{ fontSize: "13px", minHeight: "36px" }} onClick={() => setShowWithdraw(false)}>Close</button>
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                            <div>
                                <label className="flabel" htmlFor="amt">Amount (₦)</label>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <span style={{ font: "600 15px 'Figtree',sans-serif" }}>₦</span>
                                    <input
                                        id="amt"
                                        type="number"
                                        min="500"
                                        step="100"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        className="in"
                                        style={{ maxWidth: "180px" }}
                                        placeholder="0"
                                    />
                                </div>
                                <p className="muted" style={{ font: "400 12px 'Figtree',sans-serif", marginTop: "4px" }}>
                                    Available: {fmt(available)}
                                </p>
                            </div>

                            <div>
                                <label className="flabel" htmlFor="bank">Bank</label>
                                <select
                                    id="bank"
                                    value={bankName}
                                    onChange={(e) => setBankName(e.target.value)}
                                    className="in"
                                >
                                    <option value="">Select bank…</option>
                                    {NIGERIAN_BANKS.map((b) => <option key={b} value={b}>{b}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="flabel" htmlFor="acctno">Account number</label>
                                <input
                                    id="acctno"
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={10}
                                    value={accountNumber}
                                    onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ""))}
                                    className="in"
                                    placeholder="10-digit NUBAN"
                                />
                            </div>

                            <div>
                                <label className="flabel" htmlFor="acctname">Account name</label>
                                <input
                                    id="acctname"
                                    type="text"
                                    value={accountName}
                                    onChange={(e) => setAccountName(e.target.value)}
                                    className="in"
                                    placeholder="As it appears on your bank account"
                                />
                            </div>

                            {submitError && (
                                <div style={{ background: "#fde8e8", border: "1px solid #f3b4b4", borderRadius: "10px", padding: "10px 14px", font: "400 13px 'Figtree',sans-serif", color: "#8f1d1d" }}>
                                    {submitError}
                                </div>
                            )}

                            <div style={{ display: "flex", gap: "10px" }}>
                                <button type="button" className="btn" disabled={submitting} onClick={submitWithdrawal} style={{ minWidth: "140px" }}>
                                    {submitting ? "Submitting…" : "Submit request"}
                                </button>
                                <button type="button" className="btn btn2" onClick={() => setShowWithdraw(false)}>
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Earnings history */}
            {payouts.length > 0 && (
                <div style={{ marginBottom: "24px" }}>
                    <h2 style={{ font: "700 17px 'Figtree',sans-serif", margin: "0 0 12px" }}>Earnings history</h2>
                    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                        {payouts.map((p, i) => (
                            <div
                                key={p.id}
                                style={{
                                    display: "flex", alignItems: "center", gap: "12px",
                                    padding: "14px 20px",
                                    borderTop: i === 0 ? "none" : "1px solid var(--line)",
                                }}
                            >
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ font: "600 14px 'Figtree',sans-serif" }}>
                                        {p.appointment.patient.user.name}
                                    </div>
                                    <div className="muted" style={{ font: "400 13px 'Figtree',sans-serif", marginTop: "1px" }}>
                                        Session on {fmtDate(p.appointment.startsAt)}
                                    </div>
                                </div>
                                <div style={{ font: "700 15px 'Figtree',sans-serif", color: "#0f5a08", flexShrink: 0 }}>
                                    +{fmt(p.amountKobo)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {payouts.length === 0 && (
                <div className="card" style={{ textAlign: "center", padding: "40px 24px", marginBottom: "24px" }}>
                    <p className="muted" style={{ font: "400 15px 'Figtree',sans-serif" }}>
                        No earnings yet. Completed sessions will appear here after the 24-hour release window.
                    </p>
                </div>
            )}

            {/* Withdrawal history */}
            {withdrawals.length > 0 && (
                <div>
                    <h2 style={{ font: "700 17px 'Figtree',sans-serif", margin: "0 0 12px" }}>Withdrawal requests</h2>
                    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                        {withdrawals.map((w, i) => (
                            <div
                                key={w.id}
                                style={{
                                    display: "flex", alignItems: "center", gap: "12px",
                                    padding: "14px 20px",
                                    borderTop: i === 0 ? "none" : "1px solid var(--line)",
                                }}
                            >
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ font: "600 14px 'Figtree',sans-serif" }}>
                                        {w.bankName} · {w.accountNumber}
                                    </div>
                                    <div className="muted" style={{ font: "400 13px 'Figtree',sans-serif", marginTop: "1px" }}>
                                        {w.accountName} · {fmtDate(w.createdAt)}
                                    </div>
                                    {w.adminNote && (
                                        <div style={{ font: "400 12px 'Figtree',sans-serif", color: "#8f1d1d", marginTop: "2px" }}>
                                            Note: {w.adminNote}
                                        </div>
                                    )}
                                </div>
                                <div style={{ textAlign: "right", flexShrink: 0 }}>
                                    <div style={{ font: "700 15px 'Figtree',sans-serif" }}>{fmt(w.amountKobo)}</div>
                                    <span style={{ ...STATUS_COLOR[w.status], padding: "2px 8px", borderRadius: "99px", font: "600 11px 'Figtree',sans-serif", display: "inline-block", marginTop: "3px" }}>
                                        {STATUS_LABEL[w.status]}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
