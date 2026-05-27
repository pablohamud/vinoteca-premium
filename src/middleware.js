import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Solo proteger rutas /admin
  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  // Leer cookie de sesión de Supabase
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const cookieHeader = request.headers.get("cookie") || "";

  const supabase = createClient(supabaseUrl, supabaseKey, {
    global: {
      headers: { cookie: cookieHeader },
    },
  });

  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    const loginUrl = new URL("/admin", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};