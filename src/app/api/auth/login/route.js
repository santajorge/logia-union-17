import { NextResponse } from 'next/server'

export async function POST() {
  // La validación de credenciales ahora ocurre en el cliente con Supabase.
  // Esta API solo se encarga de emitir la cookie para que el middleware te deje pasar al /panel.
  const response = NextResponse.json({ success: true })
  
  response.cookies.set({
    name: 'sanitas_session',
    value: 'autenticado_por_supabase',
    httpOnly: true,
    path: '/',
    maxAge: 60 * 60 * 24 * 7 // 1 semana de sesión
  })
  
  return response
}