export default function Loading() {
    return (
        <div className="mx-auto max-w-xl p-4 animate-pulse">
            <div className="mb-4 h-7 w-32 rounded bg-neutral-200" />
            <div className="rounded-xl border border-border p-4 space-y-4">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="space-y-1">
                        <div className="h-3 w-20 rounded bg-neutral-200" />
                        <div className="h-5 w-48 rounded bg-neutral-100" />
                    </div>
                ))}
            </div>
        </div>
    );
}
