'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function ConfiguracionPage() {
  const router = useRouter()
  const [tiposCuota, setTiposCuota] = useState([])
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState(null)
  const [exito, setExito] = useState(null)

  const [form, setForm] = useState({
    tipo_cuota_id: '',
    importe: '',
    vigencia_desde: new Date().toISOString().split('T'),
    notas: 'Actualización de cuota'
  })

useEffect(() => {
    // 1. Metemos la función adentro del useEffect
    async function cargarDatos() {
      setCargando(true)
      
      // Traemos los tipos de cuota activos
      const { data: tipos, error: errTipos } = await supabase
        .from('tipos_cuota')
        .select('*')
        .eq('activo', true)
        .order('nombre')

      if (errTipos) {
        console.error('Error al cargar tipos:', errTipos)
        setCargando(false)
        return
      }

      // Para cada tipo, buscamos su valor más reciente
      const tiposConCuota = await Promise.all(tipos.map(async (tipo) => {
        const { data: cuota } = await supabase
          .from('cuotas')
          .select('importe, vigencia_desde, notas')
          .eq('tipo_cuota_id', tipo.id)
          .order('vigencia_desde', { ascending: false })
          .limit(1)
          .single()
        
        return { ...tipo, cuotaActual: cuota }
      }))

      setTiposCuota(tiposConCuota)
      
      // Seteamos el valor por defecto del formulario
      setForm(f => {
        // Solo actualizamos si el form no tiene tipo_cuota_id y hay tipos disponibles
        if (!f.tipo_cuota_id && tiposConCuota.length > 0) {
           return { ...f, tipo_cuota_id: tiposConCuota.id }
        }
        return f
      })
      
      setCargando(false)
    }

    // 2. La llamamos
    cargarDatos()
  }, []) // El array vacío hace que se ejecute solo al montar el componente

  function handleChange(e) {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setExito(null)
    setGuardando(true)

    if (!form.importe || parseFloat(form.importe) <= 0) {
      setError('El importe debe ser mayor a cero.')
      setGuardando(false)
      return
    }

    // Insertamos el nuevo valor. Al tener una nueva vigencia_desde, 
    // el sistema de devengamiento automáticamente tomará este valor a partir de esa fecha.
    const { error: err } = await supabase.from('cuotas').insert({
      tipo_cuota_id: form.tipo_cuota_id,
      importe: parseFloat(form.importe),
      vigencia_desde: form.vigencia_desde,
      notas: form.notas.trim() || null
    })

    if (err) {
      setError('Ocurrió un error al guardar la nueva cuota.')
      console.error(err)
      setGuardando(false)
      return
    }

    setExito('El nuevo valor de la cuota se registró correctamente.')
    setForm(f => ({ ...f, importe: '', notas: 'Actualización de cuota' }))
    await cargarDatos() // Actualizamos la tabla
    setGuardando(false)
    router.refresh()
  }

  function formatPesos(monto) {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0
    }).format(monto)
  }

  function formatFecha(fecha) {
    if (!fecha) return '—'
    return new Date(fecha + 'T00:00:00').toLocaleDateString('es-AR', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    })
  }

  return (
    <div style={{ maxWidth: '800px' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '500', color: '#1a1a2e', marginBottom: '4px' }}>
          Configuración
        </h1>
        <p style={{ fontSize: '13px', color: '#888' }}>
          Administración de valores de cuotas y cápitas del taller.
        </p>
      </div>

      {/* Valores Actuales */}
      <div style={estiloSeccion}>
        <p style={estiloTituloSeccion}>Valores programados o vigentes</p>
        
        {cargando ? (
          <p style={{ fontSize: '13px', color: '#888', padding: '1rem 0' }}>Cargando datos...</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr>
                <th style={estiloTh}>Tipo de Cuota</th>
                <th style={estiloTh}>Importe</th>
                <th style={estiloTh}>Vigente desde</th>
                <th style={estiloTh}>Notas</th>
              </tr>
            </thead>
            <tbody>
              {tiposCuota.map((tipo, i) => (
                <tr key={tipo.id} style={{ backgroundColor: i % 2 === 0 ? 'transparent' : '#fafaf8' }}>
                  <td style={estiloTd}>
                    <span style={{ fontWeight: '500' }}>{tipo.nombre}</span><br/>
                    <span style={{ fontSize: '11px', color: '#888' }}>{tipo.descripcion}</span>
                  </td>
                  <td style={{ ...estiloTd, color: '#1a1a2e', fontWeight: '600' }}>
                    {tipo.cuotaActual ? formatPesos(tipo.cuotaActual.importe) : '—'}
                  </td>
                  <td style={estiloTd}>
                    {tipo.cuotaActual ? formatFecha(tipo.cuotaActual.vigencia_desde) : '—'}
                  </td>
                  <td style={{ ...estiloTd, color: '#888' }}>
                    {tipo.cuotaActual?.notas || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Formulario de Actualización */}
      <div style={{ ...estiloSeccion, maxWidth: '500px' }}>
        <p style={estiloTituloSeccion}>Programar nuevo valor</p>
        <p style={{ fontSize: '12px', color: '#666', marginBottom: '1.5rem', lineHeight: '1.5' }}>
          Al registrar un nuevo importe, no se borrará el historial anterior. El sistema de devengamiento comenzará a cobrar el nuevo valor automáticamente a partir de la fecha seleccionada.
        </p>

        {error && (
          <div style={{ backgroundColor: '#FCEBEB', color: '#791F1F', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '13px', marginBottom: '1rem' }}>
            {error}
          </div>
        )}
        
        {exito && (
          <div style={{ backgroundColor: '#EAF3DE', color: '#27500A', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '13px', marginBottom: '1rem' }}>
            {exito}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '12px' }}>
            <label style={estiloLabel}>Tipo de cuota *</label>
            <select
              name="tipo_cuota_id"
              value={form.tipo_cuota_id}
              onChange={handleChange}
              style={estiloInput}
              disabled={cargando}
            >
              {tiposCuota.map(t => (
                <option key={t.id} value={t.id}>{t.nombre}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={estiloLabel}>Nuevo importe *</label>
              <input
                name="importe"
                type="number"
                min="0"
                step="1"
                value={form.importe}
                onChange={handleChange}
                placeholder="Ej: 36000"
                style={estiloInput}
                disabled={cargando}
              />
            </div>
            <div>
              <label style={estiloLabel}>Vigente desde *</label>
              <input
                name="vigencia_desde"
                type="date"
                value={form.vigencia_desde}
                onChange={handleChange}
                style={estiloInput}
                disabled={cargando}
              />
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={estiloLabel}>Notas</label>
            <input
              name="notas"
              value={form.notas}
              onChange={handleChange}
              placeholder="Ej: Actualización cuota septiembre"
              style={estiloInput}
              disabled={cargando}
            />
          </div>

          <button
            type="submit"
            disabled={guardando || cargando}
            style={{
              fontSize: '13px', padding: '8px 20px', borderRadius: '8px', border: 'none',
              backgroundColor: '#1a1a2e', color: '#ffffff', cursor: (guardando || cargando) ? 'not-allowed' : 'pointer',
              opacity: (guardando || cargando) ? 0.6 : 1, width: '100%'
            }}
          >
            {guardando ? 'Guardando...' : 'Confirmar nuevo valor'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ─── Estilos ──────────────────────────────────────────────────

const estiloSeccion = {
  backgroundColor: '#ffffff',
  border: '0.5px solid #e8e6e0',
  borderRadius: '12px',
  padding: '1.25rem',
  marginBottom: '1.5rem'
}

const estiloTituloSeccion = {
  fontSize: '13px',
  fontWeight: '500',
  color: '#888',
  marginBottom: '1rem',
  textTransform: 'uppercase',
  letterSpacing: '0.05em'
}

const estiloTh = {
  textAlign: 'left',
  padding: '8px 10px',
  fontWeight: '500',
  color: '#888',
  borderBottom: '0.5px solid #e8e6e0',
  fontSize: '12px'
}

const estiloTd = {
  padding: '12px 10px',
  borderBottom: '0.5px solid #f0efe9',
  color: '#1a1a2e',
  verticalAlign: 'middle'
}

const estiloLabel = {
  display: 'block',
  fontSize: '12px',
  color: '#666',
  marginBottom: '4px'
}

const estiloInput = {
  width: '100%',
  padding: '8px 10px',
  fontSize: '13px',
  border: '0.5px solid #c8c5b8',
  borderRadius: '8px',
  backgroundColor: '#fafaf8',
  color: '#1a1a2e',
  boxSizing: 'border-box'
}