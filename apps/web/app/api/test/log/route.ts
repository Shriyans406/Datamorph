import { NextResponse } from "next/server"
import { logger } from "@/lib/logger"

export async function POST() {
    logger.info("Test log endpoint hit", { source: "test_lab", metric: 42 })
    logger.warn("This is a simulated warning", { diskSpace: "low" })
    logger.error("Simulated caught error", new Error("Fake DB Timeout"), { queryId: "abc-123" })

    return NextResponse.json({ success: true })
}
