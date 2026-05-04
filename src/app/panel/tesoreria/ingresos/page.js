'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function IngresosVariosPage() {
  const [ingresos, setIngresos] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    async function cargarIngresos() {
      const { data, error } = await supabase
        .from('ingresos_varios')
        .select('*')
        .order('fecha', { ascending: false })

      if (!error && data) {
        setIngresos(data)
      }
      setCargando(false)
    }

    cargarIngresos()
  }, [])

  function formatPesos(monto) {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(monto)
  }

  function formatFecha(fecha) {
    return new Date(fecha + 'T00:00:00').toLocaleDateString('es-AR', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    })
  }

  const total = ingresos.reduce((acc, curr) => acc + Number(curr.monto), 0)

  return (
    <div style={{ maxWidth: '1000px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '500', color: '#1a1a2e', marginBottom: '4px' }}>
            Ingresos Varios
          </h1>
          <p style={{ fontSize: '13px', color: '#888' }}>
            Registro de donaciones, intereses y otros ingresos no relacionados a cápitas.
          </p>
        </div>
        
        <Link href="/panel/tesoreria/ingresos/nuevo" style={estiloBotonPrimario}>
          + Registrar Ingreso
        </Link>
      </div>

      <div style={estiloSeccion}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <p style={estiloTituloSeccion}>Historial de Movimientos</p>
          <p style={{ fontSize: '14px', fontWeight: '600', color: '#3B6D11' }}>
            Total Histórico: {formatPesos(total)}
          </p>
        </div>

        {cargando ? (
          <p style={{ fontSize: '13px', color: '#888', padding: '1rem 0' }}>Cargando registros...</p>
        ) : ingresos.length === 0 ? (
          <p style={{ fontSize: '13px', color: '#888', padding: '1rem 0' }}>No hay ingresos registrados aún.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr>
                  <th style={estiloTh}>Fecha</th>
                  <th style={estiloTh}>Categoría</th>
                  <th style={estiloTh}>Descripción</th>
                  <th style={estiloTh}>Monto</th>
                  <th style={estiloTh}>Comprobante</th>
                </tr>
              </thead>
              <tbody>
                {ingresos.map((ingreso, i) => (
                  <tr key={ingreso.id} style={{ backgroundColor: i % 2 === 0 ? 'transparent' : '#fafaf8' }}>
                    <td style={estiloTd}>{formatFecha(ingreso.fecha)}</td>
                    <td style={estiloTd}>
                      <span style={{ backgroundColor: '#e8e6e0', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', color: '#555' }}>
                        {ingreso.categoria}
                      </span>
                    </td>
                    <td style={estiloTd}>{ingreso.descripcion}</td>
                    <td style={{ ...estiloTd, color: '#3B6D11', fontWeight: '600' }}>
                      {formatPesos(ingreso.monto)}
                    </td>
                    <td style={estiloTd}>
                      {ingreso.comprobante_url ? (
                        <a href={ingreso.comprobante_url} target="_blank" rel="noreferrer" style={{ color: '#CDA434', textDecoration: 'none', fontSize: '12px' }}>
                          Ver link
                        </a>
                      ) : '—'}
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

// Estilos
const estiloSeccion = { backgroundColor: '#ffffff', border: '0.5px solid #e8e6e0', borderRadius: '12px', padding: '1.25rem', marginBottom: '1rem' }
const estiloTituloSeccion = { fontSize: '13px', fontWeight: '500', color: '#888', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }
const estiloTh = { textAlign: 'left', padding: '8px 10px', fontWeight: '500', color: '#888', borderBottom: '0.5px solid #e8e6e0', fontSize: '12px' }
const estiloTd = { padding: '12px 10px', borderBottom: '0.5px solid #f0efe9', color: '#1a1a2e', verticalAlign: 'middle' }
const estiloBotonPrimario = { fontSize: '13px', padding: '8px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#1a1a2e', color: '#ffffff', textDecoration: 'none', cursor: 'pointer' }