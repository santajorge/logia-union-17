'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { User, Shield, CreditCard, FileText, CheckCircle, Clock, AlertCircle, BookOpen } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

export default function MiPerfilPage() {
  const [perfil, setPerfil] = useState(null)
  const [cargando, setCargando] = useState(true)

  const { usuario, cargandoAuth } = useAuth()

  const cargarDatosPerfil = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('hermanos')
        .select(`
          id, nombre, apellido, email, telefono, grado, saldo,
          fecha_iniciacion, fecha_aumento, fecha_exaltacion, created_at,
          pagos (id, monto, fecha),
          planchas (id, titulo, estado, fecha_presentacion, fecha_lectura),
          asistencia_instrucciones (
            presente,
            instrucciones (titulo, fecha)
          ),
          asistencias (
            estado,
            tenidas (fecha, tipo)
          )
        `)
        .eq('email', usuario?.email)
        .single()

      if (error) throw error

      if (data) {
        // --- TESORERÍA (Ahora mira el Saldo Real) ---
        const estaAlDia = data.saldo >= 0; // Si es 0 o mayor, está a plomo
        
        let ultimoMesPagoStr = 'Sin registros'
        const pagos = data.pagos || []
        if (pagos.length > 0) {
          const pagosOrdenados = pagos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
          const ultimoPago = pagosOrdenados
          // Corrección en la lectura de la fecha
          const [yyyy, mm] = ultimoPago.fecha.split('T').split('-')
          ultimoMesPagoStr = `${mm}/${yyyy}`
        }

        // --- TRAZADOS ---
        const planchas = data.planchas || []
        
        // --- ASISTENCIA A INSTRUCCIONES (Solo importan para G1 y G2) ---
        const asistenciasInst = data.asistencia_instrucciones || []
        const clasesTotales = asistenciasInst.length
        const clasesPresente = asistenciasInst.filter(a => a.presente).length
        const porcentajeInstruccion = clasesTotales > 0 ? Math.round((clasesPresente / clasesTotales) * 100) : 0

        // --- ASISTENCIA A TENIDAS (Importa para todos) ---
        const asistenciasTenidas = data.asistencias || []
        const tenidasTotales = asistenciasTenidas.length
        // Asumimos que el estado guardado es 'Presente' (Ajustalo si usás otra palabra)
        const tenidasPresente = asistenciasTenidas.filter(a => a.estado?.toLowerCase() === 'presente').length
        const porcentajeTenidas = tenidasTotales > 0 ? Math.round((tenidasPresente / tenidasTotales) * 100) : 0

        setPerfil({
          ...data,
          resumen: {
            estaAlDia,
            ultimoMesPago: ultimoMesPagoStr,
            planchasTotales: planchas.length,
            planchasLeidas: planchas.filter(p => p.estado === 'leida').length,
            planchasBajoMallete: planchas.filter(p => p.estado === 'bajo_mallete').length,
            clasesTotales,
            clasesPresente,
            porcentajeInstruccion,
            tenidasTotales,
            tenidasPresente,
            porcentajeTenidas
          }
        })
      }
    } catch (error) {
      console.error("Error al cargar el perfil:", error.message)
    } finally {
      setCargando(false)
    }
  }, [usuario?.email])

  // ESTO SE HABÍA BORRADO: Es lo que da la orden de buscar los datos
  useEffect(() => {
    if (usuario?.email) {
      cargarDatosPerfil()
    }
  }, [cargarDatosPerfil, usuario])

  // Si está cargando el login o los datos del perfil, mostramos el mensaje
  if (cargandoAuth || cargando) return <div style={{ padding: '3rem', textAlign: 'center', color: '#666' }}>Buscando tu expediente en Secretaría...</div>
  if (!perfil) return <div style={{ padding: '3rem', textAlign: 'center', color: '#A32D2D', fontWeight: '600' }}>No se pudo encontrar tu registro. Verificá que tu email esté correcto.</div>
  
  return (
    <div style={{ maxWidth: '1000px', paddingBottom: '3rem' }}>
      {/* Cabecera del Perfil */}
      <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '20px', paddingBottom: '1.5rem', borderBottom: '1px solid #e8e6e0' }}>
        <div style={{ width: '80px', height: '80px', backgroundColor: '#fafaf8', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #CDA434' }}>
          <User size={40} color="#1a1a2e" />
        </div>
        <div>
          <h1 style={{ fontSize: '28px', color: '#1a1a2e', margin: '0 0 4px', fontWeight: '600' }}>{perfil.nombre} {perfil.apellido}</h1>
          <p style={{ color: '#666', margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '500' }}>
            <Shield size={16} color="#CDA434" /> 
            {perfil.grado === 1 ? 'Aprendiz Masón' : perfil.grado === 2 ? 'Compañero Masón' : 'Maestro Masón'}
          </p>
        </div>
      </div>

      {/* Grid de Tarjetas de Estado */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        
        {/* Tarjeta de Tesorería */}
        <div style={{ backgroundColor: '#fff', border: '1px solid #e8e6e0', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '13px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0, fontWeight: '600' }}>Tesorería</h3>
            <CreditCard size={18} color="#CDA434" />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            {perfil.resumen.estaAlDia ? (
              <CheckCircle color="#3B6D11" size={28} />
            ) : (
              <AlertCircle color="#A32D2D" size={28} />
            )}
            <span style={{ fontSize: '20px', fontWeight: '600', color: perfil.resumen.estaAlDia ? '#27500A' : '#A32D2D' }}>
              {perfil.resumen.estaAlDia ? 'A Plomo' : 'Deuda Pendiente'}
            </span>
          </div>
          <div style={{ backgroundColor: '#fafaf8', padding: '10px 12px', borderRadius: '8px', border: '1px solid #f0efe9', marginBottom: perfil.resumen.estaAlDia ? '0' : '12px' }}>
             <p style={{ fontSize: '13px', color: '#666', margin: 0, display: 'flex', justifyContent: 'space-between' }}>
               <span>Último mes abonado:</span>
               <strong style={{ color: '#1a1a2e' }}>{perfil.resumen.ultimoMesPago}</strong>
             </p>
          </div>
          {!perfil.resumen.estaAlDia && (
            <p style={{ fontSize: '11px', color: '#888', margin: 'auto 0 0', textAlign: 'center', fontStyle: 'italic' }}>
              Para regularizar tu situación, comunicate con el H.·. Tesorero.
            </p>
          )}
        </div>

        {/* Tarjeta de Carrera Masónica */}
        <div style={{ backgroundColor: '#fff', border: '1px solid #e8e6e0', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '13px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0, fontWeight: '600' }}>Progresión</h3>
            <Clock size={18} color="#CDA434" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f0efe9', paddingBottom: '8px' }}>
               <span style={{ fontSize: '13px', color: '#666' }}>Iniciación</span>
               <strong style={{ fontSize: '14px', color: '#1a1a2e' }}>{perfil.fecha_iniciacion ? new Date(perfil.fecha_iniciacion + 'T00:00:00').toLocaleDateString('es-AR') : 'Pendiente'}</strong>
             </div>
             
             {perfil.grado >= 2 && (
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f0efe9', paddingBottom: '8px' }}>
                 <span style={{ fontSize: '13px', color: '#666' }}>Aumento de Salario</span>
                 <strong style={{ fontSize: '14px', color: '#1a1a2e' }}>{perfil.fecha_aumento ? new Date(perfil.fecha_aumento + 'T00:00:00').toLocaleDateString('es-AR') : 'Pendiente'}</strong>
               </div>
             )}
             
             {perfil.grado >= 3 && (
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 <span style={{ fontSize: '13px', color: '#666' }}>Exaltación</span>
                 <strong style={{ fontSize: '14px', color: '#1a1a2e' }}>{perfil.fecha_exaltacion ? new Date(perfil.fecha_exaltacion + 'T00:00:00').toLocaleDateString('es-AR') : 'Pendiente'}</strong>
               </div>
             )}
          </div>
        </div>

        {/* Tarjeta de Asistencia a Tenidas (Visible para TODOS) */}
        <div style={{ backgroundColor: '#fff', border: '1px solid #e8e6e0', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '13px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0, fontWeight: '600' }}>Asistencia a Tenidas</h3>
            <BookOpen size={18} color="#CDA434" />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
             <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: `conic-gradient(#3B6D11 ${perfil.resumen.porcentajeTenidas}%, #f0efe9 0)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: '52px', height: '52px', backgroundColor: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '14px', fontWeight: '700', color: '#1a1a2e' }}>{perfil.resumen.porcentajeTenidas}%</span>
                </div>
             </div>
             <div>
               <p style={{ fontSize: '15px', fontWeight: '600', color: '#1a1a2e', margin: '0 0 2px' }}>Asistencia Global</p>
               {perfil.resumen.tenidasTotales > 0 ? (
                 <p style={{ fontSize: '12px', color: '#666', margin: 0 }}>Has asistido a <strong>{perfil.resumen.tenidasPresente}</strong> de {perfil.resumen.tenidasTotales} tenidas.</p>
               ) : (
                 <p style={{ fontSize: '12px', color: '#888', margin: 0 }}>Aún no hay tenidas registradas.</p>
               )}
             </div>
          </div>
        </div>

        {/* Tarjeta de Asistencia a Instrucción (SOLO GRADO 1 y 2) */}
        {perfil.grado < 3 && (
          <div style={{ backgroundColor: '#fff', border: '1px solid #e8e6e0', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '13px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0, fontWeight: '600' }}>Instrucción</h3>
              <BookOpen size={18} color="#CDA434" />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
               <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: `conic-gradient(#3B6D11 ${perfil.resumen.porcentajeInstruccion}%, #f0efe9 0)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: '52px', height: '52px', backgroundColor: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '14px', fontWeight: '700', color: '#1a1a2e' }}>{perfil.resumen.porcentajeInstruccion}%</span>
                  </div>
               </div>
               <div>
                 <p style={{ fontSize: '15px', fontWeight: '600', color: '#1a1a2e', margin: '0 0 2px' }}>Cámara de Instrucción</p>
                 {perfil.resumen.clasesTotales > 0 ? (
                   <p style={{ fontSize: '12px', color: '#666', margin: 0 }}>Has asistido a <strong>{perfil.resumen.clasesPresente}</strong> de {perfil.resumen.clasesTotales} clases.</p>
                 ) : (
                   <p style={{ fontSize: '12px', color: '#888', margin: 0 }}>Aún no hay clases registradas.</p>
                 )}
               </div>
            </div>
          </div>
        )}

        {/* Tarjeta de Trabajos y Planchas */}
        <div style={{ backgroundColor: '#fff', border: '1px solid #e8e6e0', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '13px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0, fontWeight: '600' }}>Trazados</h3>
            <FileText size={18} color="#CDA434" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: perfil.resumen.planchasBajoMallete > 0 ? '1fr 1fr 1fr' : '1fr 1fr', gap: '10px', textAlign: 'center' }}>
            <div style={{ backgroundColor: '#fafaf8', padding: '12px', borderRadius: '8px', border: '1px solid #f0efe9' }}>
              <p style={{ fontSize: '22px', fontWeight: '700', color: '#1a1a2e', margin: '0 0 4px' }}>{perfil.resumen.planchasTotales}</p>
              <p style={{ fontSize: '10px', color: '#888', margin: 0, fontWeight: '600' }}>TOTALES</p>
            </div>
            <div style={{ backgroundColor: '#EAF3DE', padding: '12px', borderRadius: '8px', border: '1px solid #b8d598' }}>
              <p style={{ fontSize: '22px', fontWeight: '700', color: '#27500A', margin: '0 0 4px' }}>{perfil.resumen.planchasLeidas}</p>
              <p style={{ fontSize: '10px', color: '#3B6D11', margin: 0, fontWeight: '600' }}>LEÍDOS</p>
            </div>
            {perfil.resumen.planchasBajoMallete > 0 && (
              <div style={{ backgroundColor: '#FCEBEB', padding: '12px', borderRadius: '8px', border: '1px solid #F8D7D7' }}>
                <p style={{ fontSize: '22px', fontWeight: '700', color: '#A32D2D', margin: '0 0 4px' }}>{perfil.resumen.planchasBajoMallete}</p>
                <p style={{ fontSize: '10px', color: '#A32D2D', margin: 0, fontWeight: '600' }}>RECHAZADOS</p>
              </div>
            )}
          </div>
        </div>
      </div> {/* <-- FIN DEL GRID DE TARJETAS */}

      {/* SECCIÓN DE BIBLIOTECAS DE ESTUDIO */}
      <div style={{ marginTop: '2.5rem' }}>
        <h3 style={{ fontSize: '18px', color: '#1a1a2e', marginBottom: '1.2rem', fontWeight: '600' }}>Biblioteca de Instrucción</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
          {/* Biblioteca de Aprendiz (Visible para todos) */}
          {perfil.grado >= 1 && (
            <a href="#" target="_blank" rel="noreferrer" style={estiloBotonBiblioteca}>
              <div style={estiloIconoBiblio}><BookOpen size={20} /></div>
              <div style={{ textAlign: 'left' }}>
                <p style={estiloTituloBiblio}>Primer Grado</p>
                <p style={estiloSubBiblio}>Cámara de Aprendiz</p>
              </div>
            </a>
          )}

          {/* Biblioteca de Compañero (Visible solo para Grado 2 y 3) */}
          {perfil.grado >= 2 && (
            <a href="#" target="_blank" rel="noreferrer" style={estiloBotonBiblioteca}>
              <div style={estiloIconoBiblio}><BookOpen size={20} /></div>
              <div style={{ textAlign: 'left' }}>
                <p style={estiloTituloBiblio}>Segundo Grado</p>
                <p style={estiloSubBiblio}>Cámara de Compañero</p>
              </div>
            </a>
          )}

          {/* Biblioteca de Maestro (Visible solo para Grado 3) */}
          {perfil.grado >= 3 && (
            <a href="#" target="_blank" rel="noreferrer" style={estiloBotonBiblioteca}>
              <div style={estiloIconoBiblio}><BookOpen size={20} /></div>
              <div style={{ textAlign: 'left' }}>
                <p style={estiloTituloBiblio}>Tercer Grado</p>
                <p style={estiloSubBiblio}>Cámara de Maestro</p>
              </div>
            </a>
          )}
        </div>
      </div>

    </div>
  )
} // <-- ACÁ CIERRA CORRECTAMENTE EL COMPONENTE

// --- ESTILOS DE LA BIBLIOTECA (Se colocan fuera de la función principal) ---
const estiloBotonBiblioteca = {
  display: 'flex',
  alignItems: 'center',
  gap: '15px',
  padding: '1rem',
  backgroundColor: '#fff',
  border: '1px solid #e8e6e0',
  borderRadius: '12px',
  textDecoration: 'none',
  color: '#1a1a2e',
  transition: 'all 0.2s ease',
  boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
}

const estiloIconoBiblio = {
  width: '40px',
  height: '40px',
  backgroundColor: '#f0efe9',
  borderRadius: '8px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#CDA434'
}

const estiloTituloBiblio = {
  margin: 0,
  fontSize: '14px',
  fontWeight: '600'
}

const estiloSubBiblio = {
  margin: 0,
  fontSize: '11px',
  color: '#888',
  textTransform: 'uppercase'
}