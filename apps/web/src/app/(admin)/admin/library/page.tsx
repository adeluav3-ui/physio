import { requireSession } from "@/lib/session";
import { apiFetch } from "@/lib/api";
import { LibraryTable, type Exercise } from "./_library-table";

export default async function AdminLibraryPage() {
    await requireSession(["ADMIN"]);

    let exercises: Exercise[] = [];
    try {
        exercises = await apiFetch<Exercise[]>("/admin/library");
        exercises.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    } catch {
        // empty state or endpoint not yet wired
    }

    return (
        <div className="p-6">
            <h1 className="text-2xl font-semibold">Exercise library</h1>
            <p className="mt-1 text-sm text-text-muted">
                All exercises available for rehabilitation programs.
            </p>
            <div className="mt-6">
                <LibraryTable initialExercises={exercises} />
            </div>
        </div>
    );
}
