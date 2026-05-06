'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Send } from 'lucide-react'

export default function DashboardTesoro() {
  const [enviando, setEnviando] = useState(false)

  const handleEnviarRecordatorios = async () => {
    if (!window.confirm('¿Estás seguro de enviar el Estado de Cuenta actual a TODOS los hermanos activos?')) return;
    
    setEnviando(true)
    try {
      // Reemplazá 'TU_CRON_SECRET_AQUI' por la contraseña que pusiste en Vercel
      const response = await fetch('/api/tesoreria/notificar?secret=TU_CRON_SECRET_AQUI')
      const data = await response.json()
      
      if (data.ok) {
        alert(`¡Excelente! Se enviaron ${data.enviados} correos exitosamente.`)
      } else {
        alert(`Hubo un problema: ${data.error}`)
      }
    } catch (error) {
      alert('Error de conexión al intentar enviar las notificaciones.')
    } finally {
      setEnviando(false)
    }
  }

  const [stats, setStats] = useState({ activos: 0, deudaTotal: 0, ingresosMes: 0, egresosMes: 0, balanceHistorico: 0 })
  const [ultimosIngresos, setUltimosIngresos] = useState([])
  const [ultimosEgresos, setUltimosEgresos] = useState([])
  const [ultimosPagos, setUltimosPagos] = useState([])
  const [cargando, setCargando] = useState(true)

  const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
  const mesActual = meses[new Date().getMonth()]

  useEffect(() => {
    async function cargarDatos() {
      // 1. Stats Generales (Hermanos)
      const { data: hermanos } = await supabase.from('hermanos').select('saldo, activo, estado')
      let activos = 0, deudaTotal = 0
      if (hermanos) {
        activos = hermanos.filter(h => h.activo && h.estado === 'activo').length
        deudaTotal = hermanos.reduce((acc, h) => (h.saldo < 0 ? acc + Math.abs(h.saldo) : acc), 0)
      }

      // 2. Lógica Financiera (Histórica y Mensual)
      const hoy = new Date()
      const inicioMes = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-01`

      const { data: todosPagos } = await supabase.from('pagos').select('monto, fecha')
      const { data: todosIngresosV } = await supabase.from('ingresos_varios').select('monto, fecha')
      const { data: todosEgresos } = await supabase.from('egresos').select('monto, fecha')

      // A) Calculamos el Fondo Total (Caja Histórica)
      const historicoPagos = todosPagos?.reduce((acc, p) => acc + Number(p.monto), 0) || 0
      const historicoIngresosV = todosIngresosV?.reduce((acc, i) => acc + Number(i.monto), 0) || 0
      const historicoEgresos = todosEgresos?.reduce((acc, e) => acc + Number(e.monto), 0) || 0
      const balanceHistorico = (historicoPagos + historicoIngresosV) - historicoEgresos

      // B) Filtramos para calcular solo lo del Mes Actual
      const pagosMes = todosPagos?.filter(p => p.fecha >= inicioMes).reduce((acc, p) => acc + Number(p.monto), 0) || 0
      const ingresosVMes = todosIngresosV?.filter(i => i.fecha >= inicioMes).reduce((acc, i) => acc + Number(i.monto), 0) || 0
      const egresosMes = todosEgresos?.filter(e => e.fecha >= inicioMes).reduce((acc, e) => acc + Number(e.monto), 0) || 0
      
      setStats({ 
        activos, 
        deudaTotal, 
        ingresosMes: pagosMes + ingresosVMes, 
        egresosMes,
        balanceHistorico 
      })

      // 3. Tablas de actividad reciente (Últimos 5)
      const { data: recientesIngresos } = await supabase.from('ingresos_varios').select('*').order('fecha', { ascending: false }).limit(5)
      const { data: recientesEgresos } = await supabase.from('egresos').select('*').order('fecha', { ascending: false }).limit(5)
      const { data: recientesPagos } = await supabase.from('pagos').select('id, fecha, monto, hermanos(nombre, apellido)').order('fecha', { ascending: false }).limit(5)
      
      setUltimosIngresos(recientesIngresos || [])
      setUltimosEgresos(recientesEgresos || [])
      setUltimosPagos(recientesPagos || [])
      setCargando(false)
    }
    cargarDatos()
  }, [])

  const formatPesos = (monto) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(monto)
  const formatFecha = (fecha) => new Date(fecha + 'T00:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })

  if (cargando) return <p style={{ fontSize: '14px', color: 'var(--color-gris)', fontFamily: 'var(--font-montserrat)' }}>Calculando finanzas del Taller...</p>

  const balanceMensual = stats.ingresosMes - stats.egresosMes;

  return (
    <div style={{ fontFamily: 'var(--font-montserrat)' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '26px', fontWeight: '600', color: 'var(--color-institucional)', marginBottom: '6px', fontFamily: 'var(--font-baskerville)' }}>
          Dashboard de Tesorería
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--color-gris)', margin: 0 }}>
          Resumen financiero de {mesActual} (E.·. V.·.) y estado general del Taller.
        </p>
      </div>

      {/* BOTÓN DE ENVIAR ESTADOS DE CUENTA */}
      <button 
        onClick={handleEnviarRecordatorios} 
        disabled={enviando} 
        style={{ 
          backgroundColor: 'var(--color-institucional)', 
          color: 'var(--color-oro)', 
          padding: '12px 24px', 
          borderRadius: '8px', 
          border: '1px solid var(--color-oro)', 
          cursor: enviando ? 'not-allowed' : 'pointer', 
          fontWeight: '600', 
          fontSize: '14px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '10px',
          opacity: enviando ? 0.7 : 1,
          transition: 'all 0.2s ease',
          marginBottom: '2.5rem',
          boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
        }}
        onMouseOver={(e) => !enviando && (e.currentTarget.style.backgroundColor = '#111122')}
        onMouseOut={(e) => !enviando && (e.currentTarget.style.backgroundColor = 'var(--color-institucional)')}
      >
        <Send size={18} />
        {enviando ? 'Enviando correos...' : 'Notificar Estados de Cuenta'}
      </button>

      {/* GRID DE TARJETAS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <Tarjeta label="Fondo en Caja (Total)" valor={formatPesos(stats.balanceHistorico)} color="var(--color-institucional)" />
        <Tarjeta label="Hermanos Activos" valor={stats.activos} color="var(--color-institucional)" />
        <Tarjeta label="Deuda a Recuperar" valor={formatPesos(stats.deudaTotal)} color="#B33A3A" />
        <Tarjeta label="Ingresos del Mes" valor={formatPesos(stats.ingresosMes)} color="#4A8516" />
        <Tarjeta label="Egresos del Mes" valor={formatPesos(stats.egresosMes)} color="#B33A3A" />
        <Tarjeta label="Balance del Mes" valor={formatPesos(balanceMensual)} color={balanceMensual >= 0 ? '#4A8516' : '#B33A3A'} />
      </div>

      {/* BLOQUE DE ACTIVIDAD RECIENTE */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        
        {/* TABLA: Últimos Pagos de Cápitas */}
        <ContenedorTabla titulo="Últimos Pagos de Cápitas">
          {ultimosPagos.length === 0 ? (
            <MensajeVacio />
          ) : (
            <Tabla datos={ultimosPagos} tipo="pago" formatFecha={formatFecha} formatPesos={formatPesos} />
          )}
        </ContenedorTabla>

        {/* TABLA: Últimos Ingresos Varios */}
        <ContenedorTabla titulo="Últimos Ingresos Varios">
          {ultimosIngresos.length === 0 ? (
            <MensajeVacio />
          ) : (
            <Tabla datos={ultimosIngresos} tipo="ingreso" formatFecha={formatFecha} formatPesos={formatPesos} />
          )}
        </ContenedorTabla>

        {/* TABLA: Últimos Egresos */}
        <ContenedorTabla titulo="Últimos Egresos">
          {ultimosEgresos.length === 0 ? (
            <MensajeVacio />
          ) : (
            <Tabla datos={ultimosEgresos} tipo="egreso" formatFecha={formatFecha} formatPesos={formatPesos} />
          )}
        </ContenedorTabla>

      </div>
    </div>
  )
}

// Componentes Auxiliares para mantener el código limpio

function Tarjeta({ label, valor, color }) {
  return (
    <div style={{ 
      backgroundColor: '#ffffff', 
      border: '1px solid rgba(207, 181, 59, 0.2)', 
      borderRadius: '12px', 
      padding: '1.5rem', 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
    }}>
      <p style={{ fontSize: '11px', color: 'var(--color-gris)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>{label}</p>
      <p style={{ fontSize: '26px', fontWeight: '700', color: color, margin: 0, fontFamily: 'var(--font-montserrat)' }}>{valor}</p>
    </div>
  )
}

function ContenedorTabla({ titulo, children }) {
  return (
    <div style={{ 
      backgroundColor: '#ffffff', 
      border: '1px solid rgba(207, 181, 59, 0.2)', 
      borderRadius: '12px', 
      padding: '1.5rem',
      boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
    }}>
      <h3 style={{ fontSize: '13px', color: 'var(--color-institucional)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1.2rem', marginTop: 0 }}>
        {titulo}
      </h3>
      {children}
    </div>
  )
}

function MensajeVacio() {
  return <p style={{ fontSize: '13px', color: '#aaa', margin: 0 }}>Sin movimientos recientes.</p>
}

function Tabla({ datos, tipo, formatFecha, formatPesos }) {
  return (
    <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
      <tbody>
        {datos.map((item) => (
          <tr key={item.id} style={{ borderBottom: '1px solid #f0efe9' }}>
            <td style={{ padding: '10px 0', color: 'var(--color-gris)', width: '45px', fontSize: '12px' }}>
              {formatFecha(item.fecha)}
            </td>
            <td style={{ padding: '10px', color: 'var(--color-institucional)', fontWeight: '500' }}>
              {tipo === 'pago' ? `${item.hermanos?.apellido}, ${item.hermanos?.nombre}` : item.descripcion}
            </td>
            <td style={{ 
              padding: '10px 0', 
              textAlign: 'right', 
              fontWeight: '600', 
              color: tipo === 'egreso' ? '#B33A3A' : '#4A8516' 
            }}>
              {tipo === 'egreso' ? '- ' : ''}{formatPesos(item.monto)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}