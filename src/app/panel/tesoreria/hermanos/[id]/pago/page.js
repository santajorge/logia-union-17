'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function NuevoPagoPage() {
  const params = useParams()
  const id = Array.isArray(params?.id) ? params.id : params?.id
  const router = useRouter()

  const [hermano, setHermano] = useState(null)
  const [cuotaVigente, setCuotaVigente] = useState(0)
  const [cargandoInicial, setCargandoInicial] = useState(true)

  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState(null)
  const [exito, setExito] = useState(false)

  const [form, setForm] = useState({
    monto: '',
    fecha: new Date().toISOString().split('T')[0],
    notas: '',
    registrado_por: '',
  })

  useEffect(() => {
    async function cargarDatos() {
      const { data: herm } = await supabase
        .from('hermanos')
        .select('nombre, apellido, tipo_cuota_id')
        .eq('id', id)
        .single()

      if (herm) {
        setHermano(herm)
        if (herm.tipo_cuota_id) {
          const { data: cuota } = await supabase
            .from('cuotas')
            .select('importe')
            .eq('tipo_cuota_id', herm.tipo_cuota_id)
            .order('vigencia_desde', { ascending: false })
            .limit(1)
            .single()

          if (cuota) {
            setCuotaVigente(cuota.importe)
            setForm(f => ({ ...f, monto: String(cuota.importe) }))
          }
        }
      }
      setCargandoInicial(false)
    }
    if (id) cargarDatos()
  }, [id])

  // Función de navegación manual para evitar el "hang" del Link
  const volverAlDetalle = (e) => {
    e.preventDefault()
    router.push(`/panel/tesoreria/hermanos/${id}`)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setCargando(true)
    setError(null)
    setExito(false)

    if (!form.monto || parseFloat(form.monto) <= 0) {
      setError('El monto debe ser mayor a cero.')
      setCargando(false)
      return
    }

    const { error: err } = await supabase.from('pagos').insert({
      hermano_id: id,
      monto: parseFloat(form.monto),
      fecha: form.fecha,
      notas: form.notas.trim() || null,
      registrado_por: form.registrado_por.trim(),
    })

    if (err) {
      setError('Error al guardar. Verificá la conexión.')
      setCargando(false)
      return
    }

    setExito(true)
    setForm(f => ({ ...f, monto: String(cuotaVigente || ''), notas: '' }))
    setCargando(false)
    
    // Pequeño delay para que el usuario vea el éxito antes de volver o refrescar
    setTimeout(() => {
      router.refresh()
    }, 1000)
  }

  if (cargandoInicial) return <p style={{ fontSize: '14px', color: 'var(--color-gris)', padding: '2rem', fontFamily: 'var(--font-montserrat)' }}>Iniciando Tesorería...</p>

  return (
    <div style={{ maxWidth: '600px', fontFamily: 'var(--font-montserrat)' }}>
      
      {/* Botón de regreso con navegación controlada */}
      <div style={{ marginBottom: '2rem' }}>
        <button 
          onClick={volverAlDetalle}
          style={{ 
            background: 'none', 
            border: 'none', 
            color: 'var(--color-gris)', 
            fontSize: '13px', 
            fontWeight: '500',
            cursor: 'pointer', 
            padding: 0,
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            transition: 'color 0.2s'
          }}
          onMouseOver={e => e.currentTarget.style.color = 'var(--color-institucional)'}
          onMouseOut={e => e.currentTarget.style.color = 'var(--color-gris)'}
        >
          ← Volver al legajo de {hermano?.nombre}
        </button>
        <h1 style={{ fontSize: '28px', fontWeight: '600', color: 'var(--color-institucional)', marginBottom: '6px', fontFamily: 'var(--font-baskerville)' }}>
          Registrar Pago
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--color-gris)', margin: 0 }}>
          Asentando recibo para <strong style={{ color: 'var(--color-institucional)', fontWeight: '600' }}>{hermano?.nombre} {hermano?.apellido}</strong>.
        </p>
      </div>

      <div style={{ backgroundColor: '#ffffff', border: '1px solid rgba(207, 181, 59, 0.2)', borderRadius: '12px', padding: '2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
        <form onSubmit={handleSubmit}>

          {error && (
            <div style={{ backgroundColor: '#FCEBEB', color: '#B33A3A', padding: '1rem', borderRadius: '8px', fontSize: '13px', marginBottom: '1.5rem', border: '1px solid #F8D7D7', fontWeight: '500' }}>
              {error}
            </div>
          )}

          {exito && (
            <div style={{ backgroundColor: '#EAF3DE', color: '#4A8516', padding: '1rem', borderRadius: '8px', fontSize: '13px', marginBottom: '1.5rem', border: '1px solid #D4EAB6', fontWeight: '500' }}>
              Pago registrado correctamente.
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={estiloLabel}>Monto *</label>
              <input name="monto" type="number" value={form.monto} onChange={handleChange} style={estiloInput} />
              {cuotaVigente > 0 && <p style={{ fontSize: '11px', color: 'var(--color-gris)', marginTop: '6px', fontWeight: '500' }}>Sugerido: {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(cuotaVigente)}</p>}
            </div>
            <div>
              <label style={estiloLabel}>Fecha *</label>
              <input name="fecha" type="date" value={form.fecha} onChange={handleChange} style={estiloInput} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
            <div>
              <label style={estiloLabel}>Registrado por *</label>
              <input name="registrado_por" value={form.registrado_por} onChange={handleChange} placeholder="Tesorero / Colaborador" style={estiloInput} />
            </div>
            <div>
              <label style={estiloLabel}>Notas</label>
              <input name="notas" value={form.notas} onChange={handleChange} placeholder="Ej: Pago adelantado" style={estiloInput} />
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
            {cargando ? 'Procesando...' : 'Confirmar ingreso al Tesoro'}
          </button>
        </form>
      </div>
    </div>
  )
}

const estiloLabel = { display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--color-institucional)', marginBottom: '8px', fontFamily: 'var(--font-montserrat)' }
const estiloInput = { width: '100%', padding: '12px 14px', fontSize: '14px', border: '1px solid #d1d0c8', borderRadius: '8px', backgroundColor: '#fff', color: 'var(--color-institucional)', boxSizing: 'border-box', outline: 'none', transition: 'border-color 0.2s', fontFamily: 'var(--font-montserrat)' }