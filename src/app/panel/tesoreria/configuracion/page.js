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
    vigencia_desde: new Date().toISOString().split('T')[0],
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
           return { ...f, tipo_cuota_id: tiposConCuota[0].id }
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
    
    // Recargamos los datos para que la tabla superior se actualice al instante
    const { data: tipos } = await supabase.from('tipos_cuota').select('*').eq('activo', true).order('nombre')
    if (tipos) {
      const tiposConCuota = await Promise.all(tipos.map(async (tipo) => {
        const { data: cuota } = await supabase.from('cuotas').select('importe, vigencia_desde, notas').eq('tipo_cuota_id', tipo.id).order('vigencia_desde', { ascending: false }).limit(1).single()
        return { ...tipo, cuotaActual: cuota }
      }))
      setTiposCuota(tiposConCuota)
    }

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
    <div style={{ maxWidth: '850px', fontFamily: 'var(--font-montserrat)' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '600', color: 'var(--color-institucional)', marginBottom: '6px', fontFamily: 'var(--font-baskerville)' }}>
          Configuración Financiera
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--color-gris)', margin: 0 }}>
          Administración de valores vigentes para cuotas y cápitas del Taller.
        </p>
      </div>

      {/* Valores Actuales */}
      <div style={estiloSeccion}>
        <p style={estiloTituloSeccion}>Valores programados o vigentes</p>
        
        {cargando ? (
          <p style={{ fontSize: '14px', color: 'var(--color-gris)', padding: '1rem 0' }}>Cargando datos...</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
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
                  <tr 
                    key={tipo.id} 
                    style={{ backgroundColor: i % 2 === 0 ? '#ffffff' : '#fafaf8', transition: 'background-color 0.2s' }}
                    onMouseOver={e => e.currentTarget.style.backgroundColor = '#f4f3ed'}
                    onMouseOut={e => e.currentTarget.style.backgroundColor = i % 2 === 0 ? '#ffffff' : '#fafaf8'}
                  >
                    <td style={estiloTd}>
                      <span style={{ fontWeight: '600', color: 'var(--color-institucional)', fontSize: '14px' }}>{tipo.nombre}</span><br/>
                      <span style={{ fontSize: '12px', color: 'var(--color-gris)' }}>{tipo.descripcion}</span>
                    </td>
                    <td style={{ ...estiloTd, color: '#4A8516', fontWeight: '700', fontSize: '14px' }}>
                      {tipo.cuotaActual ? formatPesos(tipo.cuotaActual.importe) : '—'}
                    </td>
                    <td style={estiloTd}>
                      {tipo.cuotaActual ? formatFecha(tipo.cuotaActual.vigencia_desde) : '—'}
                    </td>
                    <td style={{ ...estiloTd, color: 'var(--color-gris)' }}>
                      {tipo.cuotaActual?.notas || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Formulario de Actualización */}
      <div style={{ ...estiloSeccion, maxWidth: '550px' }}>
        <p style={estiloTituloSeccion}>Programar nuevo valor</p>
        <p style={{ fontSize: '13px', color: 'var(--color-gris)', marginBottom: '1.5rem', lineHeight: '1.6' }}>
          Al registrar un nuevo importe, el historial anterior se mantendrá intacto. El sistema de devengamiento utilizará el nuevo valor automáticamente a partir de la fecha seleccionada.
        </p>

        {error && (
          <div style={{ backgroundColor: '#FCEBEB', color: '#B33A3A', padding: '1rem', borderRadius: '8px', fontSize: '13px', marginBottom: '1.5rem', border: '1px solid #F8D7D7', fontWeight: '500' }}>
            {error}
          </div>
        )}
        
        {exito && (
          <div style={{ backgroundColor: '#EAF3DE', color: '#4A8516', padding: '1rem', borderRadius: '8px', fontSize: '13px', marginBottom: '1.5rem', border: '1px solid #D4EAB6', fontWeight: '500' }}>
            {exito}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
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

          <div style={{ marginBottom: '24px' }}>
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
              fontSize: '14px', 
              fontWeight: '600',
              padding: '12px 24px', 
              borderRadius: '8px', 
              border: '1px solid var(--color-oro)',
              backgroundColor: 'var(--color-institucional)', 
              color: 'var(--color-oro)', 
              cursor: (guardando || cargando) ? 'not-allowed' : 'pointer',
              opacity: (guardando || cargando) ? 0.7 : 1, 
              width: '100%',
              transition: 'all 0.2s',
              boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
            }}
            onMouseOver={e => !(guardando || cargando) && (e.currentTarget.style.backgroundColor = '#111122')}
            onMouseOut={e => !(guardando || cargando) && (e.currentTarget.style.backgroundColor = 'var(--color-institucional)')}
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
  border: '1px solid rgba(207, 181, 59, 0.2)',
  borderRadius: '12px',
  padding: '1.5rem',
  marginBottom: '2rem',
  boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
}

const estiloTituloSeccion = {
  fontSize: '13px',
  fontWeight: '700',
  color: 'var(--color-institucional)',
  marginBottom: '1.25rem',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  borderBottom: '1px solid rgba(207, 181, 59, 0.15)',
  paddingBottom: '10px'
}

const estiloTh = {
  textAlign: 'left',
  padding: '12px 14px',
  fontWeight: '600',
  color: 'var(--color-gris)',
  borderBottom: '1px solid rgba(207, 181, 59, 0.15)',
  fontSize: '11px',
  textTransform: 'uppercase',
  letterSpacing: '0.05em'
}

const estiloTd = {
  padding: '14px',
  borderBottom: '1px solid #f0efe9',
  color: 'var(--color-gris)',
  verticalAlign: 'middle',
  fontSize: '13px'
}

const estiloLabel = {
  display: 'block',
  fontSize: '12px',
  fontWeight: '600',
  color: 'var(--color-institucional)',
  marginBottom: '8px',
  fontFamily: 'var(--font-montserrat)'
}

const estiloInput = {
  width: '100%',
  padding: '12px 14px',
  fontSize: '13px',
  border: '1px solid #d1d0c8',
  borderRadius: '8px',
  backgroundColor: '#fff',
  color: 'var(--color-institucional)',
  boxSizing: 'border-box',
  outline: 'none',
  transition: 'border-color 0.2s',
  fontFamily: 'var(--font-montserrat)'
}