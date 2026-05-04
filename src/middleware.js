import { NextResponse } from 'next/server'

export function middleware(req) {
  const session = req.cookies.get('sanitas_session')

  // Protegemos toda la carpeta /panel y sus subrutas
  if (req.nextUrl.pathname.startsWith('/panel')) {
    // Si no tiene la cookie correcta de Supabase, vuelve al login
    if (!session || session.value !== 'autenticado_por_supabase') {
      return NextResponse.redirect(new URL('/login', req.url))
    }
  }

  // Si ya está logueado y quiere ir al /login por error, lo devolvemos al panel
  if (req.nextUrl.pathname === '/login' && session && session.value === 'autenticado_por_supabase') {
    return NextResponse.redirect(new URL('/panel', req.url))
  }

  return NextResponse.next()
}

// Configuración de las rutas que el middleware debe vigilar
export const config = {
  matcher: ['/panel/:path*', '/login'],
}