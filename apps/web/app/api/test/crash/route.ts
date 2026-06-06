import { NextResponse } from "next/server"

export async function GET() {
    // This will intentionally crash to test Sentry capturing unhandled promise rejections
    throw new Error("Simulated Server-Side API Crash for Testing & Monitoring")
    return NextResponse.json({ success: true })
}
