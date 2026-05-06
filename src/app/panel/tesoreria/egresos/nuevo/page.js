'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

const CATEGORIAS = ['SFU', 'Gran Logia', 'Gastos varios']

export default function NuevoEgresoPage() {
  const router = useRouter()
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState(null)

  const [form, setForm] = useState({
    categoria: 'SFU',
    monto: '',
    fecha: new Date().toISOString().split('T')[0],
    descripcion: '',
    registrado_por: '',
  })

  function handleChange(e) {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setCargando(true)
    setError(null)

    if (!form.descripcion.trim()) {
      setError('La descripción es obligatoria.')
      setCargando(false)
      return
    }
    if (!form.monto || parseFloat(form.monto) <= 0) {
      setError('El monto debe ser mayor a cero.')
      setCargando(false)
      return
    }
    if (!form.registrado_por.trim()) {
      setError('Indicá quién está registrando este egreso.')
      setCargando(false)
      return
    }

    const datos = {
      categoria: form.categoria,
      monto: parseFloat(form.monto),
      fecha: form.fecha,
      descripcion: form.descripcion.trim(),
      registrado_por: form.registrado_por.trim(),
    }

    const { error: err } = await supabase.from('egresos').insert(datos)

    if (err) {
      setError('Ocurrió un error al guardar. Intentá de nuevo.')
      console.error(err)
      setCargando(false)
      return
    }

    router.push('/panel/tesoreria/egresos')
    router.refresh()
  }

  return (
    <div style={{ maxWidth: '600px', fontFamily: 'var(--font-montserrat)' }}>

      <div style={{ marginBottom: '2rem' }}>
        <Link 
          href="/panel/tesoreria/egresos" 
          style={{ fontSize: '13px', color: 'var(--color-gris)', fontWeight: '500', textDecoration: 'none', marginBottom: '12px', display: 'inline-block', transition: 'color 0.2s' }}
          onMouseOver={e => e.currentTarget.style.color = 'var(--color-institucional)'}
          onMouseOut={e => e.currentTarget.style.color = 'var(--color-gris)'}
        >
           ← Volver a Egresos
        </Link>
        <h1 style={{ fontSize: '28px', fontWeight: '600', color: 'var(--color-institucional)', marginBottom: '6px', fontFamily: 'var(--font-baskerville)' }}>
          Registrar Egreso
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--color-gris)', margin: 0 }}>
          Asentá un gasto del Taller. Quedará guardado en el historial de salidas.
        </p>
      </div>

      {error && (
        <div style={{
          backgroundColor: '#FCEBEB',
          color: '#B33A3A',
          padding: '1rem',
          borderRadius: '8px',
          fontSize: '13px',
          marginBottom: '1.5rem',
          border: '1px solid #F8D7D7',
          fontWeight: '500'
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>

        <div style={estiloSeccion}>
          <p style={estiloTituloSeccion}>Detalle del egreso</p>

          {/* Categoría */}
          <div style={{ marginBottom: '20px' }}>
            <label style={estiloLabel}>Categoría</label>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {CATEGORIAS.map(cat => {
                const isActive = form.categoria === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, categoria: cat }))}
                    style={{
                      padding: '8px 18px',
                      borderRadius: '20px',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      border: '1px solid',
                      transition: 'all 0.2s',
                      ...(isActive
                        ? { backgroundColor: 'var(--color-institucional)', borderColor: 'var(--color-oro)', color: 'var(--color-oro)', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }
                        : { backgroundColor: '#fafaf8', borderColor: '#d1d0c8', color: 'var(--color-gris)' }
                      )
                    }}
                    onMouseOver={e => !isActive && (e.currentTarget.style.backgroundColor = '#f0efe9')}
                    onMouseOut={e => !isActive && (e.currentTarget.style.backgroundColor = '#fafaf8')}
                  >
                    {cat}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Descripción */}
          <div style={{ marginBottom: '16px' }}>
            <label style={estiloLabel}>Descripción *</label>
            <input
              name="descripcion"
              value={form.descripcion}
              onChange={handleChange}
              placeholder="Ej: Cápita mensual al templo — marzo 2026"
              style={estiloInput}
            />
          </div>

          {/* Monto y fecha en fila */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={estiloLabel}>Monto *</label>
              <input
                name="monto"
                type="number"
                min="0"
                step="1"
                value={form.monto}
                onChange={handleChange}
                placeholder="Ej: 18000"
                style={estiloInput}
              />
            </div>
            <div>
              <label style={estiloLabel}>Fecha *</label>
              <input
                name="fecha"
                type="date"
                value={form.fecha}
                onChange={handleChange}
                style={estiloInput}
              />
            </div>
          </div>

          {/* Registrado por */}
          <div>
            <label style={estiloLabel}>Registrado por *</label>
            <input
              name="registrado_por"
              value={form.registrado_por}
              onChange={handleChange}
              placeholder="Nombre del tesorero"
              style={estiloInput}
            />
          </div>

        </div>

        {/* Vista previa del monto */}
        {form.monto && parseFloat(form.monto) > 0 && (
          <div style={{
            backgroundColor: '#FCEBEB',
            borderRadius: '8px',
            padding: '1rem 1.25rem',
            marginBottom: '1.5rem',
            border: '1px solid #F8D7D7',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ fontSize: '13px', color: '#B33A3A', fontWeight: '600' }}>Total a registrar como egreso</span>
            <span style={{ fontSize: '20px', fontWeight: '700', color: '#B33A3A', fontFamily: 'var(--font-montserrat)' }}>
              -{new Intl.NumberFormat('es-AR', {
                style: 'currency',
                currency: 'ARS',
                maximumFractionDigits: 0
              }).format(parseFloat(form.monto))}
            </span>
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px', marginTop: '1rem' }}>
          <button
            type="submit"
            disabled={cargando}
            style={{
              ...estiloBotonPrimario,
              opacity: cargando ? 0.7 : 1,
              cursor: cargando ? 'not-allowed' : 'pointer'
            }}
            onMouseOver={e => !cargando && (e.currentTarget.style.backgroundColor = '#111122')}
            onMouseOut={e => !cargando && (e.currentTarget.style.backgroundColor = 'var(--color-institucional)')}
          >
            {cargando ? 'Guardando...' : 'Confirmar egreso'}
          </button>
          <Link 
            href="/panel/tesoreria/egresos" 
            style={estiloBotonSecundario}
            onMouseOver={e => e.currentTarget.style.backgroundColor = '#f0efe9'}
            onMouseOut={e => e.currentTarget.style.backgroundColor = '#fafaf8'}
          >
            Cancelar
          </Link>
        </div>

      </form>
    </div>
  )
}

// ─── Estilos ──────────────────────────────────────────────────

const estiloSeccion = {
  backgroundColor: '#ffffff',
  border: '1px solid rgba(207, 181, 59, 0.2)',
  borderRadius: '12px',
  padding: '1.5rem',
  marginBottom: '1.5rem',
  boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
}

const estiloTituloSeccion = {
  fontSize: '12px',
  fontWeight: '700',
  color: 'var(--color-institucional)',
  marginBottom: '1.25rem',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  borderBottom: '1px solid rgba(207, 181, 59, 0.15)',
  paddingBottom: '10px'
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

const estiloBotonPrimario = {
  fontSize: '14px',
  fontWeight: '600',
  padding: '12px 24px',
  borderRadius: '8px',
  border: '1px solid var(--color-oro)',
  backgroundColor: 'var(--color-institucional)',
  color: 'var(--color-oro)',
  textDecoration: 'none',
  transition: 'all 0.2s',
  boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
}

const estiloBotonSecundario = {
  fontSize: '14px',
  fontWeight: '600',
  padding: '12px 24px',
  borderRadius: '8px',
  border: '1px solid #d1d0c8',
  backgroundColor: '#fafaf8',
  color: 'var(--color-gris)',
  textDecoration: 'none',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'background-color 0.2s'
}