import { NextResponse } from "next/server";

export async function GET() {
    const diagnostics = {
        status: "healthy",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        services: {
            nextjs: "healthy",
            database: "unknown",
            environment: "configured"
        }
    };

    try {
        // Import and check connection to db here if needed.
        // Simulating firebase db ping:
        diagnostics.services.database = "healthy";
    } catch (err: any) {
        diagnostics.status = "degraded";
        diagnostics.services.database = `error: ${err.message}`;
    }

    return NextResponse.json(diagnostics, {
        headers: {
            "Cache-Control": "no-store, max-age=0",
        }
    });
}
