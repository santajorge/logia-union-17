'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { UserPlus, Eye, Mail, CreditCard, Shield, Activity } from 'lucide-react'

export default function HermanosPage() {
  const [hermanos, setHermanos] = useState([])
  const [rol, setRol] = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    async function cargarDatos() {
      // 1. Validamos quién está mirando la pantalla
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        const { data: perfil } = await supabase
          .from('hermanos')
          .select('rol_oficial')
          .eq('user_id', session.user.id)
          .single()
        if (perfil) setRol(perfil.rol_oficial)
      }

      // 2. Traemos el Cuadro Lógico completo
      const { data, error } = await supabase
        .from('hermanos')
        .select(`
          id, nombre, apellido, grado, saldo, activo, estado, exento,
          email, telefono, tipos_cuota (nombre)
        `)
        .order('apellido')

      if (!error && data) {
        setHermanos(data)
      }
      setCargando(false)
    }

    cargarDatos()
  }, [])

  if (cargando) {
    return <p style={{ fontSize: '14px', color: 'var(--color-gris)', padding: '2rem', fontFamily: 'var(--font-montserrat)' }}>Cargando Cuadro Lógico...</p>
  }

  const activos = hermanos.filter(h => h.activo && h.estado === 'activo')
  const inactivos = hermanos.filter(h => !h.activo || h.estado !== 'activo')

  // Lógica de visualización según el rol
  const veFinanzas = rol === 'Tesorero' || rol === 'Venerable Maestro'
  const veContacto = rol === 'Secretario' || rol === 'Venerable Maestro'

  return (
    <div style={{ maxWidth: '1100px', fontFamily: 'var(--font-montserrat)' }}>
      
      {/* CABECERA */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: '600', color: 'var(--color-institucional)', marginBottom: '6px', fontFamily: 'var(--font-baskerville)' }}>
            Cuadro Lógico
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--color-gris)', margin: 0 }}>
            <span style={{ color: '#4A8516', fontWeight: '600' }}>{activos.length} activos</span> <span style={{ margin: '0 6px', color: '#ccc' }}>|</span> <span style={{ color: '#B33A3A', fontWeight: '500' }}>{inactivos.length} inactivos</span>
          </p>
        </div>
        
        {/* Botón de Nuevo Hermano con ícono */}
        {(veFinanzas || veContacto) && (
          <Link 
            href="/panel/tesoreria/hermanos/nuevo" 
            style={estiloBotonPrimario}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#111122'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'var(--color-institucional)'}
          >
            <UserPlus size={18} /> Agregar Hermano
          </Link>
        )}
      </div>

      {/* ACTIVOS */}
      <div style={estiloSeccion}>
        <p style={estiloTituloSeccion}><Activity size={16} style={{ marginRight: '8px', color: '#4A8516' }} /> Hermanos Activos</p>
        <TablaHermanos hermanos={activos} veFinanzas={veFinanzas} veContacto={veContacto} />
      </div>

      {/* INACTIVOS */}
      {inactivos.length > 0 && (
        <div style={{ ...estiloSeccion, opacity: 0.9 }}>
          <p style={estiloTituloSeccion}><Shield size={16} style={{ marginRight: '8px', color: '#B33A3A' }} /> En Sueños / Inactivos / Bajas</p>
          <TablaHermanos hermanos={inactivos} veFinanzas={veFinanzas} veContacto={veContacto} />
        </div>
      )}
    </div>
  )
}

function TablaHermanos({ hermanos, veFinanzas, veContacto }) {
  if (hermanos.length === 0) {
    return <p style={{ fontSize: '13px', color: 'var(--color-gris)', padding: '1.5rem', margin: 0 }}>No hay hermanos en esta categoría.</p>
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', minWidth: '700px', borderCollapse: 'collapse', fontSize: '13px' }}>
        <thead>
          <tr>
            <th style={estiloTh}>Hermano</th>
            <th style={estiloTh}>Grado</th>
            
            {/* Columnas Secretaría */}
            {veContacto && (
              <th style={estiloTh}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Mail size={14} /> Contacto</div>
              </th>
            )}

            {/* Columnas Tesorería */}
            {veFinanzas && <th style={estiloTh}>Cuota</th>}
            {veFinanzas && (
              <th style={estiloTh}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><CreditCard size={14} /> Saldo</div>
              </th>
            )}
            {veFinanzas && <th style={estiloTh}>Estado Fin.</th>}
            
            <th style={{ ...estiloTh, textAlign: 'right' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {hermanos.map((h, i) => (
            <tr 
              key={h.id} 
              style={{ backgroundColor: i % 2 === 0 ? '#ffffff' : '#fafaf8', transition: 'background-color 0.2s' }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f4f3ed'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = i % 2 === 0 ? '#ffffff' : '#fafaf8'}
            >
              
              <td style={estiloTd}>
                <span style={{ fontWeight: '600', color: 'var(--color-institucional)', fontSize: '14px' }}>{h.apellido}</span>, <span style={{ color: 'var(--color-institucional)', fontWeight: '500' }}>{h.nombre}</span>
              </td>
              
              <td style={{ ...estiloTd, color: 'var(--color-gris)' }}>{h.grado}°</td>
              
              {/* Datos Secretaría */}
              {veContacto && (
                <td style={{ ...estiloTd, fontSize: '12px', color: 'var(--color-gris)' }}>
                  {h.email || <span style={{ color: '#ccc', fontStyle: 'italic' }}>Sin correo</span>}<br/>
                  {h.telefono || <span style={{ color: '#ccc', fontStyle: 'italic' }}>Sin teléfono</span>}
                </td>
              )}

              {/* Datos Tesorería */}
              {veFinanzas && <td style={{ ...estiloTd, color: 'var(--color-gris)' }}>{h.tipos_cuota?.nombre || '—'}</td>}
              {veFinanzas && (
                <td style={estiloTd}>
                  <span style={{ color: h.exento ? '#854F0B' : h.saldo >= 0 ? '#4A8516' : '#B33A3A', fontWeight: '600' }}>
                    {h.exento ? 'Exento' : formatPesos(h.saldo)}
                  </span>
                </td>
              )}
              {veFinanzas && <td style={estiloTd}><Badge hermano={h} /></td>}
              
              {/* ACCIONES */}
              <td style={{ ...estiloTd, textAlign: 'right' }}>
                <Link 
                  href={`/panel/tesoreria/hermanos/${h.id}`} 
                  style={estiloBotonAccion}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-institucional)'
                    e.currentTarget.style.color = 'var(--color-oro)'
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = '#ffffff'
                    e.currentTarget.style.color = 'var(--color-institucional)'
                  }}
                >
                  <Eye size={14} /> Ficha
                </Link>
              </td>

            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Badge({ hermano }) {
  if (!hermano.activo || hermano.estado !== 'activo') {
    const labels = {
      suspendido_201: 'Art. 201',
      en_suenos: 'En sueños',
      renunciado: 'Renuncia',
      baja: 'Baja'
    }
    return <span style={{ ...estiloBadge, background: '#F1EFE8', color: 'var(--color-gris)', border: '1px solid #e8e6e0' }}>
      {labels[hermano.estado] || 'Inactivo'}
    </span>
  }
  if (hermano.exento) return <span style={{ ...estiloBadge, background: '#FAEEDA', color: '#854F0B', border: '1px solid #F3DDBA' }}>Exento</span>
  if (hermano.saldo >= 0) return <span style={{ ...estiloBadge, background: '#EAF3DE', color: '#4A8516', border: '1px solid #D4EAB6' }}>A plomo</span>
  
  return <span style={{ ...estiloBadge, background: '#FCEBEB', color: '#B33A3A', border: '1px solid #F8D7D7' }}>En deuda</span>
}

function formatPesos(monto) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(monto)
}

// ESTILOS ADAPTADOS A UNIÓN 17
const estiloSeccion = { backgroundColor: '#ffffff', border: '1px solid rgba(207, 181, 59, 0.2)', borderRadius: '12px', padding: '0', overflow: 'hidden', marginBottom: '2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }
const estiloTituloSeccion = { display: 'flex', alignItems: 'center', fontSize: '13px', fontWeight: '700', color: 'var(--color-institucional)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0, padding: '1.25rem', backgroundColor: '#fafaf8', borderBottom: '1px solid rgba(207, 181, 59, 0.15)' }
const estiloTh = { textAlign: 'left', padding: '14px 16px', fontWeight: '600', color: 'var(--color-gris)', borderBottom: '1px solid rgba(207, 181, 59, 0.15)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }
const estiloTd = { padding: '14px 16px', borderBottom: '1px solid #f0efe9', verticalAlign: 'middle', whiteSpace: 'nowrap' }
const estiloBadge = { display: 'inline-block', fontSize: '11px', padding: '5px 12px', borderRadius: '20px', fontWeight: '600', letterSpacing: '0.02em' }
const estiloBotonPrimario = { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '600', padding: '10px 20px', borderRadius: '8px', border: '1px solid var(--color-oro)', backgroundColor: 'var(--color-institucional)', color: 'var(--color-oro)', textDecoration: 'none', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }
const estiloBotonAccion = { display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '600', padding: '6px 14px', borderRadius: '6px', border: '1px solid rgba(207, 181, 59, 0.4)', backgroundColor: '#ffffff', color: 'var(--color-institucional)', textDecoration: 'none', transition: 'all 0.2s', cursor: 'pointer' }