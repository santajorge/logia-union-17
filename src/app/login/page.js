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
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: 'var(--color-institucional)', fontFamily: 'var(--font-montserrat)', padding: '1rem' }}>
      
      <div style={{ width: '100%', maxWidth: '380px', marginBottom: '1.5rem' }}>
        <Link 
          href="/" 
          style={{ fontSize: '13px', color: 'var(--color-oro)', textDecoration: 'none', fontWeight: '500', transition: 'opacity 0.2s' }}
          onMouseOver={e => e.currentTarget.style.opacity = '0.8'}
          onMouseOut={e => e.currentTarget.style.opacity = '1'}
        >
          ← Volver a la web pública
        </Link>
      </div>

      <div style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
        <Image
          src="/logo-union-17-blanco.png" // Asegurate de que este archivo exista en tu carpeta /public
          alt="Escudo Logia Unión N° 17"
          width={140}
          height={140}
          style={{ objectFit: 'contain', marginBottom: '1.5rem', display: 'block', margin: '0 auto' }}
        />
        <p style={{ fontSize: '11px', color: 'var(--color-oro)', letterSpacing: '0.25em', marginBottom: '6px', fontWeight: '600' }}>
          A L.·.G.·.D.·.G.·.A.·.D.·.U.·.
        </p>
        <p style={{ fontSize: '20px', color: '#ffffff', margin: 0, fontFamily: 'var(--font-baskerville)', letterSpacing: '0.02em' }}>
          Aug.·. y Resp.·. Logia Unión N° 17
        </p>
        <p style={{ fontSize: '12px', color: 'var(--color-oro)', margin: '6px 0 0', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Área Reservada
        </p>
      </div>

      <div style={{ backgroundColor: '#ffffff', padding: '2.5rem', borderRadius: '12px', width: '100%', maxWidth: '380px', border: '1px solid rgba(207, 181, 59, 0.5)', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {error && (
            <div style={{ backgroundColor: '#FCEBEB', color: '#B33A3A', padding: '1rem', borderRadius: '8px', fontSize: '13px', textAlign: 'center', border: '1px solid #F8D7D7', fontWeight: '500' }}>
              {error}
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--color-institucional)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Correo Electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid #d1d0c8', backgroundColor: '#fafaf8', color: 'var(--color-institucional)', fontSize: '14px', outline: 'none', boxSizing: 'border-box', fontFamily: 'var(--font-montserrat)', transition: 'border-color 0.2s' }}
              onFocus={e => e.target.style.borderColor = 'var(--color-oro)'}
              onBlur={e => e.target.style.borderColor = '#d1d0c8'}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--color-institucional)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Palabra de Pase
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid #d1d0c8', backgroundColor: '#fafaf8', color: 'var(--color-institucional)', fontSize: '14px', outline: 'none', boxSizing: 'border-box', fontFamily: 'var(--font-montserrat)', transition: 'border-color 0.2s' }}
              onFocus={e => e.target.style.borderColor = 'var(--color-oro)'}
              onBlur={e => e.target.style.borderColor = '#d1d0c8'}
              required
            />
          </div>

          <button
            type="submit"
            disabled={cargando}
            style={{ 
              marginTop: '0.5rem', 
              backgroundColor: 'var(--color-institucional)', 
              color: 'var(--color-oro)', 
              padding: '14px', 
              borderRadius: '8px', 
              border: '1px solid var(--color-oro)', 
              fontSize: '14px', 
              fontWeight: '600', 
              cursor: cargando ? 'not-allowed' : 'pointer', 
              transition: 'all 0.2s', 
              opacity: cargando ? 0.7 : 1,
              fontFamily: 'var(--font-montserrat)',
              boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
            }}
            onMouseOver={e => !cargando && (e.currentTarget.style.backgroundColor = '#111122')}
            onMouseOut={e => !cargando && (e.currentTarget.style.backgroundColor = 'var(--color-institucional)')}
          >
            {cargando ? 'Autenticando...' : 'Ingresar al Templo'}
          </button>
        </form>
      </div>
    </div>
  )
}
