'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { BookOpen, ShieldAlert, UserX, UserMinus, CalendarDays, FileText } from 'lucide-react'

export default function RegistroHistoricoPage() {
  const [registros, setRegistros] = useState([])
  const [cargando, setCargando] = useState(true)
  const [accesoDenegado, setAccesoDenegado] = useState(false)

  useEffect(() => {
    async function cargarRegistro() {
      // 1. Validar quién intenta entrar
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) return

      const { data: perfil } = await supabase
        .from('hermanos')
        .select('rol_oficial')
        .eq('user_id', session.user.id)
        .single()

      // Filtro de seguridad estricto
      if (perfil?.rol_oficial !== 'Secretario' && perfil?.rol_oficial !== 'Venerable Maestro') {
        setAccesoDenegado(true)
        setCargando(false)
        return
      }

      // 2. Traer los datos cruzando las tablas para obtener los nombres
      const { data, error } = await supabase
        .from('libro_negro')
        .select(`
          id, 
          tipo_de_registro, 
          fecha_resolucion, 
          acta_nro, 
          motivo,
          hermanos (nombre, apellido),
          candidatos (nombre, apellido)
        `)
        .order('fecha_resolucion', { ascending: false })

      if (data) setRegistros(data)
      setCargando(false)
    }

    cargarRegistro()
  }, [])

  if (cargando) return <p style={{ padding: '2rem', color: 'var(--color-gris)', fontFamily: 'var(--font-montserrat)' }}>Abriendo los archivos del Taller...</p>

  // PANTALLA DE BLOQUEO PARA CURIOSOS
  if (accesoDenegado) {
    return (
      <div style={{ padding: '4rem 2rem', textAlign: 'center', maxWidth: '550px', margin: '0 auto', fontFamily: 'var(--font-montserrat)' }}>
        <ShieldAlert size={64} color="#B33A3A" style={{ marginBottom: '1.5rem' }} />
        <h2 style={{ fontSize: '28px', color: 'var(--color-institucional)', marginBottom: '12px', fontFamily: 'var(--font-baskerville)', fontWeight: '600' }}>Acceso Restringido</h2>
        <p style={{ color: 'var(--color-gris)', lineHeight: '1.6', fontSize: '15px' }}>
          El <strong>Registro Histórico de Resoluciones</strong> contiene información sensible y disciplinaria. Su lectura está reservada exclusivamente para el Venerable Maestro y el Secretario del Taller.
        </p>
        <Link 
          href="/panel" 
          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginTop: '2.5rem', padding: '12px 24px', backgroundColor: 'var(--color-institucional)', color: 'var(--color-oro)', border: '1px solid var(--color-oro)', borderRadius: '8px', textDecoration: 'none', fontWeight: '600', transition: 'all 0.2s', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}
          onMouseOver={e => e.currentTarget.style.backgroundColor = '#111122'}
          onMouseOut={e => e.currentTarget.style.backgroundColor = 'var(--color-institucional)'}
        >
          Volver al Inicio
        </Link>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '1000px', fontFamily: 'var(--font-montserrat)' }}>
      
      {/* CABECERA */}
      <div style={{ marginBottom: '2.5rem', borderBottom: '1px solid rgba(207, 181, 59, 0.2)', paddingBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <BookOpen size={28} color="var(--color-oro)" />
          <h1 style={{ fontSize: '28px', fontWeight: '600', color: 'var(--color-institucional)', margin: 0, fontFamily: 'var(--font-baskerville)' }}>
            Registro Histórico de Resoluciones
          </h1>
        </div>
        <p style={{ fontSize: '14px', color: 'var(--color-gris)', margin: 0, maxWidth: '750px', lineHeight: '1.5' }}>
          Archivo permanente de bajas, renuncias, suspensiones y rechazos de candidatos. 
          <span style={{ color: '#B33A3A', fontWeight: '600', marginLeft: '6px' }}>Documento de consulta estrictamente confidencial.</span>
        </p>
      </div>

      {registros.length === 0 ? (
        <div style={{ backgroundColor: '#ffffff', border: '1px dashed #d1d0c8', borderRadius: '12px', padding: '3.5rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--color-gris)', margin: 0, fontSize: '14px' }}>El Registro Histórico se encuentra en blanco.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {registros.map(reg => {
            
            // Lógica para saber de quién estamos hablando
            const esHermano = reg.tipo_de_registro === 'hermano'
            const nombreCompleto = esHermano 
              ? `${reg.hermanos?.apellido}, ${reg.hermanos?.nombre}`
              : `${reg.candidatos?.apellido}, ${reg.candidatos?.nombre}`
            
            return (
              <div key={reg.id} style={{ backgroundColor: '#ffffff', border: '1px solid rgba(207, 181, 59, 0.2)', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', transition: 'transform 0.2s, box-shadow 0.2s' }} onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 12px rgba(0,0,0,0.06)' }} onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.03)' }}>
                
                {/* ENCABEZADO DE LA TARJETA */}
                <div style={{ backgroundColor: '#fafaf8', padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(207, 181, 59, 0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {esHermano ? <UserMinus size={18} color="#B33A3A" /> : <UserX size={18} color="#854F0B" />}
                    <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--color-institucional)', margin: 0 }}>
                      {nombreCompleto}
                    </h3>
                    <span style={{ fontSize: '11px', fontWeight: '700', padding: '4px 10px', borderRadius: '6px', backgroundColor: esHermano ? '#FCEBEB' : '#FFF4E5', color: esHermano ? '#B33A3A' : '#854F0B', border: `1px solid ${esHermano ? '#F8D7D7' : '#F3DDBA'}`, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {esHermano ? 'Baja de Hermano' : 'Candidato Rechazado'}
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '16px', color: 'var(--color-gris)', fontSize: '13px', fontWeight: '500' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CalendarDays size={14} color="var(--color-oro)" /> {new Date(reg.fecha_resolucion + 'T00:00:00').toLocaleDateString('es-AR')}
                    </div>
                    {reg.acta_nro && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600', color: 'var(--color-institucional)' }}>
                        <FileText size={14} color="var(--color-oro)" /> Acta N° {reg.acta_nro}
                      </div>
                    )}
                  </div>
                </div>

                {/* CUERPO DEL MOTIVO */}
                <div style={{ padding: '1.5rem' }}>
                  <h4 style={{ fontSize: '11px', color: 'var(--color-institucional)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 10px' }}>
                    Motivo de la Resolución / Fundamentos
                  </h4>
                  <p style={{ fontSize: '14px', color: 'var(--color-gris)', margin: 0, lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                    {reg.motivo}
                  </p>
                </div>

              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}