type LogLevel = "info" | "warn" | "error" | "debug"

interface LogEntry {
    timestamp: string
    level: LogLevel
    message: string
    context?: Record<string, any>
    error?: string
}

class Logger {
    private log(level: LogLevel, message: string, context?: Record<string, any>, error?: any) {
        const entry: LogEntry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            ...(context && { context }),
            ...(error && { error: error instanceof Error ? error.message : String(error) })
        }

        // In a real production environment, you might send this to Datadog, AWS CloudWatch, etc.
        const output = JSON.stringify(entry)

        switch (level) {
            case "info":
                console.log(output)
                break
            case "warn":
                console.warn(output)
                break
            case "error":
                console.error(output)
                break
            case "debug":
                console.debug(output)
                break
        }
    }

    info(message: string, context?: Record<string, any>) {
        this.log("info", message, context)
    }

    warn(message: string, context?: Record<string, any>) {
        this.log("warn", message, context)
    }

    error(message: string, error?: any, context?: Record<string, any>) {
        this.log("error", message, context, error)
    }

    debug(message: string, context?: Record<string, any>) {
        this.log("debug", message, context)
    }
}

export const logger = new Logger()
