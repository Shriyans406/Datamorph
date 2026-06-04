import { NextRequest, NextResponse } from "next/server"
import { getGoogleAuthUrl } from "@/services/connectors/google-sheets/google-sheets.service"

export async function GET(req: NextRequest) {
    const url = getGoogleAuthUrl()
    return NextResponse.redirect(url)
}
