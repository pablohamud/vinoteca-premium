import { NextResponse } from "next/server";

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Permitir acceso a la página de login
  if (pathname === "/admin") {
    return NextResponse.next();
  }

  // Proteger subrutas de admin (/admin/pedidos, /admin/planes, etc.)
  if (pathname.startsWith("/admin/")) {
    const cookies = request.cookies;
    const hasSession = cookies.getAll().some(
      (c) => c.name.includes("supabase") || c.name.includes("sb-")
    );

    if (!hasSession) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};