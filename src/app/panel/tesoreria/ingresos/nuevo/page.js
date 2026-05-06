'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

const CATEGORIAS = ['Intereses', 'Donación', 'Otros']

export default function NuevoIngresoPage() {
  const router = useRouter()
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState(null)

  const [form, setForm] = useState({
    categoria: 'Intereses',
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
      setError('Indicá quién está registrando este ingreso.')
      setCargando(false)
      return
    }

    const { error: err } = await supabase.from('ingresos_varios').insert({
      categoria: form.categoria,
      monto: parseFloat(form.monto),
      fecha: form.fecha,
      descripcion: form.descripcion.trim(),
      registrado_por: form.registrado_por.trim(),
    })

    if (err) {
      setError('Ocurrió un error al guardar. Intentá de nuevo.')
      console.error(err)
      setCargando(false)
      return
    }

    router.push('/panel/tesoreria/ingresos') // Corregido: agregado el slash inicial
    router.refresh()
  }

  return (
    <div style={{ maxWidth: '600px', fontFamily: 'var(--font-montserrat)' }}>

      <div style={{ marginBottom: '2rem' }}>
        <Link 
          href="/panel/tesoreria/ingresos" 
          style={{ fontSize: '13px', color: 'var(--color-gris)', fontWeight: '500', textDecoration: 'none', marginBottom: '12px', display: 'inline-block', transition: 'color 0.2s' }}
          onMouseOver={e => e.currentTarget.style.color = 'var(--color-institucional)'}
          onMouseOut={e => e.currentTarget.style.color = 'var(--color-gris)'}
        >
          ← Volver a Ingresos
        </Link>
        <h1 style={{ fontSize: '28px', fontWeight: '600', color: 'var(--color-institucional)', marginBottom: '6px', fontFamily: 'var(--font-baskerville)' }}>
          Registrar Ingreso
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--color-gris)', margin: 0 }}>
          Asentá un ingreso que no corresponde a cuotas (intereses, donaciones, etc.).
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
          <p style={estiloTituloSeccion}>Detalle del ingreso</p>

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
              placeholder="Ej: Intereses plazo fijo marzo 2026"
              style={estiloInput}
            />
          </div>

          {/* Monto y fecha */}
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
                placeholder="Ej: 5000"
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

        {/* Vista previa */}
        {form.monto && parseFloat(form.monto) > 0 && (
          <div style={{ 
            backgroundColor: '#EAF3DE', 
            borderRadius: '8px', 
            padding: '1rem 1.25rem', 
            marginBottom: '1.5rem', 
            border: '1px solid #D4EAB6',
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center' 
          }}>
            <span style={{ fontSize: '13px', color: '#4A8516', fontWeight: '600' }}>Total a registrar como ingreso</span>
            <span style={{ fontSize: '20px', fontWeight: '700', color: '#4A8516', fontFamily: 'var(--font-montserrat)' }}>
              +{new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(parseFloat(form.monto))}
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
            {cargando ? 'Guardando...' : 'Confirmar ingreso'}
          </button>
          <Link 
            href="/panel/tesoreria/ingresos" // Corregido: antes apuntaba a egresos
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