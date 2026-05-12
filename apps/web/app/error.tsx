"use client"

export default function ErrorPage({
    error,
    reset,
}: {
    error: Error
    reset: () => void
}) {
    return (
        <main className="p-10 space-y-4">
            <h1 className="text-2xl font-bold">
                Something went wrong
            </h1>

            <p>{error.message}</p>

            <button
                onClick={reset}
                className="border px-4 py-2 rounded-xl"
            >
                Try again
            </button>
        </main>
    )
}