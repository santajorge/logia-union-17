'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Send } from 'lucide-react' // Opcional: un ícono lindo para el botón

export default function DashboardTesoro() {
  // --- LÓGICA DE NOTIFICACIONES ---
  const [enviando, setEnviando] = useState(false)

  const handleEnviarRecordatorios = async () => {
    // Alerta para evitar que se envíe por hacer un clic accidental
    if (!window.confirm('¿Estás seguro de enviar el Estado de Cuenta actual a TODOS los hermanos activos?')) return;
    
    setEnviando(true)
    try {
      // Reemplazá 'TU_CRON_SECRET' por la contraseña que tengas en tu .env.local
      // Ej: logia763sanitas2025
      const response = await fetch('/api/tesoreria/notificar?secret=logia763sanitas2025')
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
  // --------------------------------
  // Sumamos balanceHistorico al estado inicial
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

      // Traemos TODO el historial (solo monto y fecha para que sea súper rápido)
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

  if (cargando) return <p style={{ fontSize: '13px', color: '#888' }}>Calculando finanzas...</p>

  const balanceMensual = stats.ingresosMes - stats.egresosMes;

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '500', color: '#1a1a2e', marginBottom: '4px' }}>Dashboard de Tesorería</h1>
        <p style={{ fontSize: '13px', color: '#888' }}>Resumen financiero de {mesActual} (E.·. V.·.) y estado general del Taller.</p>
      </div>

      {/* BOTÓN DE ENVIAR ESTADOS DE CUENTA */}
        <button 
          onClick={handleEnviarRecordatorios} 
          disabled={enviando} 
          style={{ 
            backgroundColor: '#1a1a2e', 
            color: '#CDA434', 
            padding: '10px 20px', 
            borderRadius: '8px', 
            border: '1px solid #CDA434', 
            cursor: enviando ? 'not-allowed' : 'pointer', 
            fontWeight: '600', 
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            opacity: enviando ? 0.7 : 1,
            transition: 'all 0.2s',
            marginBottom: '2.5rem' /* <--- ACÁ ESTÁ EL AIRE QUE FALTABA */
          }}
        >
          <Send size={16} />
          {enviando ? 'Enviando correos...' : 'Notificar Estados de Cuenta'}
        </button>

      {/* GRID DE TARJETAS ACTUALIZADO CON FONDO TOTAL */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <Tarjeta label="Fondo en Caja (Total)" valor={formatPesos(stats.balanceHistorico)} color="#1a1a2e" />
        <Tarjeta label="Hermanos Activos" valor={stats.activos} color="#1a1a2e" />
        <Tarjeta label="Deuda a Recuperar" valor={formatPesos(stats.deudaTotal)} color="#A32D2D" />
        <Tarjeta label="Ingresos del Mes" valor={formatPesos(stats.ingresosMes)} color="#3B6D11" />
        <Tarjeta label="Egresos del Mes" valor={formatPesos(stats.egresosMes)} color="#A32D2D" />
        <Tarjeta label="Balance del Mes" valor={formatPesos(balanceMensual)} color={balanceMensual >= 0 ? '#3B6D11' : '#A32D2D'} />
      </div>

      {/* BLOQUE DE ACTIVIDAD RECIENTE */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        
        {/* TABLA: Últimos Pagos de Cápitas */}
        <div style={{ backgroundColor: '#ffffff', border: '0.5px solid #e8e6e0', borderRadius: '12px', padding: '1.25rem' }}>
          <h3 style={{ fontSize: '12px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem', marginTop: 0 }}>Últimos Pagos de Cápitas</h3>
          {ultimosPagos.length === 0 ? (
            <p style={{ fontSize: '12px', color: '#aaa' }}>Sin movimientos recientes.</p>
          ) : (
            <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
              <tbody>
                {ultimosPagos.map((p) => (
                  <tr key={p.id} style={{ borderBottom: '0.5px solid #f0efe9' }}>
                    <td style={{ padding: '8px 0', color: '#888', width: '40px' }}>{formatFecha(p.fecha)}</td>
                    <td style={{ padding: '8px', color: '#1a1a2e', fontWeight: '500' }}>{p.hermanos?.apellido}, {p.hermanos?.nombre}</td>
                    <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: '600', color: '#3B6D11' }}>{formatPesos(p.monto)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* TABLA: Últimos Ingresos Varios */}
        <div style={{ backgroundColor: '#ffffff', border: '0.5px solid #e8e6e0', borderRadius: '12px', padding: '1.25rem' }}>
          <h3 style={{ fontSize: '12px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem', marginTop: 0 }}>Últimos Ingresos Varios</h3>
          {ultimosIngresos.length === 0 ? (
            <p style={{ fontSize: '12px', color: '#aaa' }}>Sin movimientos recientes.</p>
          ) : (
            <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
              <tbody>
                {ultimosIngresos.map((i) => (
                  <tr key={i.id} style={{ borderBottom: '0.5px solid #f0efe9' }}>
                    <td style={{ padding: '8px 0', color: '#888', width: '40px' }}>{formatFecha(i.fecha)}</td>
                    <td style={{ padding: '8px', color: '#1a1a2e' }}>{i.descripcion}</td>
                    <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: '600', color: '#3B6D11' }}>{formatPesos(i.monto)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* TABLA: Últimos Egresos */}
        <div style={{ backgroundColor: '#ffffff', border: '0.5px solid #e8e6e0', borderRadius: '12px', padding: '1.25rem' }}>
          <h3 style={{ fontSize: '12px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem', marginTop: 0 }}>Últimos Egresos</h3>
          {ultimosEgresos.length === 0 ? (
            <p style={{ fontSize: '12px', color: '#aaa' }}>Sin movimientos recientes.</p>
          ) : (
            <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
              <tbody>
                {ultimosEgresos.map((e) => (
                  <tr key={e.id} style={{ borderBottom: '0.5px solid #f0efe9' }}>
                    <td style={{ padding: '8px 0', color: '#888', width: '40px' }}>{formatFecha(e.fecha)}</td>
                    <td style={{ padding: '8px', color: '#1a1a2e' }}>{e.descripcion}</td>
                    <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: '600', color: '#A32D2D' }}>- {formatPesos(e.monto)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </div>
  )
}

function Tarjeta({ label, valor, color }) {
  return (
    <div style={{ backgroundColor: '#ffffff', border: '0.5px solid #e8e6e0', borderRadius: '12px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <p style={{ fontSize: '12px', color: '#888', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>{label}</p>
      <p style={{ fontSize: '24px', fontWeight: '600', color: color, margin: 0 }}>{valor}</p>
    </div>
  )
}