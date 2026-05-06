'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setCargando(true)

    // 1. Supabase valida el email y la contraseña reales
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      setError('Credenciales incorrectas. Verificá tu correo y contraseña.')
      setCargando(false)
      return
    }

    // 2. Si Supabase aprueba, pedimos la cookie para el middleware
    await fetch('/api/auth/login', { method: 'POST' })

    // 3. Redirigimos al nuevo panel central
    router.push('/panel')
    router.refresh()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#000000', fontFamily: "'Montserrat', sans-serif" }}>
      
      <div style={{ width: '100%', maxWidth: '360px', marginBottom: '1rem' }}>
        <Link href="/" style={{ fontSize: '12px', color: '#9e9b8e', textDecoration: 'none' }}>
          ← Volver a la web pública
        </Link>
      </div>

      <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <Image
          src="logo-union-17-blanco.png"
          alt="Logo Logia Unión N° 17"
          width={130}
          height={130}
          style={{ objectFit: 'contain', marginBottom: '1rem', display: 'block', margin: '0 auto' }}
        />
        <p style={{ fontSize: '11px', color: '#CDA434', letterSpacing: '0.2em', marginBottom: '4px' }}>
          A L.·.G.·.D.·.G.·.A.·.D.·.U.·.
        </p>
        <p style={{ fontSize: '14px', color: '#F5F5F5', fontWeight: '500', margin: 0 }}>
          Aug.·. y Resp.·. Logia Unión N°17
        </p>
        <p style={{ fontSize: '11px', color: '#9e9b8e', margin: '4px 0 0' }}>
          Área reservada
        </p>
      </div>

      <div style={{ backgroundColor: '#214D77', padding: '2.5rem', borderRadius: '12px', width: '100%', maxWidth: '360px', border: '1px solid #CDA434' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {error && (
            <div style={{ backgroundColor: '#3a1c1c', color: '#e88e8e', padding: '0.75rem', borderRadius: '8px', fontSize: '13px', textAlign: 'center', border: '1px solid #e88e8e' }}>
              {error}
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#F8F5F0', marginBottom: '8px' }}>Correo Electrónico</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #555', backgroundColor: '#AAA8B1', color: '#000000', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#F8F5F0', marginBottom: '8px' }}>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #555', backgroundColor: '#AAA8B1', color: '#000000', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
              required
            />
          </div>

          <button
            type="submit"
            disabled={cargando}
            style={{ marginTop: '0.5rem', backgroundColor: '#CFB53B', color: '#1C1C1C', padding: '12px', borderRadius: '6px', border: 'none', fontSize: '14px', fontWeight: '600', cursor: cargando ? 'not-allowed' : 'pointer', transition: 'background-color 0.2s', opacity: cargando ? 0.7 : 1 }}
          >
            {cargando ? 'Autenticando...' : 'Ingresar al Templo'}
          </button>
        </form>
      </div>
    </div>
  )
}
