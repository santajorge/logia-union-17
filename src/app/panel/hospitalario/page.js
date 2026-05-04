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
    <div style={{ maxWidth: '900px' }}>
      
      {/* CABECERA */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#1a1a2e', margin: '0 0 4px' }}>
            Saco de Beneficencia
          </h1>
          <p style={{ fontSize: '13px', color: '#888', margin: 0 }}>
            Gestión de ingresos solidarios y ayudas otorgadas.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link href="/panel/hospitalario/ingresos/nuevo" style={{ backgroundColor: '#1a1a2e', color: '#fff', textDecoration: 'none', padding: '10px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '500' }}>
            + Registrar Ingreso
          </Link>
          <Link href="/panel/hospitalario/egresos/nuevo" style={{ backgroundColor: '#ffffff', color: '#1a1a2e', border: '1px solid #1a1a2e', textDecoration: 'none', padding: '10px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '500' }}>
            - Registrar Ayuda
          </Link>
        </div>
      </div>

      {/* TARJETAS DE TOTALES */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ ...estiloTarjeta, borderTop: '4px solid #1a1a2e' }}>
          <p style={estiloTituloTarjeta}>Saldo Disponible</p>
          <h2 style={{ fontSize: '28px', color: '#1a1a2e', margin: 0 }}>{cargando ? '...' : formatPesos(totales.saldo)}</h2>
        </div>
        <div style={{ ...estiloTarjeta, borderTop: '4px solid #3B6D11' }}>
          <p style={estiloTituloTarjeta}>Histórico Recaudado</p>
          <h2 style={{ fontSize: '24px', color: '#444', margin: 0 }}>{cargando ? '...' : formatPesos(totales.ingresos)}</h2>
        </div>
        <div style={{ ...estiloTarjeta, borderTop: '4px solid #A32D2D' }}>
          <p style={estiloTituloTarjeta}>Ayudas Otorgadas</p>
          <h2 style={{ fontSize: '24px', color: '#444', margin: 0 }}>{cargando ? '...' : formatPesos(totales.egresos)}</h2>
        </div>
      </div>

      {/* TABLA DE MOVIMIENTOS HISTÓRICOS */}
      <div style={{ backgroundColor: '#ffffff', border: '0.5px solid #e8e6e0', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem', borderBottom: '1px solid #e8e6e0', backgroundColor: '#fafaf8' }}>
          <h3 style={{ fontSize: '14px', margin: 0, color: '#1a1a2e', fontWeight: '600' }}>Últimos Movimientos del Saco</h3>
        </div>

        {cargando ? (
          <p style={{ padding: '2rem', textAlign: 'center', color: '#888', fontSize: '13px' }}>Cargando historial...</p>
        ) : movimientos.length === 0 ? (
          <p style={{ padding: '3rem 2rem', textAlign: 'center', color: '#666', fontSize: '14px', margin: 0 }}>
            No hay movimientos registrados en el Saco de Beneficencia.
          </p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e8e6e0' }}>
                <th style={estiloTh}>Fecha</th>
                <th style={estiloTh}>Concepto</th>
                <th style={estiloTh}>Notas</th>
                <th style={{ ...estiloTh, textAlign: 'right' }}>Monto</th>
              </tr>
            </thead>
            <tbody>
              {movimientos.map((mov, i) => (
                <tr key={`${mov.tipo_movimiento}-${mov.id}`} style={{ borderBottom: '1px solid #f0efe9', backgroundColor: i % 2 === 0 ? '#ffffff' : '#fafaf8' }}>
                  <td style={estiloTd}>{formatFecha(mov.fecha)}</td>
                  <td style={estiloTd}>
                    <span style={{ fontWeight: '500', color: '#1a1a2e' }}>{mov.titulo}</span>
                    {mov.tipo_movimiento === 'ingreso' && mov.tenida_id && mov.tenidas?.acta_nro && (
                      <span style={{ display: 'block', fontSize: '11px', color: '#888', marginTop: '2px' }}>Acta Nº {mov.tenidas.acta_nro}</span>
                    )}
                  </td>
                  <td style={{ ...estiloTd, color: '#666' }}>
                    {mov.notas || mov.descripcion || '—'}
                  </td>
                  <td style={{ ...estiloTd, textAlign: 'right', fontWeight: '600', color: mov.tipo_movimiento === 'ingreso' ? '#3B6D11' : '#A32D2D' }}>
                    {mov.tipo_movimiento === 'ingreso' ? '+' : '-'}{formatPesos(mov.monto)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

    </div>
  )
}

// ESTILOS
const estiloTarjeta = { backgroundColor: '#ffffff', border: '1px solid #e8e6e0', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }
const estiloTituloTarjeta = { fontSize: '12px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', fontWeight: '500' }
const estiloTh = { textAlign: 'left', padding: '12px 16px', fontWeight: '600', color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '11px' }
const estiloTd = { padding: '12px 16px', verticalAlign: 'middle' }