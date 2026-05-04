'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function NuevoIngresoHospitalario() {
  const router = useRouter()
  
  const [tipoSaco, setTipoSaco] = useState('regular') // 'regular' o 'especial'
  const [tenidas, setTenidas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState(null)

  const [form, setForm] = useState({
    monto: '',
    fecha: new Date().toISOString().split('T'),
    tenida_id: '',
    notas: ''
  })

  // Cargamos las últimas tenidas para el dropdown
  useEffect(() => {
    async function cargarTenidas() {
      const { data, error } = await supabase
        .from('tenidas')
        .select('id, fecha, tipo, grado, acta_nro')
        .order('fecha', { ascending: false })
        .limit(15) // Traemos solo las últimas 15 para no saturar

      if (!error && data) {
        setTenidas(data)
        // Si hay tenidas, preseleccionamos la primera por comodidad
        if (data.length > 0) {
          setForm(prev => ({ ...prev, tenida_id: data.id }))
        }
      }
      setCargando(false)
    }

    cargarTenidas()
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setGuardando(true)

    // Validaciones básicas
    if (!form.monto || parseFloat(form.monto) <= 0) {
      setError('El monto debe ser mayor a cero.')
      setGuardando(false)
      return
    }

    if (tipoSaco === 'especial' && !form.notas.trim()) {
      setError('Para los Sacos Especiales es obligatorio detallar el motivo en las notas.')
      setGuardando(false)
      return
    }

    // Preparamos el objeto para Supabase
    const datosIngreso = {
      monto: parseFloat(form.monto),
      fecha: form.fecha,
      // Si es regular, mandamos el ID. Si es especial, mandamos NULL.
      tenida_id: tipoSaco === 'regular' ? form.tenida_id : null,
      notas: form.notas.trim() || null
    }

    const { error: errInsert } = await supabase
      .from('saco_beneficencia_ingresos')
      .insert([datosIngreso])

    if (errInsert) {
      console.error(errInsert)
      setError('Ocurrió un error al guardar el ingreso. Revisá tu conexión.')
      setGuardando(false)
      return
    }

    // Si todo salió bien, volvemos al dashboard
    router.push('/panel/hospitalario')
    router.refresh()
  }

  const formatFecha = (fechaStr) => {
    return new Date(fechaStr + 'T00:00:00').toLocaleDateString('es-AR', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    })
  }

  return (
    <div style={{ maxWidth: '600px' }}>
      
      <div style={{ marginBottom: '1.5rem' }}>
        <Link href="/panel/hospitalario" style={{ fontSize: '12px', color: '#666', textDecoration: 'none', marginBottom: '8px', display: 'inline-block' }}>
          ← Volver al Saco
        </Link>
        <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#1a1a2e', margin: '0 0 4px' }}>
          Registrar Ingreso
        </h1>
        <p style={{ fontSize: '13px', color: '#888', margin: 0 }}>
          Asentá la recaudación de una Tenida o una colecta especial.
        </p>
      </div>

      <div style={{ backgroundColor: '#ffffff', border: '1px solid #e8e6e0', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
        
        {error && (
          <div style={{ backgroundColor: '#FCEBEB', color: '#791F1F', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '13px', marginBottom: '1.5rem' }}>
            {error}
          </div>
        )}

        {/* SELECTOR DE TIPO DE SACO */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '1.5rem', backgroundColor: '#fafaf8', padding: '6px', borderRadius: '8px', border: '1px solid #e8e6e0' }}>
          <button
            type="button"
            onClick={() => setTipoSaco('regular')}
            style={{ flex: 1, padding: '8px', borderRadius: '6px', border: 'none', fontSize: '13px', fontWeight: '500', cursor: 'pointer', transition: 'all 0.2s', backgroundColor: tipoSaco === 'regular' ? '#1a1a2e' : 'transparent', color: tipoSaco === 'regular' ? '#ffffff' : '#666' }}
          >
            Saco Regular (Tenida)
          </button>
          <button
            type="button"
            onClick={() => setTipoSaco('especial')}
            style={{ flex: 1, padding: '8px', borderRadius: '6px', border: 'none', fontSize: '13px', fontWeight: '500', cursor: 'pointer', transition: 'all 0.2s', backgroundColor: tipoSaco === 'especial' ? '#1a1a2e' : 'transparent', color: tipoSaco === 'especial' ? '#ffffff' : '#666' }}
          >
            Saco Especial / Donación
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={estiloLabel}>Monto recaudado *</label>
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
              <label style={estiloLabel}>Fecha de recaudación *</label>
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

          {/* CAMPO DINÁMICO: Solo se muestra si es Saco Regular */}
          {tipoSaco === 'regular' && (
            <div style={{ marginBottom: '1rem' }}>
              <label style={estiloLabel}>Vincular a Tenida *</label>
              {cargando ? (
                <p style={{ fontSize: '13px', color: '#888' }}>Cargando tenidas...</p>
              ) : tenidas.length === 0 ? (
                <p style={{ fontSize: '13px', color: '#A32D2D' }}>No hay Tenidas registradas en el sistema.</p>
              ) : (
                <select
                  name="tenida_id"
                  required={tipoSaco === 'regular'}
                  value={form.tenida_id}
                  onChange={handleChange}
                  style={estiloInput}
                >
                  {tenidas.map(t => (
                    <option key={t.id} value={t.id}>
                      {formatFecha(t.fecha)} — Tenida {t.tipo} {t.acta_nro ? `(Acta Nº ${t.acta_nro})` : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={estiloLabel}>
              Notas aclaratorias {tipoSaco === 'especial' && <span style={{ color: '#A32D2D' }}>* (Obligatorio)</span>}
            </label>
            <input
              name="notas"
              type="text"
              value={form.notas}
              onChange={handleChange}
              placeholder={tipoSaco === 'especial' ? 'Ej: Colecta por nacimiento del hijo del H.·. Pérez' : 'Opcional. Ej: Incluye donación anónima.'}
              style={estiloInput}
              required={tipoSaco === 'especial'}
            />
          </div>

          <button
            type="submit"
            disabled={guardando || cargando}
            style={{
              width: '100%',
              backgroundColor: '#3B6D11', // Verde hospitalario
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
            {guardando ? 'Guardando ingreso...' : 'Confirmar Ingreso al Saco'}
          </button>

        </form>
      </div>

    </div>
  )
}

// ESTILOS
const estiloLabel = { display: 'block', fontSize: '11px', color: '#888', marginBottom: '6px', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.05em' }
const estiloInput = { width: '100%', padding: '10px 12px', fontSize: '14px', border: '1px solid #c8c5b8', borderRadius: '8px', backgroundColor: '#fafaf8', color: '#1a1a2e', outline: 'none', boxSizing: 'border-box' }