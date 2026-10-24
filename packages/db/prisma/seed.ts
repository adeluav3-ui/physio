import { PrismaClient } from "../generated/client/client.js";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const exercises = [
    {
        name: "Knee extension (seated)",
        region: "KNEE",
        videoUrl: "https://placeholder.physio/exercises/knee-extension.mp4",
        cues: "Sit tall, straighten one leg slowly until knee is straight, hold, lower with control.",
        contraindications: "Stop if sharp knee pain.",
        difficulty: 1,
    },
    {
        name: "Wall sit",
        region: "KNEE",
        videoUrl: "https://placeholder.physio/exercises/wall-sit.mp4",
        cues: "Back against wall, slide down until thighs are parallel to floor, hold, rise.",
        contraindications: "Avoid with acute knee swelling.",
        difficulty: 2,
    },
    {
        name: "Heel slides",
        region: "KNEE",
        videoUrl: "https://placeholder.physio/exercises/heel-slides.mp4",
        cues: "Lie on back, slide heel toward buttocks, hold briefly, slide back.",
        contraindications: "Stop if knee locking occurs.",
        difficulty: 1,
    },
    {
        name: "Shoulder pendulum",
        region: "SHOULDER",
        videoUrl: "https://placeholder.physio/exercises/shoulder-pendulum.mp4",
        cues: "Lean forward, let arm hang, swing gently in small circles.",
        contraindications: "Avoid with acute shoulder dislocation.",
        difficulty: 1,
    },
    {
        name: "External rotation with band",
        region: "SHOULDER",
        videoUrl: "https://placeholder.physio/exercises/external-rotation.mp4",
        cues: "Elbow at 90°, pull band outward slowly, return with control.",
        contraindications: "Stop if shoulder pinching.",
        difficulty: 2,
    },
    {
        name: "Scapular retraction",
        region: "SHOULDER",
        videoUrl: "https://placeholder.physio/exercises/scapular-retraction.mp4",
        cues: "Squeeze shoulder blades together, hold 5s, relax.",
        contraindications: "None common.",
        difficulty: 1,
    },
    {
        name: "Pelvic tilt",
        region: "LOWER_BACK",
        videoUrl: "https://placeholder.physio/exercises/pelvic-tilt.mp4",
        cues: "Lie on back, flatten lower back into floor, hold 5s, relax.",
        contraindications: "Stop if pain radiates down leg.",
        difficulty: 1,
    },
    {
        name: "Bird-dog",
        region: "LOWER_BACK",
        videoUrl: "https://placeholder.physio/exercises/bird-dog.mp4",
        cues: "On all fours, extend opposite arm and leg, hold 3s, switch.",
        contraindications: "Avoid with acute back spasm.",
        difficulty: 2,
    },
    {
        name: "Cat-camel",
        region: "LOWER_BACK",
        videoUrl: "https://placeholder.physio/exercises/cat-camel.mp4",
        cues: "On all fours, alternate arching and rounding the spine slowly.",
        contraindications: "Stop if sharp pain.",
        difficulty: 1,
    },
    {
        name: "Glute bridge",
        region: "HIP",
        videoUrl: "https://placeholder.physio/exercises/glute-bridge.mp4",
        cues: "Lie on back, knees bent, lift hips until straight line from knees to shoulders, hold, lower.",
        contraindications: "Avoid with acute hip pain.",
        difficulty: 2,
    },
];

async function seedExercises() {
    console.log("Seeding exercise library...");
    for (const e of exercises) {
        await prisma.exercise.upsert({
            where: { id: e.name.toLowerCase().replace(/\s+/g, "-") },
            update: e,
            create: { id: e.name.toLowerCase().replace(/\s+/g, "-"), ...e },
        });
    }
    console.log(`Seeded ${exercises.length} exercises.`);
}

async function seedAdmin() {
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;

    if (!email || !password) {
        console.log("ADMIN_EMAIL / ADMIN_PASSWORD not set — skipping admin seed.");
        return;
    }

    if (password.length < 12) {
        console.error("ADMIN_PASSWORD must be at least 12 characters.");
        process.exit(1);
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const existing = await prisma.user.findUnique({ where: { email } });

    if (existing) {
        await prisma.user.update({
            where: { email },
            data: {
                role: "ADMIN",
                status: "ACTIVE",
                emailVerifiedAt: existing.emailVerifiedAt ?? new Date(),
                passwordHash,
            },
        });
        console.log(`Admin updated: ${email}`);
    } else {
        await prisma.user.create({
            data: {
                email,
                name: email.split("@")[0]!,
                role: "ADMIN",
                status: "ACTIVE",
                emailVerifiedAt: new Date(),
                passwordHash,
            },
        });
        console.log(`Admin created: ${email}`);
    }
}

// ── Licensing bodies ──────────────────────────────────────────────────────────
// TODO(Victor): Replace placeholder names with the real accrediting bodies.
// COREN = Council for Rehabilitation of Patients in Nigeria (placeholder)
const LICENSING_BODIES = [
    { discipline: "PHYSIOTHERAPY",      name: "Medical Rehabilitation Therapists (Registration) Board of Nigeria (MRTB)", country: "NG" },
    { discipline: "OCCUPATIONAL_THERAPY", name: "Medical Rehabilitation Therapists (Registration) Board of Nigeria (MRTB)", country: "NG" },
    { discipline: "SPEECH_THERAPY",     name: "Medical Rehabilitation Therapists (Registration) Board of Nigeria (MRTB)", country: "NG" },
    { discipline: "PROSTHETICS",        name: "PLACEHOLDER — Prosthetics & Orthotics Board Nigeria (TODO: confirm)", country: "NG" },
    { discipline: "ORTHOTICS",          name: "PLACEHOLDER — Prosthetics & Orthotics Board Nigeria (TODO: confirm)", country: "NG" },
] as const;

async function seedLicensingBodies() {
    for (const body of LICENSING_BODIES) {
        await prisma.licensingBody.upsert({
            where: { discipline_name_country: { discipline: body.discipline, name: body.name, country: body.country } },
            create: { discipline: body.discipline, name: body.name, country: body.country, active: true },
            update: {},
        });
    }
    console.log(`Licensing bodies seeded: ${LICENSING_BODIES.length}`);
}

async function main() {
    await seedExercises();
    await seedLicensingBodies();
    await seedAdmin();
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
