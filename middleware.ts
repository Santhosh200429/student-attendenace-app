import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // Define public paths that don't require authentication
  const isPublicPath = path === "/" || path === "/login" || path === "/register"

  // Get the session cookie
  const sessionCookie = request.cookies.get("session")?.value

  // If the path is not public and there's no session, redirect to login
  if (!isPublicPath && !sessionCookie) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // If the path is for admin and the user is not an admin, redirect to login
  if (path.startsWith("/admin") && sessionCookie) {
    try {
      const session = JSON.parse(sessionCookie)
      if (!session.isAdmin) {
        return NextResponse.redirect(new URL("/login?role=admin", request.url))
      }
    } catch (error) {
      // If there's an error parsing the session, clear the cookie and redirect to login
      const response = NextResponse.redirect(new URL("/login", request.url))
      response.cookies.delete("session")
      return response
    }
  }

  // If the user is logged in and tries to access login/register, redirect to dashboard
  if (isPublicPath && sessionCookie && path !== "/") {
    try {
      const session = JSON.parse(sessionCookie)
      const redirectPath = session.isAdmin ? "/admin/dashboard" : "/student/dashboard"
      return NextResponse.redirect(new URL(redirectPath, request.url))
    } catch (error) {
      // If there's an error parsing the session, clear the cookie
      const response = NextResponse.next()
      response.cookies.delete("session")
      return response
    }
  }

  return NextResponse.next()
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public directory)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)",
  ],
}
