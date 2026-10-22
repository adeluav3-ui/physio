import { Card } from "@physio/ui";

const SPECIALTIES = [
    { key: "PHYSIO", label: "Physiotherapist", env: "NEXT_PUBLIC_WHATSAPP_PHYSIO" },
    { key: "SPEECH", label: "Speech therapist", env: "NEXT_PUBLIC_WHATSAPP_SPEECH" },
    { key: "OT", label: "Occupational therapist", env: "NEXT_PUBLIC_WHATSAPP_OT" },
    { key: "PROSTHETIST", label: "Prosthetist", env: "NEXT_PUBLIC_WHATSAPP_PROSTHETIST" },
    { key: "ORTHOTIST", label: "Orthotist", env: "NEXT_PUBLIC_WHATSAPP_ORTHOTIST" },
] as const;

export default function LandingPage() {
    const patientLink = process.env.NEXT_PUBLIC_WHATSAPP_PATIENTS ?? "#";
    const specialtyLinks = Object.fromEntries(
        SPECIALTIES.map((s) => [s.key, process.env[s.env] ?? "#"]),
    ) as Record<(typeof SPECIALTIES)[number]["key"], string>;

    return (
        <main className="min-h-screen bg-bg">
            <div className="mx-auto max-w-5xl px-4 py-16 md:py-24">
                {/* Hero */}
                <section className="text-center">
                    <p className="text-sm font-medium uppercase tracking-wide text-primary-600">
                        Launching soon in Nigeria
                    </p>
                    <h1 className="mt-4 text-4xl font-semibold leading-tight text-text md:text-5xl">
                        Rehabilitation care,
                        <br className="hidden sm:block" /> from wherever you are.
                    </h1>
                    <p className="mx-auto mt-6 max-w-2xl text-lg text-text-muted">
                        A single platform for patients and the professionals who help them
                        recover — physiotherapists, speech therapists, occupational therapists,
                        prosthetists, and orthotists.
                    </p>
                </section>

                {/* Two cards */}
                <section className="mt-16 grid gap-6 md:grid-cols-2">
                    {/* Patients */}
                    <Card className="flex flex-col gap-4 p-8">
                        <div>
                            <h2 className="text-2xl font-semibold text-text">I'm a patient</h2>
                            <p className="mt-3 text-base text-text-muted">
                                Get assessed and treated by licensed rehabilitation professionals
                                over video, follow a personalised program at home, and get hands-on
                                care when you need it.
                            </p>
                        </div>
                        <a
                            href={patientLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-auto inline-flex h-12 items-center justify-center rounded-md bg-primary-500 px-4 text-base font-medium text-text-inverse transition-colors hover:bg-primary-600"
                        >
                            Join the patient waitlist
                        </a>
                    </Card>

                    {/* Professionals */}
                    <Card className="flex flex-col gap-4 p-8">
                        <div>
                            <h2 className="text-2xl font-semibold text-text">
                                I'm a rehabilitation professional
                            </h2>
                            <p className="mt-3 text-base text-text-muted">
                                Join a network of licensed practitioners building the future of
                                rehabilitation care in Nigeria. Choose your specialty to join the
                                relevant group.
                            </p>
                        </div>
                        <div className="mt-2 flex flex-col gap-2">
                            {SPECIALTIES.map((s) => (
                                <a
                                    key={s.key}
                                    href={specialtyLinks[s.key]}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex h-11 items-center justify-between rounded-md border border-border bg-surface px-4 text-sm font-medium text-text transition-colors hover:border-primary-500 hover:bg-primary-50"
                                >
                                    <span>{s.label}</span>
                                    <span aria-hidden className="text-text-muted">→</span>
                                </a>
                            ))}
                        </div>
                    </Card>
                </section>

                {/* Footer */}
                <footer className="mt-20 border-t border-border pt-8 text-center text-sm text-text-muted">
                    <p>
                        <strong className="text-text">Physio</strong> — a holistic rehabilitation platform.
                        Launching soon in Nigeria.
                    </p>
                </footer>
            </div>
        </main>
    );
}