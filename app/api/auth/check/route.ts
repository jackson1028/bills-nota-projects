import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET() {
  const cookieStore = cookies()
  const authToken = cookieStore.get("authToken")

  if (authToken) {
    return NextResponse.json({ authenticated: true }, { status: 200 })
  } else {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }
}

