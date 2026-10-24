import type { Metadata } from "next";
import Link from "next/link";
import { BRAND } from "@physio/shared";
import { Card } from "@physio/ui";
import { LockedLink } from "@/components/locked-link";

export const metadata: Metadata = {
    title: BRAND.name,
    description: BRAND.tagline,
    openGraph: {
        title: BRAND.name,
        description: BRAND.tagline,
    },
};

const DISCIPLINES = [
    { key: "PHYSIO",       label: "Physiotherapy",                env: "NEXT_PUBLIC_WHATSAPP_PHYSIO" },
    { key: "OT",           label: "Occupational Therapy",         env: "NEXT_PUBLIC_WHATSAPP_OT" },
    { key: "SPEECH",       label: "Speech & Language Therapy",    env: "NEXT_PUBLIC_WHATSAPP_SPEECH" },
    { key: "PROSTHETIST",  label: "Prosthetics",                  env: "NEXT_PUBLIC_WHATSAPP_PROSTHETIST" },
    { key: "ORTHOTIST",    label: "Orthotics",                    env: "NEXT_PUBLIC_WHATSAPP_ORTHOTIST" },
] as const;

const HOW_IT_WORKS = [
    { step: "1", title: "Tell us what you need", body: "Complete a short questionnaire so we can match you with the right professional." },
    { step: "2", title: "Book a session",         body: "Choose a licensed professional, pick a time, and pay securely." },
    { step: "3", title: "Start recovering",       body: "Video or home-visit sessions, plus a personalised plan to follow at home." },
] as const;

const FAQ = [
    {
        q: "Is this an emergency service?",
        a: "No. For life-threatening emergencies, call 112 or go to your nearest A&E. Rehab360 connects you with rehabilitation professionals for non-emergency care.",
    },
    {
        q: "Are the professionals licensed?",
        a: "Every professional on Rehab360 is verified against their licensing body before being listed. You will see a \"Verified\" badge on their profile.",
    },
    {
        q: "How is my information kept private?",
        a: "Your health information is stored securely and is only shared with the professional you book. We never sell your data.",
    },
    {
        q: "What countries do you serve?",
        a: "We are currently launching in Nigeria. More countries coming soon.",
    },
] as const;

export default async function LandingPage({ searchParams }: { searchParams: Promise<{ locked?: string }> }) {
    const { locked } = await searchParams;
    const patientLink   = process.env.NEXT_PUBLIC_WHATSAPP_PATIENTS ?? "#";
    const disciplineLinks = Object.fromEntries(
        DISCIPLINES.map((d) => [d.key, process.env[d.env] ?? "#"]),
    ) as Record<(typeof DISCIPLINES)[number]["key"], string>;

    return (
        <div className="min-h-screen bg-bg">
            {/* ── Nav ─────────────────────────────────────────────────────── */}
            <header className="border-b border-border bg-surface">
                <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
                    <span className="text-lg font-semibold text-text">{BRAND.name}</span>
                    <div className="flex items-center gap-3">
                        <LockedLink
                            href="/auth/login"
                            className="rounded-md px-4 py-2 text-sm font-medium text-text-muted hover:text-text"
                        >
                            Log in
                        </LockedLink>
                        <LockedLink
                            href="/auth/signup"
                            className="rounded-md bg-primary-500 px-4 py-2 text-sm font-medium text-text-inverse hover:bg-primary-600"
                        >
                            Sign up
                        </LockedLink>
                    </div>
                </div>
            </header>

            <main>
                {locked && (
                    <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-center">
                        <p className="text-sm text-amber-800">
                            <strong>Access required.</strong> {BRAND.name} is not yet open to the public.
                            Use your access code to continue.
                        </p>
                    </div>
                )}

                {/* ── Hero ───────────────────────────────────────────────── */}
                <section className="mx-auto max-w-5xl px-4 py-16 text-center md:py-24">
                    <p className="text-sm font-medium uppercase tracking-wide text-primary-600">
                        Launching soon in Nigeria
                    </p>
                    <h1 className="mt-4 text-4xl font-semibold leading-tight text-text md:text-5xl">
                        {BRAND.tagline}
                    </h1>
                    <p className="mx-auto mt-6 max-w-2xl text-lg text-text-muted">
                        {BRAND.description}
                    </p>

                    {/* I need care / I provide care toggle cards */}
                    <div className="mt-12 grid gap-6 md:grid-cols-2">
                        {/* Patients */}
                        <Card className="flex flex-col gap-4 p-8 text-left">
                            <div>
                                <h2 className="text-xl font-semibold text-text">I need care</h2>
                                <p className="mt-3 text-base text-text-muted">
                                    Get assessed and treated by a licensed professional — over video,
                                    at home, or in clinic. Follow a personalised plan between sessions.
                                </p>
                            </div>
                            <a
                                href={patientLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-auto inline-flex min-h-[44px] items-center justify-center rounded-md bg-primary-500 px-4 text-base font-medium text-text-inverse transition-colors hover:bg-primary-600"
                            >
                                Join the patient waitlist
                            </a>
                        </Card>

                        {/* Professionals */}
                        <Card className="flex flex-col gap-4 p-8 text-left">
                            <div>
                                <h2 className="text-xl font-semibold text-text">I provide care</h2>
                                <p className="mt-3 text-base text-text-muted">
                                    Join a network of licensed practitioners. Choose your discipline
                                    below to join the relevant pilot group.
                                </p>
                            </div>
                            <div className="mt-2 flex flex-col gap-2">
                                {DISCIPLINES.map((d) => (
                                    <a
                                        key={d.key}
                                        href={disciplineLinks[d.key]}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex min-h-[44px] items-center justify-between rounded-md border border-border bg-surface px-4 text-sm font-medium text-text transition-colors hover:border-primary-500 hover:bg-primary-50"
                                    >
                                        <span>{d.label}</span>
                                        <span aria-hidden className="text-text-muted">→</span>
                                    </a>
                                ))}
                            </div>
                        </Card>
                    </div>
                </section>

                {/* ── How it works ───────────────────────────────────────── */}
                <section className="bg-surface py-16">
                    <div className="mx-auto max-w-5xl px-4">
                        <h2 className="text-center text-2xl font-semibold text-text">How it works</h2>
                        <div className="mt-10 grid gap-6 md:grid-cols-3">
                            {HOW_IT_WORKS.map((step) => (
                                <div key={step.step} className="flex flex-col gap-3">
                                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-50 text-sm font-semibold text-primary-700">
                                        {step.step}
                                    </span>
                                    <h3 className="text-base font-semibold text-text">{step.title}</h3>
                                    <p className="text-sm text-text-muted">{step.body}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── Disciplines ────────────────────────────────────────── */}
                <section className="mx-auto max-w-5xl px-4 py-16">
                    <h2 className="text-center text-2xl font-semibold text-text">Five disciplines, one platform</h2>
                    <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                        {DISCIPLINES.map((d) => (
                            <Card key={d.key} className="p-5 text-center">
                                <p className="text-sm font-semibold text-text">{d.label}</p>
                            </Card>
                        ))}
                    </div>
                </section>

                {/* ── FAQ ─────────────────────────────────────────────────── */}
                <section className="bg-surface py-16">
                    <div className="mx-auto max-w-3xl px-4">
                        <h2 className="text-center text-2xl font-semibold text-text">
                            Frequently asked questions
                        </h2>
                        {/* Emergency notice */}
                        <div className="mt-8 rounded-lg bg-[#fde8e8] p-4">
                            <p className="text-sm font-medium text-[#8f1d1d]">
                                <strong>Not an emergency service.</strong> If you or someone you know
                                is in immediate danger, call 112 or go to your nearest A&E.{" "}
                                {BRAND.name} is for non-emergency rehabilitation care.
                            </p>
                        </div>
                        <dl className="mt-8 flex flex-col gap-6">
                            {FAQ.map((item) => (
                                <div key={item.q}>
                                    <dt className="text-base font-semibold text-text">{item.q}</dt>
                                    <dd className="mt-1.5 text-sm text-text-muted">{item.a}</dd>
                                </div>
                            ))}
                        </dl>
                    </div>
                </section>

                {/* ── Waitlist form ─────────────────────────────────────── */}
                <section className="mx-auto max-w-xl px-4 py-16">
                    <h2 className="text-center text-2xl font-semibold text-text">Stay updated</h2>
                    <p className="mt-3 text-center text-sm text-text-muted">
                        Be the first to know when we launch.
                    </p>
                    <div className="mt-8 flex flex-col gap-3">
                        <LockedLink
                            href="/auth/signup"
                            className="inline-flex min-h-[44px] items-center justify-center rounded-md bg-primary-500 px-4 text-base font-medium text-text-inverse transition-colors hover:bg-primary-600"
                        >
                            Create an account
                        </LockedLink>
                        <LockedLink
                            href="/auth/login"
                            className="inline-flex min-h-[44px] items-center justify-center rounded-md border border-border bg-surface px-4 text-base font-medium text-text transition-colors hover:bg-neutral-50"
                        >
                            I already have an account
                        </LockedLink>
                    </div>
                </section>
            </main>

            {/* ── Footer ─────────────────────────────────────────────────── */}
            <footer className="border-t border-border bg-surface py-8">
                <div className="mx-auto max-w-5xl px-4 text-center text-sm text-text-muted">
                    <p>
                        <strong className="text-text">{BRAND.name}</strong> — {BRAND.description}
                    </p>
                    <p className="mt-2">
                        <Link href="/privacy" className="hover:underline">Privacy policy</Link>
                        {" · "}
                        <Link href="/terms" className="hover:underline">Terms of service</Link>
                        {" · "}
                        <Link href="/safety" className="hover:underline">Safety</Link>
                    </p>
                </div>
            </footer>
        </div>
    );
}
