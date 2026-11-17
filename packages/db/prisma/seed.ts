import { PrismaClient } from "../generated/client/client.js";
import bcrypt from "bcryptjs";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const prisma = new PrismaClient();

const __dirname = dirname(fileURLToPath(import.meta.url));
const CSV_PATH = join(__dirname, "../../exercise-animation/rehab360-anim/data/rehab360-exercise-library.csv");

// ── CSV parser (RFC 4180, handles quoted fields with commas) ──────────────────
function parseCSVRow(line: string): string[] {
    const fields: string[] = [];
    let i = 0;
    while (i <= line.length) {
        if (i === line.length) { fields.push(""); break; }
        if (line[i] === '"') {
            let field = "";
            i++;
            while (i < line.length) {
                if (line[i] === '"' && line[i + 1] === '"') { field += '"'; i += 2; }
                else if (line[i] === '"') { i++; break; }
                else { field += line[i++]; }
            }
            fields.push(field);
            if (line[i] === ",") i++;
        } else {
            const end = line.indexOf(",", i);
            if (end === -1) { fields.push(line.slice(i)); break; }
            fields.push(line.slice(i, end));
            i = end + 1;
        }
    }
    return fields;
}

function readExerciseCSV() {
    const text = readFileSync(CSV_PATH, "utf-8");
    const lines = text.replace(/\r\n/g, "\n").split("\n").filter(l => l.trim());
    const [headerLine, ...dataLines] = lines;
    const headers = parseCSVRow(headerLine!);
    return dataLines.map(line => {
        const vals = parseCSVRow(line);
        return Object.fromEntries(headers.map((h, i) => [h, vals[i] ?? ""])) as Record<string, string>;
    });
}

async function seedExercises() {
    console.log("Seeding exercise library from CSV...");
    let rows: ReturnType<typeof readExerciseCSV>;
    try {
        rows = readExerciseCSV();
    } catch (e) {
        console.warn("CSV not found — skipping exercise seed:", (e as Error).message);
        return;
    }
    for (const row of rows) {
        const csvId = row["id"]!;
        await prisma.exercise.upsert({
            where: { csvId },
            update: {
                name:         row["name"] ?? "",
                region:       row["region"] ?? "",
                joint:        row["joint"] || null,
                purpose:      row["purpose"] || null,
                goal:         row["goal"] || null,
                conditions:   row["conditions"] || null,
                position:     row["position"] || null,
                howTo:        row["how"] || null,
                dose:         row["dose"] || null,
                progression:  row["progression"] || null,
                precautions:  row["precautions"] || null,
                equipment:    row["equipment"] || null,
                videoStatus:  row["videoStatus"] || null,
                poseKey:      csvId,
                // clinicalReview stays false until an admin ticks it in the UI
            },
            create: {
                csvId,
                name:         row["name"] ?? "",
                region:       row["region"] ?? "",
                joint:        row["joint"] || null,
                purpose:      row["purpose"] || null,
                goal:         row["goal"] || null,
                conditions:   row["conditions"] || null,
                position:     row["position"] || null,
                howTo:        row["how"] || null,
                dose:         row["dose"] || null,
                progression:  row["progression"] || null,
                precautions:  row["precautions"] || null,
                equipment:    row["equipment"] || null,
                videoStatus:  row["videoStatus"] || null,
                poseKey:      csvId,
                clinicalReview: false,
                cues:         "",
                difficulty:   1,
                defaultSets:  3,
                defaultReps:  10,
                defaultHoldSeconds: 0,
            },
        });
    }
    console.log(`Seeded ${rows.length} exercises from CSV.`);
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
