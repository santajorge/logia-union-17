'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function NuevoPagoPage() {
  const params = useParams()
  const { id } = params
  const router = useRouter()

  const [hermano, setHermano] = useState(null)
  const [cuotaVigente, setCuotaVigente] = useState(0)
  const [cargandoInicial, setCargandoInicial] = useState(true)

  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState(null)
  const [exito, setExito] = useState(false)

  const [form, setForm] = useState({
    monto: '',
    fecha: new Date().toISOString().split('T'),
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

  if (cargandoInicial) return <p style={{ fontSize: '13px', color: '#888', padding: '2rem' }}>Iniciando Tesorería...</p>

  return (
    <div style={{ maxWidth: '600px' }}>
      
      {/* Botón de regreso con navegación controlada */}
      <div style={{ marginBottom: '1.5rem' }}>
        <button 
          onClick={volverAlDetalle}
          style={{ 
            background: 'none', 
            border: 'none', 
            color: '#666', 
            fontSize: '12px', 
            cursor: 'pointer', 
            padding: 0,
            marginBottom: '8px',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          ← Volver al legajo de {hermano?.nombre}
        </button>
        <h1 style={{ fontSize: '22px', fontWeight: '500', color: '#1a1a2e', marginBottom: '4px' }}>
          Registrar Pago
        </h1>
        <p style={{ fontSize: '13px', color: '#888' }}>
          Asentando recibo para <strong style={{ color: '#1a1a2e' }}>{hermano?.nombre} {hermano?.apellido}</strong>.
        </p>
      </div>

      <div style={{ backgroundColor: '#ffffff', border: '0.5px solid #e8e6e0', borderRadius: '12px', padding: '1.5rem' }}>
        <form onSubmit={handleSubmit}>

          {error && (
            <div style={{ backgroundColor: '#3a1c1c', color: '#e88e8e', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '13px', marginBottom: '1rem', border: '1px solid #e88e8e' }}>
              {error}
            </div>
          )}

          {exito && (
            <div style={{ backgroundColor: '#EAF3DE', color: '#27500A', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '13px', marginBottom: '1rem' }}>
              Pago registrado correctamente.
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={estiloLabel}>Monto *</label>
              <input name="monto" type="number" value={form.monto} onChange={handleChange} style={estiloInput} />
              {cuotaVigente > 0 && <p style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>Sugerido: {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(cuotaVigente)}</p>}
            </div>
            <div>
              <label style={estiloLabel}>Fecha *</label>
              <input name="fecha" type="date" value={form.fecha} onChange={handleChange} style={estiloInput} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
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
            style={{ fontSize: '13px', padding: '12px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#3B6D11', color: '#ffffff', cursor: cargando ? 'not-allowed' : 'pointer', opacity: cargando ? 0.6 : 1, width: '100%', fontWeight: '600', marginTop: '1rem' }}
          >
            {cargando ? 'Procesando...' : 'Confirmar ingreso al Tesoro'}
          </button>
        </form>
      </div>
    </div>
  )
}

const estiloLabel = { display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }
const estiloInput = { width: '100%', padding: '10px 12px', fontSize: '14px', border: '1px solid #c8c5b8', borderRadius: '8px', backgroundColor: '#fafaf8', color: '#1a1a2e', boxSizing: 'border-box', outline: 'none' }