'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function EgresosPage() {
  const [egresos, setEgresos] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    async function cargarEgresos() {
      const { data, error } = await supabase
        .from('egresos')
        .select('*')
        .order('fecha', { ascending: false })

      if (!error && data) {
        setEgresos(data)
      }
      setCargando(false)
    }
    cargarEgresos()
  }, [])

  function formatPesos(monto) {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(monto)
  }

  function formatFecha(fecha) {
    return new Date(fecha + 'T00:00:00').toLocaleDateString('es-AR', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    })
  }

  const totalEgresos = egresos.reduce((acc, curr) => acc + Number(curr.monto), 0)

  return (
    <div style={{ maxWidth: '1000px', fontFamily: 'var(--font-montserrat)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '600', color: 'var(--color-institucional)', marginBottom: '6px', fontFamily: 'var(--font-baskerville)' }}>
            Egresos del Taller
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--color-gris)', margin: 0 }}>
            Registro de gastos operativos, pagos a la Gran Logia y compras.
          </p>
        </div>
        <Link 
          href="/panel/tesoreria/egresos/nuevo" 
          style={estiloBotonPrimario}
          onMouseOver={e => e.currentTarget.style.backgroundColor = '#111122'}
          onMouseOut={e => e.currentTarget.style.backgroundColor = 'var(--color-institucional)'}
        >
          + Registrar Egreso
        </Link>
      </div>

      <div style={estiloSeccion}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '10px', borderBottom: '1px solid rgba(207, 181, 59, 0.15)' }}>
          <p style={estiloTituloSeccion}>Historial de Salidas</p>
          <p style={{ fontSize: '15px', fontWeight: '700', color: '#B33A3A', margin: 0 }}>
            Total Histórico: {formatPesos(totalEgresos)}
          </p>
        </div>

        {cargando ? (
          <p style={{ fontSize: '14px', color: 'var(--color-gris)', padding: '1rem 0' }}>Cargando registros...</p>
        ) : egresos.length === 0 ? (
          <p style={{ fontSize: '14px', color: 'var(--color-gris)', padding: '1.5rem 0', margin: 0, textAlign: 'center' }}>No hay egresos registrados aún.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr>
                  <th style={estiloTh}>Fecha</th>
                  <th style={estiloTh}>Categoría</th>
                  <th style={estiloTh}>Descripción</th>
                  <th style={estiloTh}>Monto</th>
                  <th style={{ ...estiloTh, textAlign: 'right' }}>Comprobante</th>
                </tr>
              </thead>
              <tbody>
                {egresos.map((egreso, i) => (
                  <tr 
                    key={egreso.id} 
                    style={{ backgroundColor: i % 2 === 0 ? '#ffffff' : '#fafaf8', transition: 'background-color 0.2s' }}
                    onMouseOver={e => e.currentTarget.style.backgroundColor = '#f4f3ed'}
                    onMouseOut={e => e.currentTarget.style.backgroundColor = i % 2 === 0 ? '#ffffff' : '#fafaf8'}
                  >
                    <td style={estiloTd}>{formatFecha(egreso.fecha)}</td>
                    <td style={estiloTd}>
                      <span style={{ backgroundColor: '#fafaf8', padding: '5px 10px', borderRadius: '6px', fontSize: '11px', color: 'var(--color-gris)', border: '1px solid #d1d0c8', fontWeight: '600', letterSpacing: '0.02em' }}>
                        {egreso.categoria}
                      </span>
                    </td>
                    <td style={{ ...estiloTd, color: 'var(--color-institucional)', fontWeight: '500' }}>{egreso.descripcion}</td>
                    <td style={{ ...estiloTd, color: '#B33A3A', fontWeight: '700', fontSize: '14px' }}>
                      - {formatPesos(egreso.monto)}
                    </td>
                    <td style={{ ...estiloTd, textAlign: 'right' }}>
                      {egreso.comprobante_url ? (
                        <a 
                          href={egreso.comprobante_url} 
                          target="_blank" 
                          rel="noreferrer" 
                          style={{ color: 'var(--color-oro)', textDecoration: 'none', fontSize: '13px', fontWeight: '600', transition: 'color 0.2s' }}
                          onMouseOver={e => e.currentTarget.style.color = 'var(--color-institucional)'}
                          onMouseOut={e => e.currentTarget.style.color = 'var(--color-oro)'}
                        >
                          Ver link
                        </a>
                      ) : <span style={{ color: '#ccc', fontStyle: 'italic' }}>—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
  textTransform: 'uppercase', 
  letterSpacing: '0.05em', 
  margin: 0 
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
  verticalAlign: 'middle' 
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
  cursor: 'pointer',
  transition: 'all 0.2s',
  boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
}