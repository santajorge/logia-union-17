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
    <div style={{ maxWidth: '560px' }}>

      <div style={{ marginBottom: '1.5rem' }}>
        <Link href="/panel/tesoreria/egresos" style={{ fontSize: '12px', color: '#666', textDecoration: 'none', marginBottom: '8px', display: 'inline-block' }}>
           ← Volver a Egresos
        </Link>
      </div>

      <h1 style={{ fontSize: '22px', fontWeight: '500', color: '#1a1a2e', marginBottom: '0.25rem' }}>
        Registrar egreso
      </h1>
      <p style={{ fontSize: '13px', color: '#888', marginBottom: '1.5rem' }}>
        Registrá un gasto del taller. Quedará guardado en el historial de egresos.
      </p>

      {error && (
        <div style={{
          backgroundColor: '#FCEBEB',
          color: '#791F1F',
          padding: '0.75rem 1rem',
          borderRadius: '8px',
          fontSize: '13px',
          marginBottom: '1rem'
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>

        <div style={estiloSeccion}>
          <p style={estiloTituloSeccion}>Detalle del egreso</p>

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
              placeholder="Ej: Capita mensual al templo — marzo 2025"
              style={estiloInput}
            />
          </div>

          {/* Monto y fecha en fila */}
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
            padding: '0.75rem 1rem',
            marginBottom: '1rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ fontSize: '13px', color: '#791F1F' }}>Total a registrar como egreso</span>
            <span style={{ fontSize: '18px', fontWeight: '500', color: '#791F1F' }}>
              -{new Intl.NumberFormat('es-AR', {
                style: 'currency',
                currency: 'ARS',
                maximumFractionDigits: 0
              }).format(parseFloat(form.monto))}
            </span>
          </div>
        )}

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="submit"
            disabled={cargando}
            style={{
              ...estiloBotonPrimario,
              opacity: cargando ? 0.6 : 1,
              cursor: cargando ? 'not-allowed' : 'pointer'
            }}
          >
            {cargando ? 'Guardando...' : 'Guardar egreso'}
          </button>
          <Link href="/panel/tesoreria" style={estiloBoton}>
            Cancelar
          </Link>
        </div>

      </form>
    </div>
  )
}

// ─── Estilos ──────────────────────────────────────────────────

const estilosCategoriaActiva = {
  'SFU':          { backgroundColor: '#EEEDFE', borderColor: '#534AB7', color: '#3C3489' },
  'Gran Logia':   { backgroundColor: '#E1F5EE', borderColor: '#0F6E56', color: '#085041' },
  'Gastos varios':{ backgroundColor: '#F1EFE8', borderColor: '#5F5E5A', color: '#444441' },
}

const estiloSeccion = {
  backgroundColor: '#ffffff',
  border: '0.5px solid #e8e6e0',
  borderRadius: '12px',
  padding: '1.25rem',
  marginBottom: '1rem'
}

const estiloTituloSeccion = {
  fontSize: '13px',
  fontWeight: '500',
  color: '#888',
  marginBottom: '1rem',
  textTransform: 'uppercase',
  letterSpacing: '0.05em'
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

const estiloBotonPrimario = {
  fontSize: '13px',
  padding: '8px 20px',
  borderRadius: '8px',
  border: 'none',
  backgroundColor: '#1a1a2e',
  color: '#ffffff',
  cursor: 'pointer'
}

const estiloBoton = {
  fontSize: '13px',
  padding: '8px 20px',
  borderRadius: '8px',
  border: '0.5px solid #c8c5b8',
  backgroundColor: 'transparent',
  color: '#1a1a2e',
  textDecoration: 'none',
  cursor: 'pointer',
  display: 'inline-block'
}