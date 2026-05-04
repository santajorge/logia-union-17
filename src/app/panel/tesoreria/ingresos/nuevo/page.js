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

    router.push('panel/tesoreria/ingresos')
    router.refresh()
  }

  const estilosCategoriaActiva = {
    'Intereses': { backgroundColor: '#EAF3DE', borderColor: '#3B6D11', color: '#27500A' },
    'Donación': { backgroundColor: '#E6F1FB', borderColor: '#185FA5', color: '#0C447C' },
    'Otros': { backgroundColor: '#F1EFE8', borderColor: '#5F5E5A', color: '#444441' },
  }

  return (
    <div style={{ maxWidth: '560px' }}>

      <div style={{ marginBottom: '1.5rem' }}>
        <Link href="/panel/tesoreria/ingresos" style={{ fontSize: '12px', color: '#666', textDecoration: 'none', marginBottom: '8px', display: 'inline-block' }}>
          ← Volver a Ingresos
        </Link>
      </div>

      <h1 style={{ fontSize: '22px', fontWeight: '500', color: '#1a1a2e', marginBottom: '0.25rem' }}>
        Registrar ingreso
      </h1>
      <p style={{ fontSize: '13px', color: '#888', marginBottom: '1.5rem' }}>
        Registrá un ingreso que no corresponde a cuotas — intereses, donaciones u otros.
      </p>

      {error && (
        <div style={{ backgroundColor: '#FCEBEB', color: '#791F1F', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '13px', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={estiloSeccion}>
          <p style={estiloTituloSeccion}>Detalle del ingreso</p>

          {/* Categoría */}
          <div style={{ marginBottom: '12px' }}>
            <label style={estiloLabel}>Categoría</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {CATEGORIAS.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, categoria: cat }))}
                  style={{
                    padding: '6px 16px',
                    borderRadius: '20px',
                    fontSize: '13px',
                    cursor: 'pointer',
                    border: '0.5px solid',
                    transition: 'all 0.15s',
                    ...(form.categoria === cat
                      ? estilosCategoriaActiva[cat]
                      : { backgroundColor: 'transparent', borderColor: '#c8c5b8', color: '#666' }
                    )
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Descripción */}
          <div style={{ marginBottom: '12px' }}>
            <label style={estiloLabel}>Descripción *</label>
            <input
              name="descripcion"
              value={form.descripcion}
              onChange={handleChange}
              placeholder="Ej: Intereses cuenta corriente marzo 2025"
              style={estiloInput}
            />
          </div>

          {/* Monto y fecha */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
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
          <div style={{ backgroundColor: '#EAF3DE', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: '#27500A' }}>Total a registrar como ingreso</span>
            <span style={{ fontSize: '18px', fontWeight: '500', color: '#27500A' }}>
              +{new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(parseFloat(form.monto))}
            </span>
          </div>
        )}

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="submit"
            disabled={cargando}
            style={{ fontSize: '13px', padding: '8px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#1a1a2e', color: '#ffffff', cursor: cargando ? 'not-allowed' : 'pointer', opacity: cargando ? 0.6 : 1 }}
          >
            {cargando ? 'Guardando...' : 'Guardar ingreso'}
          </button>
          <Link href="/panel/tesoreria/egresos" style={{ fontSize: '13px', padding: '8px 20px', borderRadius: '8px', border: '0.5px solid #c8c5b8', backgroundColor: 'transparent', color: '#1a1a2e', textDecoration: 'none', display: 'inline-block' }}>
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  )
}

const estiloSeccion = { backgroundColor: '#ffffff', border: '0.5px solid #e8e6e0', borderRadius: '12px', padding: '1.25rem', marginBottom: '1rem' }
const estiloTituloSeccion = { fontSize: '13px', fontWeight: '500', color: '#888', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }
const estiloLabel = { display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }
const estiloInput = { width: '100%', padding: '8px 10px', fontSize: '13px', border: '0.5px solid #c8c5b8', borderRadius: '8px', backgroundColor: '#fafaf8', color: '#1a1a2e', boxSizing: 'border-box' }