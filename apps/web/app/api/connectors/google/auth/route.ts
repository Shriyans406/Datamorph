import { NextResponse } from "next/server"
import { getGoogleAuthUrl } from "@/services/connectors/google-sheets/google-sheets.service"

export async function GET() {
    const url = getGoogleAuthUrl()
    return NextResponse.redirect(url)
}
