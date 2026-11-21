export default function Loading() {
    return (
        <div className="mx-auto max-w-xl p-4 animate-pulse">
            <div className="mb-4 flex items-center justify-between">
                <div className="h-7 w-24 rounded bg-neutral-200" />
                <div className="h-8 w-16 rounded bg-neutral-100" />
            </div>
            <div className="rounded-xl border border-border p-4 mb-4">
                <div className="h-4 w-20 rounded bg-neutral-200 mb-2" />
                <div className="h-8 w-32 rounded bg-neutral-100" />
            </div>
            <div className="space-y-2">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-14 rounded-lg border border-border bg-neutral-50" />
                ))}
            </div>
        </div>
    );
}
