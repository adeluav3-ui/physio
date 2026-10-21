"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

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

type IntakeContextType = {
    draft: IntakeDraft;
    update: (patch: Partial<IntakeDraft>) => void;
    reset: () => void;
};

const IntakeContext = createContext<IntakeContextType | null>(null);

export function IntakeProvider({ children }: { children: ReactNode }) {
    const [draft, setDraft] = useState<IntakeDraft>(defaultDraft);

    const update = (patch: Partial<IntakeDraft>) =>
        setDraft((prev) => ({ ...prev, ...patch }));

    const reset = () => setDraft(defaultDraft);

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