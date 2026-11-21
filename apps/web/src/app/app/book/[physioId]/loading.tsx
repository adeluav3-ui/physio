export default function Loading() {
    return (
        <div className="mx-auto max-w-xl p-4 animate-pulse">
            <div className="mb-6 h-8 w-40 rounded bg-neutral-200" />
            <div className="rounded-xl border border-border p-4 space-y-4 mb-4">
                <div className="flex gap-3 items-center">
                    <div className="h-12 w-12 rounded-full bg-neutral-200 flex-shrink-0" />
                    <div className="space-y-2 flex-1">
                        <div className="h-5 w-32 rounded bg-neutral-200" />
                        <div className="h-4 w-24 rounded bg-neutral-100" />
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="h-10 rounded-lg bg-neutral-100" />
                ))}
            </div>
        </div>
    );
}
