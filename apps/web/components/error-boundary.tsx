"use client"

import React, { Component, ErrorInfo, ReactNode } from "react"
import { AlertTriangle, RefreshCcw } from "lucide-react"

interface Props {
    children?: ReactNode
    fallback?: ReactNode
}

interface State {
    hasError: boolean
    error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    }

    public static getDerivedStateFromError(error: Error): State {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error }
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo)
        // Here you would normally log the error to an error reporting service like Sentry
        // import * as Sentry from "@sentry/nextjs";
        // Sentry.captureException(error);
    }

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback
            }

            return (
                <div className="flex flex-col items-center justify-center p-8 border border-red-900/30 bg-red-950/10 rounded-xl my-4 text-center">
                    <AlertTriangle className="h-10 w-10 text-red-500 mb-4" />
                    <h2 className="text-xl font-bold text-slate-200 mb-2">Something went wrong</h2>
                    <p className="text-slate-400 max-w-md mb-6">
                        We encountered an unexpected error while rendering this component.
                        The issue has been logged.
                    </p>
                    <button
                        onClick={() => this.setState({ hasError: false, error: null })}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
                    >
                        <RefreshCcw className="h-4 w-4" />
                        Try again
                    </button>
                    {this.state.error && (
                        <div className="mt-6 p-4 bg-black/50 rounded text-left overflow-auto max-w-full text-xs text-red-400 font-mono">
                            {this.state.error.toString()}
                        </div>
                    )}
                </div>
            )
        }

        return this.props.children
    }
}
