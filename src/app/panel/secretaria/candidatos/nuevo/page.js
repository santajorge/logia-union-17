'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function NuevoCandidatoPage() {
  const router = useRouter()
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: ''
  })

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setCargando(true)
    setError('')

    if (!form.nombre.trim() || !form.apellido.trim()) {
      setError('El nombre y el apellido son obligatorios.')
      setCargando(false)
      return
    }

    // Insertamos en la BD. 
    // Nota: No hace falta enviarle el 'estado', porque Supabase le pone 'contacto' por defecto gracias a nuestro SQL.
    const { error: err } = await supabase.from('candidatos').insert({
      nombre: form.nombre.trim(),
      apellido: form.apellido.trim(),
      email: form.email.trim() || null,
      telefono: form.telefono.trim() || null
    })

    if (err) {
      setError('Error al guardar el registro. Verificá la conexión.')
      console.error(err)
      setCargando(false)
      return
    }

    // Redirigimos de vuelta al Tablero Kanban
    router.push('/panel/secretaria/candidatos')
    router.refresh()
  }

  return (
    <div style={{ maxWidth: '600px', fontFamily: 'var(--font-montserrat)' }}>
      
      <div style={{ marginBottom: '2rem' }}>
        <Link 
          href="/panel/secretaria/candidatos" 
          style={{ fontSize: '13px', color: 'var(--color-gris)', fontWeight: '500', textDecoration: 'none', marginBottom: '12px', display: 'inline-block', transition: 'color 0.2s' }}
          onMouseOver={e => e.currentTarget.style.color = 'var(--color-institucional)'}
          onMouseOut={e => e.currentTarget.style.color = 'var(--color-gris)'}
        >
          ← Volver al Tablero
        </Link>
        <h1 style={{ fontSize: '28px', fontWeight: '600', color: 'var(--color-institucional)', marginBottom: '6px', fontFamily: 'var(--font-baskerville)' }}>
          Ingresar Nuevo Profano
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--color-gris)', margin: 0 }}>
          Registrá los datos de contacto inicial. El candidato ingresará automáticamente a la primera columna del tablero.
        </p>
      </div>

      <div style={{ backgroundColor: '#ffffff', border: '1px solid rgba(207, 181, 59, 0.2)', borderRadius: '12px', padding: '2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
        <form onSubmit={handleSubmit}>

          {error && (
            <div style={{ backgroundColor: '#FCEBEB', color: '#B33A3A', padding: '1rem', borderRadius: '8px', fontSize: '13px', marginBottom: '1.5rem', border: '1px solid #F8D7D7', fontWeight: '500' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={estiloLabel}>Nombre *</label>
              <input name="nombre" value={form.nombre} onChange={handleChange} placeholder="Ej: Juan" style={estiloInput} required />
            </div>
            <div>
              <label style={estiloLabel}>Apellido *</label>
              <input name="apellido" value={form.apellido} onChange={handleChange} placeholder="Ej: Pérez" style={estiloInput} required />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
            <div>
              <label style={estiloLabel}>Email</label>
              <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="correo@ejemplo.com" style={estiloInput} />
            </div>
            <div>
              <label style={estiloLabel}>Teléfono</label>
              <input name="telefono" value={form.telefono} onChange={handleChange} placeholder="Ej: 3415000000" style={estiloInput} />
            </div>
          </div>

          <button
            type="submit"
            disabled={cargando}
            style={{ 
              fontSize: '14px', 
              padding: '14px 20px', 
              borderRadius: '8px', 
              border: '1px solid var(--color-oro)', 
              backgroundColor: 'var(--color-institucional)', 
              color: 'var(--color-oro)', 
              cursor: cargando ? 'not-allowed' : 'pointer', 
              opacity: cargando ? 0.7 : 1, 
              width: '100%', 
              fontWeight: '600', 
              marginTop: '0.5rem',
              transition: 'all 0.2s',
              boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
            }}
            onMouseOver={e => !cargando && (e.currentTarget.style.backgroundColor = '#111122')}
            onMouseOut={e => !cargando && (e.currentTarget.style.backgroundColor = 'var(--color-institucional)')}
          >
            {cargando ? 'Registrando...' : 'Guardar y enviar al Tablero'}
          </button>
        </form>
      </div>
    </div>
  )
}

const estiloLabel = { display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--color-institucional)', marginBottom: '8px', fontFamily: 'var(--font-montserrat)' }
const estiloInput = { width: '100%', padding: '12px 14px', fontSize: '13px', border: '1px solid #d1d0c8', borderRadius: '8px', backgroundColor: '#fff', color: 'var(--color-institucional)', boxSizing: 'border-box', outline: 'none', transition: 'border-color 0.2s', fontFamily: 'var(--font-montserrat)' }