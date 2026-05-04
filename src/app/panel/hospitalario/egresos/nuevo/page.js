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
    fecha: new Date().toISOString().split('T'),
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
          setForm(prev => ({ ...prev, hermano_id: data.id }))
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
    <div style={{ maxWidth: '600px' }}>
      
      <div style={{ marginBottom: '1.5rem' }}>
        <Link href="/panel/hospitalario" style={{ fontSize: '12px', color: '#666', textDecoration: 'none', marginBottom: '8px', display: 'inline-block' }}>
          ← Volver al Saco
        </Link>
        <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#1a1a2e', margin: '0 0 4px' }}>
          Registrar Ayuda (Egreso)
        </h1>
        <p style={{ fontSize: '13px', color: '#888', margin: 0 }}>
          Asentá la entrega de fondos solidarios a un Hermano o institución.
        </p>
      </div>

      <div style={{ backgroundColor: '#ffffff', border: '1px solid #e8e6e0', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
        
        {error && (
          <div style={{ backgroundColor: '#FCEBEB', color: '#791F1F', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '13px', marginBottom: '1.5rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={estiloLabel}>Monto a entregar *</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#888', fontSize: '14px' }}>$</span>
                <input
                  name="monto"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={form.monto}
                  onChange={handleChange}
                  placeholder="0.00"
                  style={{ ...estiloInput, paddingLeft: '28px' }}
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

          <div style={{ marginBottom: '1rem' }}>
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
            <div style={{ marginBottom: '1rem' }}>
              <label style={estiloLabel}>Hermano Destinatario *</label>
              {cargando ? (
                <p style={{ fontSize: '13px', color: '#888' }}>Cargando Cuadro Lógico...</p>
              ) : hermanos.length === 0 ? (
                <p style={{ fontSize: '13px', color: '#A32D2D' }}>No hay Hermanos registrados.</p>
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
            <div style={{ marginBottom: '1rem' }}>
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

          <div style={{ marginBottom: '1.5rem' }}>
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
              backgroundColor: '#A32D2D', // Rojo oscuro para egresos
              color: '#ffffff',
              border: 'none',
              padding: '12px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: (guardando || cargando) ? 'not-allowed' : 'pointer',
              opacity: (guardando || cargando) ? 0.7 : 1,
              transition: 'opacity 0.2s'
            }}
          >
            {guardando ? 'Registrando salida...' : 'Confirmar Entrega de Ayuda'}
          </button>

        </form>
      </div>

    </div>
  )
}

// ESTILOS
const estiloLabel = { display: 'block', fontSize: '11px', color: '#888', marginBottom: '6px', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.05em' }
const estiloInput = { width: '100%', padding: '10px 12px', fontSize: '14px', border: '1px solid #c8c5b8', borderRadius: '8px', backgroundColor: '#fafaf8', color: '#1a1a2e', outline: 'none', boxSizing: 'border-box' }