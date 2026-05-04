'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function NuevoHermanoPage() {
  const router = useRouter()
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState(null)
  const [tiposCuota, setTiposCuota] = useState([])

  // Datos del formulario
  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    grado: '1',
    tipo_cuota_id: '',
    activo: true,
    exento: false,
    exento_hasta: '',
    exento_motivo: '',
    saldo: '0',
  })

  // Al cargar la página, traemos los tipos de cuota disponibles
  useEffect(() => {
    async function cargarTiposCuota() {
      const { data } = await supabase
        .from('tipos_cuota')
        .select('id, nombre')
        .eq('activo', true)
        .order('nombre')
      if (data) {
        setTiposCuota(data)
        // Preseleccionamos el primer tipo por defecto
        if (data.length > 0) {
          setForm(f => ({ ...f, tipo_cuota_id: data[0].id }))
        }
      }
    }
    cargarTiposCuota()
  }, [])

  // Actualiza el campo correspondiente cuando el usuario escribe
  function handleChange(e) {
    const { name, value, type, checked } = e.target
    setForm(f => ({
      ...f,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  // Guarda el hermano en Supabase
  async function handleSubmit(e) {
    e.preventDefault()
    setCargando(true)
    setError(null)

    // Validaciones básicas
    if (!form.nombre.trim() || !form.apellido.trim()) {
      setError('El nombre y apellido son obligatorios.')
      setCargando(false)
      return
    }
    if (!form.tipo_cuota_id) {
      setError('Seleccioná un tipo de cuota.')
      setCargando(false)
      return
    }

    const datos = {
      nombre: form.nombre.trim(),
      apellido: form.apellido.trim(),
      email: form.email.trim() || null,
      telefono: form.telefono.trim() || null,
      grado: parseInt(form.grado),
      tipo_cuota_id: form.tipo_cuota_id,
      activo: form.activo,
      exento: form.exento,
      exento_hasta: form.exento && form.exento_hasta ? form.exento_hasta : null,
      exento_motivo: form.exento && form.exento_motivo ? form.exento_motivo.trim() : null,
      saldo: parseFloat(form.saldo) || 0,
    }

    const { error: err } = await supabase.from('hermanos').insert(datos)

    if (err) {
      setError('Ocurrió un error al guardar. Intentá de nuevo.')
      console.error(err)
      setCargando(false)
      return
    }

    // Si todo salió bien, volvemos al panel principal
    router.push('/panel/tesoreria/hermanos')
    router.refresh()
  }

  return (
    <div style={{ maxWidth: '600px' }}>

      {/* Encabezado */}
      <Link href="/panel/tesoreria/hermanos" style={{ fontSize: '12px', color: '#666', textDecoration: 'none', marginBottom: '8px', display: 'inline-block' }}>
        ← Volver al Cuadro Lógico
      </Link>

      <h1 style={{ fontSize: '22px', fontWeight: '500', color: '#1a1a2e', marginBottom: '0.25rem' }}>
        Nuevo hermano
      </h1>
      <p style={{ fontSize: '13px', color: '#888', marginBottom: '1.5rem' }}>
        Completá los datos del hermano. El saldo inicial permite cargar su situación actual con el tesoro.
      </p>

      {/* Mensaje de error */}
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

        {/* SECCIÓN: Datos personales */}
        <Seccion titulo="Datos personales">

          <Fila>
            <Campo label="Nombre *">
              <input
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                placeholder="Ej: Juan"
                style={estiloInput}
              />
            </Campo>
            <Campo label="Apellido *">
              <input
                name="apellido"
                value={form.apellido}
                onChange={handleChange}
                placeholder="Ej: García"
                style={estiloInput}
              />
            </Campo>
          </Fila>

          <Fila>
            <Campo label="Email">
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="correo@ejemplo.com"
                style={estiloInput}
              />
            </Campo>
            <Campo label="Teléfono">
              <input
                name="telefono"
                value={form.telefono}
                onChange={handleChange}
                placeholder="Ej: 3414000001"
                style={estiloInput}
              />
            </Campo>
          </Fila>

        </Seccion>

        {/* SECCIÓN: Datos masónicos */}
        <Seccion titulo="Datos masónicos">

          <Fila>
            <Campo label="Grado">
              <select name="grado" value={form.grado} onChange={handleChange} style={estiloInput}>
                <option value="1">1° — Aprendiz</option>
                <option value="2">2° — Compañero</option>
                <option value="3">3° — Maestro</option>
              </select>
            </Campo>
            <Campo label="Tipo de cuota *">
              <select name="tipo_cuota_id" value={form.tipo_cuota_id} onChange={handleChange} style={estiloInput}>
                {tiposCuota.map(t => (
                  <option key={t.id} value={t.id}>{t.nombre}</option>
                ))}
              </select>
            </Campo>
          </Fila>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '0.5rem' }}>
            <input
              type="checkbox"
              name="activo"
              id="activo"
              checked={form.activo}
              onChange={handleChange}
              style={{ width: '16px', height: '16px' }}
            />
            <label htmlFor="activo" style={{ fontSize: '13px', color: '#444' }}>
              Hermano activo en el taller
            </label>
          </div>

        </Seccion>

        {/* SECCIÓN: Estado con el tesoro */}
        <Seccion titulo="Estado con el tesoro">

          <Campo label="Saldo inicial">
            <input
              name="saldo"
              type="number"
              value={form.saldo}
              onChange={handleChange}
              style={estiloInput}
            />
            <p style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>
              Positivo = tiene crédito a favor · Negativo = tiene deuda · 0 = a plomo
            </p>
          </Campo>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '1rem 0 0.5rem' }}>
            <input
              type="checkbox"
              name="exento"
              id="exento"
              checked={form.exento}
              onChange={handleChange}
              style={{ width: '16px', height: '16px' }}
            />
            <label htmlFor="exento" style={{ fontSize: '13px', color: '#444' }}>
              Hermano exento de capita temporalmente
            </label>
          </div>

          {form.exento && (
            <Fila>
              <Campo label="Exento hasta">
                <input
                  name="exento_hasta"
                  type="date"
                  value={form.exento_hasta}
                  onChange={handleChange}
                  style={estiloInput}
                />
              </Campo>
              <Campo label="Motivo de la exención">
                <input
                  name="exento_motivo"
                  value={form.exento_motivo}
                  onChange={handleChange}
                  placeholder="Ej: Situación económica transitoria"
                  style={estiloInput}
                />
              </Campo>
            </Fila>
          )}

        </Seccion>

        {/* Botones */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '1.5rem' }}>
          <button
            type="submit"
            disabled={cargando}
            style={{
              ...estiloBotonPrimario,
              opacity: cargando ? 0.6 : 1,
              cursor: cargando ? 'not-allowed' : 'pointer'
            }}
          >
            {cargando ? 'Guardando...' : 'Guardar hermano'}
          </button>
          <Link href="/panel/tesoreria/hermanos" style={estiloBoton}>
            Cancelar
          </Link>
        </div>

      </form>
    </div>
  )
}

// ─── Componentes auxiliares del formulario ────────────────────

function Seccion({ titulo, children }) {
  return (
    <div style={{
      backgroundColor: '#ffffff',
      border: '0.5px solid #e8e6e0',
      borderRadius: '12px',
      padding: '1.25rem',
      marginBottom: '1rem'
    }}>
      <p style={{ fontSize: '13px', fontWeight: '500', color: '#888', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {titulo}
      </p>
      {children}
    </div>
  )
}

function Fila({ children }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
      {children}
    </div>
  )
}

function Campo({ label, children }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>
        {label}
      </label>
      {children}
    </div>
  )
}

// ─── Estilos ──────────────────────────────────────────────────

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
  textDecoration: 'none',
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