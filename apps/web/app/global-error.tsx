"use client"

import { useEffect } from "react"
// import * as Sentry from "@sentry/nextjs"

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        // Sentry.captureException(error)
        console.error("Global crash:", error)
    }, [error])

    return (
        <html>
            <body className="bg-slate-950 text-slate-200 h-screen flex flex-col items-center justify-center p-4">
                <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-xl p-8 text-center shadow-2xl">
                    <h2 className="text-2xl font-bold text-white mb-4">Critical System Error</h2>
                    <p className="text-slate-400 mb-8">
                        A critical error occurred at the application root. Our team has been notified.
                    </p>
                    <button
                        onClick={() => reset()}
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
                    >
                        Attempt Recovery
                    </button>
                </div>
            </body>
        </html>
    )
}
