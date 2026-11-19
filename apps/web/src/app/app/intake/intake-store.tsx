"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

type IntakeDraft = {
    complaint: string;
    bodyRegion: string;
    onset: string;
    painScore: number;
    history: string;
    medications: string;
    redFlags: Record<string, boolean>;
};

const defaultDraft: IntakeDraft = {
    complaint: "",
    bodyRegion: "",
    onset: "",
    painScore: 5,
    history: "",
    medications: "",
    redFlags: {},
};

const STORAGE_KEY = "rehab360_intake_draft";

type IntakeContextType = {
    draft: IntakeDraft;
    update: (patch: Partial<IntakeDraft>) => void;
    reset: () => void;
};

const IntakeContext = createContext<IntakeContextType | null>(null);

export function IntakeProvider({ children }: { children: ReactNode }) {
    const [draft, setDraft] = useState<IntakeDraft>(() => {
        if (typeof window !== "undefined") {
            try {
                const saved = sessionStorage.getItem(STORAGE_KEY);
                if (saved) return JSON.parse(saved) as IntakeDraft;
            } catch {
                // ignore parse errors
            }
        }
        return defaultDraft;
    });

    useEffect(() => {
        try {
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
        } catch {
            // ignore storage errors (private browsing quota)
        }
    }, [draft]);

    const update = (patch: Partial<IntakeDraft>) =>
        setDraft((prev) => ({ ...prev, ...patch }));

    const reset = () => {
        setDraft(defaultDraft);
        try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
    };

    return (
        <IntakeContext.Provider value={{ draft, update, reset }}>
            {children}
        </IntakeContext.Provider>
    );
}

export function useIntake() {
    const ctx = useContext(IntakeContext);
    if (!ctx) throw new Error("useIntake must be used inside IntakeProvider");
    return ctx;
}
