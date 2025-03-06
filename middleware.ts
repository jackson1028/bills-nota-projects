import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const authToken = request.cookies.get("authToken")?.value
  const isLoginPage = request.nextUrl.pathname === "/login"

  if (!authToken && !isLoginPage && !request.nextUrl.pathname.startsWith("/api")) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  if (authToken && isLoginPage) {
    return NextResponse.redirect(new URL("/nota", request.url))
  }

  
  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}

