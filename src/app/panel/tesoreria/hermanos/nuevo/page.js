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
    <div style={{ maxWidth: '700px', fontFamily: 'var(--font-montserrat)' }}>

      {/* Encabezado */}
      <div style={{ marginBottom: '2rem' }}>
        <Link 
          href="/panel/tesoreria/hermanos" 
          style={{ fontSize: '13px', color: 'var(--color-gris)', fontWeight: '500', textDecoration: 'none', marginBottom: '12px', display: 'inline-block', transition: 'color 0.2s' }}
          onMouseOver={e => e.currentTarget.style.color = 'var(--color-institucional)'}
          onMouseOut={e => e.currentTarget.style.color = 'var(--color-gris)'}
        >
          ← Volver al Cuadro Lógico
        </Link>

        <h1 style={{ fontSize: '28px', fontWeight: '600', color: 'var(--color-institucional)', marginBottom: '6px', fontFamily: 'var(--font-baskerville)' }}>
          Nuevo Hermano
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--color-gris)', margin: 0 }}>
          Completá los datos del hermano. El saldo inicial permite cargar su situación actual con el tesoro.
        </p>
      </div>

      {/* Mensaje de error */}
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

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '0.5rem', padding: '8px 0' }}>
            <input
              type="checkbox"
              name="activo"
              id="activo"
              checked={form.activo}
              onChange={handleChange}
              style={{ width: '16px', height: '16px', cursor: 'pointer' }}
            />
            <label htmlFor="activo" style={{ fontSize: '13px', color: 'var(--color-institucional)', fontWeight: '500', cursor: 'pointer' }}>
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
              style={{ ...estiloInput, maxWidth: '50%' }}
            />
            <p style={{ fontSize: '11px', color: 'var(--color-gris)', marginTop: '6px', fontWeight: '500' }}>
              Positivo = tiene crédito a favor <span style={{ margin: '0 4px', color: '#d1d0c8' }}>|</span> Negativo = tiene deuda <span style={{ margin: '0 4px', color: '#d1d0c8' }}>|</span> 0 = a plomo
            </p>
          </Campo>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '1.5rem 0 0.5rem' }}>
            <input
              type="checkbox"
              name="exento"
              id="exento"
              checked={form.exento}
              onChange={handleChange}
              style={{ width: '16px', height: '16px', cursor: 'pointer' }}
            />
            <label htmlFor="exento" style={{ fontSize: '13px', color: 'var(--color-institucional)', fontWeight: '500', cursor: 'pointer' }}>
              Hermano exento de capita temporalmente
            </label>
          </div>

          {form.exento && (
            <div style={{ backgroundColor: '#fafaf8', padding: '1rem', borderRadius: '8px', border: '1px solid #e8e6e0', marginTop: '1rem' }}>
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
            </div>
          )}
        </Seccion>

        {/* Botones */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '2rem' }}>
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
            {cargando ? 'Guardando...' : 'Guardar hermano'}
          </button>
          <Link 
            href="/panel/tesoreria/hermanos" 
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

// ─── Componentes auxiliares del formulario ────────────────────

function Seccion({ titulo, children }) {
  return (
    <div style={{
      backgroundColor: '#ffffff',
      border: '1px solid rgba(207, 181, 59, 0.2)',
      borderRadius: '12px',
      padding: '1.5rem',
      marginBottom: '1.5rem',
      boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
    }}>
      <p style={{ fontSize: '12px', fontWeight: '700', color: 'var(--color-institucional)', marginBottom: '1.25rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid rgba(207, 181, 59, 0.15)', paddingBottom: '10px' }}>
        {titulo}
      </p>
      {children}
    </div>
  )
}

function Fila({ children }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '16px' }}>
      {children}
    </div>
  )
}

function Campo({ label, children }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--color-institucional)', marginBottom: '8px', fontFamily: 'var(--font-montserrat)' }}>
        {label}
      </label>
      {children}
    </div>
  )
}

// ─── Estilos ──────────────────────────────────────────────────

const estiloInput = {
  width: '100%',
  padding: '10px 12px',
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