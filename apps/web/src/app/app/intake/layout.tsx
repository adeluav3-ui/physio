"use client";

import { IntakeProvider } from "./intake-store";

export default function IntakeLayout({ children }: { children: React.ReactNode }) {
    return <IntakeProvider>{children}</IntakeProvider>;
}