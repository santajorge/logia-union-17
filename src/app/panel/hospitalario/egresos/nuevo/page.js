'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function NuevoEgresoHospitalario() {
  const router = useRouter()
  
  const [hermanos, setHermanos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState(null)

  const [form, setForm] = useState({
    monto: '',
    fecha: new Date().toISOString().split('T'), // Corregido: agregado para sacar solo la fecha
    tipo_destino: 'hermano', // 'hermano', 'subsidio_nacimiento', 'institucion'
    hermano_id: '',
    institucion: '',
    descripcion: ''
  })

  // Cargamos el Cuadro Lógico para el selector de Hermanos
  useEffect(() => {
    async function cargarHermanos() {
      const { data, error } = await supabase
        .from('hermanos')
        .select('id, nombre, apellido')
        .eq('activo', true)
        .order('apellido', { ascending: true })

      if (!error && data) {
        setHermanos(data)
        if (data.length > 0) {
          setForm(prev => ({ ...prev, hermano_id: data.id })) // Corregido: data.id
        }
      }
      setCargando(false)
    }

    cargarHermanos()
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setGuardando(true)

    // Validaciones
    if (!form.monto || parseFloat(form.monto) <= 0) {
      setError('El monto debe ser mayor a cero.')
      setGuardando(false)
      return
    }

    if (form.tipo_destino === 'institucion' && !form.institucion.trim()) {
      setError('Tenés que escribir el nombre de la institución destinataria.')
      setGuardando(false)
      return
    }

    if (!form.descripcion.trim()) {
      setError('Por favor, agregá una breve descripción del motivo de la ayuda.')
      setGuardando(false)
      return
    }

    // Preparamos el bloque de datos asegurándonos de limpiar lo que no se usa
    const datosEgreso = {
      monto: parseFloat(form.monto),
      fecha: form.fecha,
      tipo_destino: form.tipo_destino,
      descripcion: form.descripcion.trim(),
      hermano_id: (form.tipo_destino === 'hermano' || form.tipo_destino === 'subsidio_nacimiento') ? form.hermano_id : null,
      institucion: form.tipo_destino === 'institucion' ? form.institucion.trim() : null
    }

    const { error: errInsert } = await supabase
      .from('saco_beneficencia_egresos')
      .insert([datosEgreso])

    if (errInsert) {
      console.error(errInsert)
      setError('Ocurrió un error al registrar la ayuda. Revisá tu conexión.')
      setGuardando(false)
      return
    }

    // Volvemos al dashboard
    router.push('/panel/hospitalario')
    router.refresh()
  }

  return (
    <div style={{ maxWidth: '600px', fontFamily: 'var(--font-montserrat)' }}>
      
      <div style={{ marginBottom: '2rem' }}>
        <Link 
          href="/panel/hospitalario" 
          style={{ fontSize: '13px', color: 'var(--color-gris)', fontWeight: '500', textDecoration: 'none', marginBottom: '12px', display: 'inline-block', transition: 'color 0.2s' }}
          onMouseOver={e => e.currentTarget.style.color = 'var(--color-institucional)'}
          onMouseOut={e => e.currentTarget.style.color = 'var(--color-gris)'}
        >
          ← Volver al Saco
        </Link>
        <h1 style={{ fontSize: '28px', fontWeight: '600', color: 'var(--color-institucional)', marginBottom: '6px', fontFamily: 'var(--font-baskerville)' }}>
          Registrar Ayuda (Egreso)
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--color-gris)', margin: 0 }}>
          Asentá la entrega de fondos solidarios a un Hermano o Institución.
        </p>
      </div>

      <div style={{ backgroundColor: '#ffffff', border: '1px solid rgba(207, 181, 59, 0.2)', borderRadius: '12px', padding: '2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
        
        {error && (
          <div style={{ backgroundColor: '#FCEBEB', color: '#B33A3A', padding: '1rem', borderRadius: '8px', fontSize: '13px', marginBottom: '1.5rem', border: '1px solid #F8D7D7', fontWeight: '500' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={estiloLabel}>Monto a entregar *</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-institucional)', fontSize: '14px', fontWeight: '600' }}>$</span>
                <input
                  name="monto"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={form.monto}
                  onChange={handleChange}
                  placeholder="0.00"
                  style={{ ...estiloInput, paddingLeft: '32px' }}
                />
              </div>
            </div>

            <div>
              <label style={estiloLabel}>Fecha de entrega *</label>
              <input
                name="fecha"
                type="date"
                required
                value={form.fecha}
                onChange={handleChange}
                style={estiloInput}
              />
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={estiloLabel}>Tipo de Ayuda *</label>
            <select
              name="tipo_destino"
              value={form.tipo_destino}
              onChange={handleChange}
              style={estiloInput}
            >
              <option value="hermano">Asistencia a un Hermano</option>
              <option value="subsidio_nacimiento">Subsidio por Nacimiento (Sobrino)</option>
              <option value="institucion">Donación a Institución Profana</option>
            </select>
          </div>

          {/* RENDERIZADO CONDICIONAL: Selector de H:. o Input Profano */}
          {(form.tipo_destino === 'hermano' || form.tipo_destino === 'subsidio_nacimiento') ? (
            <div style={{ marginBottom: '16px' }}>
              <label style={estiloLabel}>Hermano Destinatario *</label>
              {cargando ? (
                <p style={{ fontSize: '13px', color: 'var(--color-gris)' }}>Cargando Cuadro Lógico...</p>
              ) : hermanos.length === 0 ? (
                <p style={{ fontSize: '13px', color: '#B33A3A' }}>No hay Hermanos registrados.</p>
              ) : (
                <select
                  name="hermano_id"
                  required
                  value={form.hermano_id}
                  onChange={handleChange}
                  style={estiloInput}
                >
                  {hermanos.map(h => (
                    <option key={h.id} value={h.id}>
                      {h.apellido}, {h.nombre}
                    </option>
                  ))}
                </select>
              )}
            </div>
          ) : (
            <div style={{ marginBottom: '16px' }}>
              <label style={estiloLabel}>Nombre de la Institución *</label>
              <input
                name="institucion"
                type="text"
                required
                value={form.institucion}
                onChange={handleChange}
                placeholder="Ej: Hospital de Niños V. J. Vilela"
                style={estiloInput}
              />
            </div>
          )}

          <div style={{ marginBottom: '24px' }}>
            <label style={estiloLabel}>Detalles / Descripción *</label>
            <input
              name="descripcion"
              type="text"
              required
              value={form.descripcion}
              onChange={handleChange}
              placeholder="Ej: Ayuda médica de urgencia / Nacimiento de su hijo Mateo"
              style={estiloInput}
            />
          </div>

          <button
            type="submit"
            disabled={guardando || cargando}
            style={{
              width: '100%',
              backgroundColor: '#B33A3A', 
              color: '#ffffff',
              border: 'none',
              padding: '14px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: (guardando || cargando) ? 'not-allowed' : 'pointer',
              opacity: (guardando || cargando) ? 0.7 : 1,
              transition: 'background-color 0.2s, opacity 0.2s',
              boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
            }}
            onMouseOver={e => !(guardando || cargando) && (e.currentTarget.style.backgroundColor = '#8c2c2c')}
            onMouseOut={e => !(guardando || cargando) && (e.currentTarget.style.backgroundColor = '#B33A3A')}
          >
            {guardando ? 'Registrando salida...' : 'Confirmar Entrega de Ayuda'}
          </button>

        </form>
      </div>

    </div>
  )
}

// ESTILOS
const estiloLabel = { display: 'block', fontSize: '12px', color: 'var(--color-institucional)', marginBottom: '8px', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.05em', fontFamily: 'var(--font-montserrat)' }
const estiloInput = { width: '100%', padding: '12px 14px', fontSize: '13px', border: '1px solid #d1d0c8', borderRadius: '8px', backgroundColor: '#fff', color: 'var(--color-institucional)', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s', fontFamily: 'var(--font-montserrat)' }