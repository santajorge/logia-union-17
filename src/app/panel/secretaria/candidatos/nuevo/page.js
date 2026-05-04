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
    <div style={{ maxWidth: '600px' }}>
      
      <div style={{ marginBottom: '1.5rem' }}>
        <Link href="/panel/secretaria/candidatos" style={{ fontSize: '12px', color: '#666', textDecoration: 'none', marginBottom: '8px', display: 'inline-block' }}>
          ← Volver al Tablero
        </Link>
        <h1 style={{ fontSize: '22px', fontWeight: '500', color: '#1a1a2e', marginBottom: '4px' }}>
          Ingresar Nuevo Profano
        </h1>
        <p style={{ fontSize: '13px', color: '#888' }}>
          Registrá los datos de contacto inicial. El candidato ingresará automáticamente a la primera columna del tablero.
        </p>
      </div>

      <div style={{ backgroundColor: '#ffffff', border: '0.5px solid #e8e6e0', borderRadius: '12px', padding: '1.5rem' }}>
        <form onSubmit={handleSubmit}>

          {error && (
            <div style={{ backgroundColor: '#3a1c1c', color: '#e88e8e', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '13px', marginBottom: '1rem', border: '1px solid #e88e8e' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={estiloLabel}>Nombre *</label>
              <input name="nombre" value={form.nombre} onChange={handleChange} placeholder="Ej: Juan" style={estiloInput} required />
            </div>
            <div>
              <label style={estiloLabel}>Apellido *</label>
              <input name="apellido" value={form.apellido} onChange={handleChange} placeholder="Ej: Pérez" style={estiloInput} required />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
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
            style={{ fontSize: '13px', padding: '12px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#1a1a2e', color: '#ffffff', cursor: cargando ? 'not-allowed' : 'pointer', opacity: cargando ? 0.7 : 1, width: '100%', fontWeight: '600', marginTop: '1rem' }}
          >
            {cargando ? 'Registrando...' : 'Guardar y enviar al Tablero'}
          </button>
        </form>
      </div>
    </div>
  )
}

const estiloLabel = { display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }
const estiloInput = { width: '100%', padding: '10px 12px', fontSize: '14px', border: '1px solid #c8c5b8', borderRadius: '8px', backgroundColor: '#fafaf8', color: '#1a1a2e', boxSizing: 'border-box', outline: 'none' }