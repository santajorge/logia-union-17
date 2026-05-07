'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function HospitalarioDashboard() {
  const [movimientos, setMovimientos] = useState([])
  const [totales, setTotales] = useState({ ingresos: 0, egresos: 0, saldo: 0 })
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    async function cargarDatos() {
      // 1. Traemos los Ingresos
      const { data: ingresos } = await supabase
        .from('saco_beneficencia_ingresos')
        .select(`
          id, fecha, monto, notas, tenida_id,
          tenidas ( tipo, grado, acta_nro )
        `)
        .order('fecha', { ascending: false })

      // 2. Traemos los Egresos
      const { data: egresos } = await supabase
        .from('saco_beneficencia_egresos')
        .select(`
          id, fecha, monto, tipo_destino, institucion, descripcion, hermano_id,
          hermanos ( nombre, apellido )
        `)
        .order('fecha', { ascending: false })

      // 3. Calculamos los totales
      let totalIngresos = 0
      let totalEgresos = 0

      const historial = []

      if (ingresos) {
        ingresos.forEach(ing => {
          totalIngresos += Number(ing.monto)
          historial.push({
            ...ing,
            tipo_movimiento: 'ingreso',
            // Si tiene tenida_id es Regular, si no, es Especial
            titulo: ing.tenida_id ? `Saco Regular (Tenida ${ing.tenidas?.tipo || ''})` : 'Saco Especial / Donación'
          })
        })
      }

      if (egresos) {
        egresos.forEach(eg => {
          totalEgresos += Number(eg.monto)
          let titulo = 'Egreso de Beneficencia'
          if (eg.tipo_destino === 'hermano' && eg.hermanos) titulo = `Ayuda H.·. ${eg.hermanos.apellido}`
          if (eg.tipo_destino === 'subsidio_nacimiento' && eg.hermanos) titulo = `Subsidio Nacimiento H.·. ${eg.hermanos.apellido}`
          if (eg.tipo_destino === 'institucion') titulo = `Donación: ${eg.institucion}`
          
          historial.push({
            ...eg,
            tipo_movimiento: 'egreso',
            titulo: titulo
          })
        })
      }

      // Ordenamos todo cronológicamente (del más nuevo al más viejo)
      historial.sort((a, b) => new Date(b.fecha) - new Date(a.fecha))

      setTotales({
        ingresos: totalIngresos,
        egresos: totalEgresos,
        saldo: totalIngresos - totalEgresos
      })
      setMovimientos(historial)
      setCargando(false)
    }

    cargarDatos()
  }, [])

  const formatPesos = (monto) => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(monto)
  }

  const formatFecha = (fecha) => {
    return new Date(fecha + 'T00:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  return (
    <div style={{ maxWidth: '950px', fontFamily: 'var(--font-montserrat)' }}>
      
      {/* CABECERA */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '600', color: 'var(--color-institucional)', margin: '0 0 6px', fontFamily: 'var(--font-baskerville)' }}>
            Saco de Beneficencia
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--color-gris)', margin: 0 }}>
            Gestión de ingresos solidarios y ayudas otorgadas por el Taller.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Link 
            href="/panel/hospitalario/ingresos/nuevo" 
            style={{ backgroundColor: 'var(--color-institucional)', color: 'var(--color-oro)', border: '1px solid var(--color-oro)', textDecoration: 'none', padding: '10px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', transition: 'all 0.2s', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}
            onMouseOver={e => e.currentTarget.style.backgroundColor = '#111122'}
            onMouseOut={e => e.currentTarget.style.backgroundColor = 'var(--color-institucional)'}
          >
            + Registrar Ingreso
          </Link>
          <Link 
            href="/panel/hospitalario/egresos/nuevo" 
            style={{ backgroundColor: '#fafaf8', color: 'var(--color-gris)', border: '1px solid #d1d0c8', textDecoration: 'none', padding: '10px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', transition: 'all 0.2s' }}
            onMouseOver={e => e.currentTarget.style.backgroundColor = '#f0efe9'}
            onMouseOut={e => e.currentTarget.style.backgroundColor = '#fafaf8'}
          >
            - Registrar Ayuda
          </Link>
        </div>
      </div>

      {/* TARJETAS DE TOTALES */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <div style={{ ...estiloTarjeta, borderTop: '4px solid var(--color-institucional)' }}>
          <p style={estiloTituloTarjeta}>Saldo Disponible</p>
          <h2 style={{ fontSize: '32px', color: 'var(--color-institucional)', margin: 0, fontWeight: '700' }}>{cargando ? '...' : formatPesos(totales.saldo)}</h2>
        </div>
        <div style={{ ...estiloTarjeta, borderTop: '4px solid #4A8516' }}>
          <p style={estiloTituloTarjeta}>Histórico Recaudado</p>
          <h2 style={{ fontSize: '26px', color: '#4A8516', margin: 0, fontWeight: '600' }}>{cargando ? '...' : formatPesos(totales.ingresos)}</h2>
        </div>
        <div style={{ ...estiloTarjeta, borderTop: '4px solid #B33A3A' }}>
          <p style={estiloTituloTarjeta}>Ayudas Otorgadas</p>
          <h2 style={{ fontSize: '26px', color: '#B33A3A', margin: 0, fontWeight: '600' }}>{cargando ? '...' : formatPesos(totales.egresos)}</h2>
        </div>
      </div>

      {/* TABLA DE MOVIMIENTOS HISTÓRICOS */}
      <div style={{ backgroundColor: '#ffffff', border: '1px solid rgba(207, 181, 59, 0.2)', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(207, 181, 59, 0.15)', backgroundColor: '#fafaf8' }}>
          <h3 style={{ fontSize: '14px', margin: 0, color: 'var(--color-institucional)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Últimos Movimientos del Saco</h3>
        </div>

        {cargando ? (
          <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-gris)', fontSize: '14px' }}>Cargando historial...</p>
        ) : movimientos.length === 0 ? (
          <p style={{ padding: '3.5rem 2rem', textAlign: 'center', color: 'var(--color-gris)', fontSize: '14px', margin: 0 }}>
            No hay movimientos registrados en el Saco de Beneficencia.
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(207, 181, 59, 0.15)' }}>
                  <th style={estiloTh}>Fecha</th>
                  <th style={estiloTh}>Concepto</th>
                  <th style={estiloTh}>Notas</th>
                  <th style={{ ...estiloTh, textAlign: 'right' }}>Monto</th>
                </tr>
              </thead>
              <tbody>
                {movimientos.map((mov, i) => (
                  <tr 
                    key={`${mov.tipo_movimiento}-${mov.id}`} 
                    style={{ borderBottom: '1px solid #f0efe9', backgroundColor: i % 2 === 0 ? '#ffffff' : '#fafaf8', transition: 'background-color 0.2s' }}
                    onMouseOver={e => e.currentTarget.style.backgroundColor = '#f4f3ed'}
                    onMouseOut={e => e.currentTarget.style.backgroundColor = i % 2 === 0 ? '#ffffff' : '#fafaf8'}
                  >
                    <td style={estiloTd}>{formatFecha(mov.fecha)}</td>
                    <td style={estiloTd}>
                      <span style={{ fontWeight: '600', color: 'var(--color-institucional)' }}>{mov.titulo}</span>
                      {mov.tipo_movimiento === 'ingreso' && mov.tenida_id && mov.tenidas?.acta_nro && (
                        <span style={{ display: 'inline-block', fontSize: '11px', color: 'var(--color-gris)', marginTop: '4px', backgroundColor: '#e8e6e0', padding: '2px 6px', borderRadius: '4px', fontWeight: '500' }}>
                          Acta Nº {mov.tenidas.acta_nro}
                        </span>
                      )}
                    </td>
                    <td style={{ ...estiloTd, color: 'var(--color-gris)' }}>
                      {mov.notas || mov.descripcion || <span style={{ fontStyle: 'italic', color: '#ccc' }}>—</span>}
                    </td>
                    <td style={{ ...estiloTd, textAlign: 'right', fontWeight: '700', fontSize: '14px', color: mov.tipo_movimiento === 'ingreso' ? '#4A8516' : '#B33A3A' }}>
                      {mov.tipo_movimiento === 'ingreso' ? '+' : '-'}{formatPesos(mov.monto)}
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

// ESTILOS
const estiloTarjeta = { backgroundColor: '#ffffff', border: '1px solid rgba(207, 181, 59, 0.2)', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }
const estiloTituloTarjeta = { fontSize: '12px', color: 'var(--color-gris)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', fontWeight: '600' }
const estiloTh = { textAlign: 'left', padding: '14px 16px', fontWeight: '700', color: 'var(--color-gris)', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '11px' }
const estiloTd = { padding: '14px 16px', verticalAlign: 'middle' }