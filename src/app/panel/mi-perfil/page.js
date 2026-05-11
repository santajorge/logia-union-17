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
      // 1. Traemos los datos del hermano (SIN pedir los pagos anidados)
      const { data, error } = await supabase
        .from('hermanos')
        .select(`
          id, nombre, apellido, email, telefono, grado, saldo,
          fecha_iniciacion, fecha_aumento, fecha_exaltacion, created_at,
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
        // --- NUEVA LÓGICA INFALIBLE PARA EL ÚLTIMO PAGO ---
        const estaAlDia = data.saldo >= 0; 
        let ultimoMesPagoStr = 'Sin registros'

        // Le preguntamos DIRECTAMENTE a la tabla pagos, pidiendo que la base de datos ordene
        const { data: pagosData, error: errPagos } = await supabase
          .from('pagos')
          .select('fecha')
          .eq('hermano_id', data.id)
          .order('fecha', { ascending: false })
          .limit(1)

        // Si encontró un pago, sacamos el mes y el año
        if (!errPagos && pagosData && pagosData.length > 0 && pagosData.fecha) {
          const fechaLimpia = pagosData.fecha.split('T')
          const [yyyy, mm] = fechaLimpia.split('-')
          ultimoMesPagoStr = `${mm}/${yyyy}`
        }

        // --- TRAZADOS ---
        const planchas = data.planchas || []
        
        // --- ASISTENCIA A INSTRUCCIONES ---
        const asistenciasInst = data.asistencia_instrucciones || []
        const clasesTotales = asistenciasInst.length
        const clasesPresente = asistenciasInst.filter(a => a.presente).length
        const porcentajeInstruccion = clasesTotales > 0 ? Math.round((clasesPresente / clasesTotales) * 100) : 0

        // --- ASISTENCIA A TENIDAS ---
        const asistenciasTenidas = data.asistencias || []
        const tenidasTotales = asistenciasTenidas.length
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

  useEffect(() => {
    if (usuario?.email) {
      cargarDatosPerfil()
    }
  }, [cargarDatosPerfil, usuario])

  if (cargandoAuth || cargando) return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-gris)', fontFamily: 'var(--font-montserrat)' }}>Buscando tu expediente en Secretaría...</div>
  if (!perfil) return <div style={{ padding: '3rem', textAlign: 'center', color: '#B33A3A', fontWeight: '600', fontFamily: 'var(--font-montserrat)' }}>No se pudo encontrar tu registro. Verificá que tu email esté correcto.</div>
  
  return (
    <div style={{ maxWidth: '1000px', paddingBottom: '3rem', fontFamily: 'var(--font-montserrat)' }}>
      {/* Cabecera del Perfil */}
      <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '20px', paddingBottom: '1.5rem', borderBottom: '1px solid rgba(207, 181, 59, 0.2)' }}>
        <div style={{ width: '80px', height: '80px', backgroundColor: '#fafaf8', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--color-oro)', boxShadow: '0 4px 10px rgba(207, 181, 59, 0.15)' }}>
          <User size={40} color="var(--color-institucional)" />
        </div>
        <div>
          <h1 style={{ fontSize: '30px', color: 'var(--color-institucional)', margin: '0 0 4px', fontWeight: '600', fontFamily: 'var(--font-baskerville)' }}>{perfil.nombre} {perfil.apellido}</h1>
          <p style={{ color: 'var(--color-gris)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: '500' }}>
            <Shield size={16} color="var(--color-oro)" /> 
            {perfil.grado === 1 ? 'Aprendiz Masón' : perfil.grado === 2 ? 'Compañero Masón' : 'Maestro Masón'}
          </p>
        </div>
      </div>

      {/* Grid de Tarjetas de Estado */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        
        {/* Tarjeta de Tesorería */}
        <div style={{ backgroundColor: '#fff', border: '1px solid rgba(207, 181, 59, 0.2)', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', borderBottom: '1px solid rgba(207, 181, 59, 0.15)', paddingBottom: '10px' }}>
            <h3 style={{ fontSize: '13px', color: 'var(--color-institucional)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0, fontWeight: '700' }}>Tesorería</h3>
            <CreditCard size={18} color="var(--color-oro)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            {perfil.resumen.estaAlDia ? (
              <CheckCircle color="#4A8516" size={28} />
            ) : (
              <AlertCircle color="#B33A3A" size={28} />
            )}
            <span style={{ fontSize: '20px', fontWeight: '700', color: perfil.resumen.estaAlDia ? '#4A8516' : '#B33A3A' }}>
              {perfil.resumen.estaAlDia ? 'A Plomo' : 'Deuda Pendiente'}
            </span>
          </div>
          <div style={{ backgroundColor: '#fafaf8', padding: '12px 14px', borderRadius: '8px', border: '1px solid #d1d0c8', marginBottom: perfil.resumen.estaAlDia ? '0' : '12px' }}>
             <p style={{ fontSize: '13px', color: 'var(--color-gris)', margin: 0, display: 'flex', justifyContent: 'space-between', fontWeight: '500' }}>
               <span>Último mes abonado:</span>
               <strong style={{ color: 'var(--color-institucional)' }}>{perfil.resumen.ultimoMesPago}</strong>
             </p>
          </div>
          {!perfil.resumen.estaAlDia && (
            <p style={{ fontSize: '12px', color: 'var(--color-gris)', margin: 'auto 0 0', textAlign: 'center', fontStyle: 'italic' }}>
              Para regularizar tu situación, comunicate con el H.·. Tesorero.
            </p>
          )}
        </div>

        {/* Tarjeta de Carrera Masónica */}
        <div style={{ backgroundColor: '#fff', border: '1px solid rgba(207, 181, 59, 0.2)', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', borderBottom: '1px solid rgba(207, 181, 59, 0.15)', paddingBottom: '10px' }}>
            <h3 style={{ fontSize: '13px', color: 'var(--color-institucional)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0, fontWeight: '700' }}>Progresión</h3>
            <Clock size={18} color="var(--color-oro)" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f0efe9', paddingBottom: '10px' }}>
               <span style={{ fontSize: '13px', color: 'var(--color-gris)', fontWeight: '500' }}>Iniciación</span>
               <strong style={{ fontSize: '14px', color: 'var(--color-institucional)' }}>{perfil.fecha_iniciacion ? new Date(perfil.fecha_iniciacion + 'T00:00:00').toLocaleDateString('es-AR') : 'Pendiente'}</strong>
             </div>
             
             {perfil.grado >= 2 && (
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f0efe9', paddingBottom: '10px' }}>
                 <span style={{ fontSize: '13px', color: 'var(--color-gris)', fontWeight: '500' }}>Aumento de Salario</span>
                 <strong style={{ fontSize: '14px', color: 'var(--color-institucional)' }}>{perfil.fecha_aumento ? new Date(perfil.fecha_aumento + 'T00:00:00').toLocaleDateString('es-AR') : 'Pendiente'}</strong>
               </div>
             )}
             
             {perfil.grado >= 3 && (
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 <span style={{ fontSize: '13px', color: 'var(--color-gris)', fontWeight: '500' }}>Exaltación</span>
                 <strong style={{ fontSize: '14px', color: 'var(--color-institucional)' }}>{perfil.fecha_exaltacion ? new Date(perfil.fecha_exaltacion + 'T00:00:00').toLocaleDateString('es-AR') : 'Pendiente'}</strong>
               </div>
             )}
          </div>
        </div>

        {/* Tarjeta de Asistencia a Tenidas */}
        <div style={{ backgroundColor: '#fff', border: '1px solid rgba(207, 181, 59, 0.2)', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', borderBottom: '1px solid rgba(207, 181, 59, 0.15)', paddingBottom: '10px' }}>
            <h3 style={{ fontSize: '13px', color: 'var(--color-institucional)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0, fontWeight: '700' }}>Asistencia a Tenidas</h3>
            <BookOpen size={18} color="var(--color-oro)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
             <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: `conic-gradient(#4A8516 ${perfil.resumen.porcentajeTenidas}%, #f0efe9 0)`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)' }}>
                <div style={{ width: '56px', height: '56px', backgroundColor: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '15px', fontWeight: '700', color: 'var(--color-institucional)' }}>{perfil.resumen.porcentajeTenidas}%</span>
                </div>
             </div>
             <div>
               <p style={{ fontSize: '16px', fontWeight: '700', color: 'var(--color-institucional)', margin: '0 0 4px' }}>Asistencia Global</p>
               {perfil.resumen.tenidasTotales > 0 ? (
                 <p style={{ fontSize: '13px', color: 'var(--color-gris)', margin: 0 }}>Has asistido a <strong>{perfil.resumen.tenidasPresente}</strong> de {perfil.resumen.tenidasTotales} tenidas.</p>
               ) : (
                 <p style={{ fontSize: '13px', color: '#ccc', margin: 0, fontStyle: 'italic' }}>Aún no hay tenidas registradas.</p>
               )}
             </div>
          </div>
        </div>

        {/* Tarjeta de Asistencia a Instrucción */}
        {perfil.grado < 3 && (
          <div style={{ backgroundColor: '#fff', border: '1px solid rgba(207, 181, 59, 0.2)', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', borderBottom: '1px solid rgba(207, 181, 59, 0.15)', paddingBottom: '10px' }}>
              <h3 style={{ fontSize: '13px', color: 'var(--color-institucional)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0, fontWeight: '700' }}>Instrucción</h3>
              <BookOpen size={18} color="var(--color-oro)" />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
               <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: `conic-gradient(#4A8516 ${perfil.resumen.porcentajeInstruccion}%, #f0efe9 0)`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)' }}>
                  <div style={{ width: '56px', height: '56px', backgroundColor: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '15px', fontWeight: '700', color: 'var(--color-institucional)' }}>{perfil.resumen.porcentajeInstruccion}%</span>
                  </div>
               </div>
               <div>
                 <p style={{ fontSize: '16px', fontWeight: '700', color: 'var(--color-institucional)', margin: '0 0 4px' }}>Cámara de Instrucción</p>
                 {perfil.resumen.clasesTotales > 0 ? (
                   <p style={{ fontSize: '13px', color: 'var(--color-gris)', margin: 0 }}>Has asistido a <strong>{perfil.resumen.clasesPresente}</strong> de {perfil.resumen.clasesTotales} clases.</p>
                 ) : (
                   <p style={{ fontSize: '13px', color: '#ccc', margin: 0, fontStyle: 'italic' }}>Aún no hay clases registradas.</p>
                 )}
               </div>
            </div>
          </div>
        )}

        {/* Tarjeta de Trabajos y Planchas */}
        <div style={{ backgroundColor: '#fff', border: '1px solid rgba(207, 181, 59, 0.2)', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', borderBottom: '1px solid rgba(207, 181, 59, 0.15)', paddingBottom: '10px' }}>
            <h3 style={{ fontSize: '13px', color: 'var(--color-institucional)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0, fontWeight: '700' }}>Trazados</h3>
            <FileText size={18} color="var(--color-oro)" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: perfil.resumen.planchasBajoMallete > 0 ? '1fr 1fr 1fr' : '1fr 1fr', gap: '12px', textAlign: 'center' }}>
            <div style={{ backgroundColor: '#fafaf8', padding: '14px 10px', borderRadius: '8px', border: '1px solid #d1d0c8' }}>
              <p style={{ fontSize: '24px', fontWeight: '700', color: 'var(--color-institucional)', margin: '0 0 4px' }}>{perfil.resumen.planchasTotales}</p>
              <p style={{ fontSize: '10px', color: 'var(--color-gris)', margin: 0, fontWeight: '700', letterSpacing: '0.05em' }}>TOTALES</p>
            </div>
            <div style={{ backgroundColor: '#EAF3DE', padding: '14px 10px', borderRadius: '8px', border: '1px solid #D4EAB6' }}>
              <p style={{ fontSize: '24px', fontWeight: '700', color: '#4A8516', margin: '0 0 4px' }}>{perfil.resumen.planchasLeidas}</p>
              <p style={{ fontSize: '10px', color: '#4A8516', margin: 0, fontWeight: '700', letterSpacing: '0.05em' }}>LEÍDOS</p>
            </div>
            {perfil.resumen.planchasBajoMallete > 0 && (
              <div style={{ backgroundColor: '#FCEBEB', padding: '14px 10px', borderRadius: '8px', border: '1px solid #F8D7D7' }}>
                <p style={{ fontSize: '24px', fontWeight: '700', color: '#B33A3A', margin: '0 0 4px' }}>{perfil.resumen.planchasBajoMallete}</p>
                <p style={{ fontSize: '10px', color: '#B33A3A', margin: 0, fontWeight: '700', letterSpacing: '0.05em' }}>RECHAZADOS</p>
              </div>
            )}
          </div>
        </div>
      </div> 

      {/* SECCIÓN DE BIBLIOTECAS DE ESTUDIO */}
      <div style={{ marginTop: '3rem' }}>
        <h3 style={{ fontSize: '22px', color: 'var(--color-institucional)', marginBottom: '1.5rem', fontWeight: '600', fontFamily: 'var(--font-baskerville)' }}>Biblioteca de Instrucción</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
          {perfil.grado >= 1 && (
            <a href="#" target="_blank" rel="noreferrer" style={estiloBotonBiblioteca}>
              <div style={estiloIconoBiblio}><BookOpen size={20} /></div>
              <div style={{ textAlign: 'left' }}>
                <p style={estiloTituloBiblio}>Primer Grado</p>
                <p style={estiloSubBiblio}>Cámara de Aprendiz</p>
              </div>
            </a>
          )}

          {perfil.grado >= 2 && (
            <a href="#" target="_blank" rel="noreferrer" style={estiloBotonBiblioteca}>
              <div style={estiloIconoBiblio}><BookOpen size={20} /></div>
              <div style={{ textAlign: 'left' }}>
                <p style={estiloTituloBiblio}>Segundo Grado</p>
                <p style={estiloSubBiblio}>Cámara de Compañero</p>
              </div>
            </a>
          )}

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
}

// --- ESTILOS DE LA BIBLIOTECA ---
const estiloBotonBiblioteca = {
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
  padding: '1.25rem',
  backgroundColor: '#fff',
  border: '1px solid rgba(207, 181, 59, 0.2)',
  borderRadius: '12px',
  textDecoration: 'none',
  color: 'var(--color-institucional)',
  transition: 'all 0.2s ease',
  boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
}

const estiloIconoBiblio = {
  width: '46px',
  height: '46px',
  backgroundColor: '#fafaf8',
  borderRadius: '10px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'var(--color-oro)',
  border: '1px solid rgba(207, 181, 59, 0.3)'
}

const estiloTituloBiblio = { margin: 0, fontSize: '15px', fontWeight: '700', color: 'var(--color-institucional)' }
const estiloSubBiblio = { margin: '2px 0 0', fontSize: '11px', color: 'var(--color-gris)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600' }