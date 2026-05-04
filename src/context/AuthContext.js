'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null)
  const [cargandoAuth, setCargandoAuth] = useState(true)

  useEffect(() => {
    async function cargarPerfil() {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        // Traemos todos los datos del hermano logueado
        const { data: hermano } = await supabase
          .from('hermanos')
          .select('*') 
          .eq('user_id', session.user.id)
          .single()
        
        if (hermano) setUsuario(hermano)
      }
      
      // Mantenemos tu temporizador para que se vea la animación del Templo
      setTimeout(() => {
        setCargandoAuth(false)
      }, 2800)
    }

    cargarPerfil()
  }, [])

  return (
    <AuthContext.Provider value={{ usuario, cargandoAuth }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)