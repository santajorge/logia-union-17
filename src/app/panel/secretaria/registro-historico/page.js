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

  if (cargando) return <p style={{ padding: '2rem', color: '#888' }}>Abriendo los archivos del Taller...</p>

  // PANTALLA DE BLOQUEO PARA CURIOSOS
  if (accesoDenegado) {
    return (
      <div style={{ padding: '4rem 2rem', textAlign: 'center', maxWidth: '500px', margin: '0 auto' }}>
        <ShieldAlert size={56} color="#A32D2D" style={{ marginBottom: '1.5rem' }} />
        <h2 style={{ fontSize: '24px', color: '#1a1a2e', marginBottom: '8px' }}>Acceso Restringido</h2>
        <p style={{ color: '#666', lineHeight: '1.6' }}>
          El <strong>Registro Histórico de Resoluciones</strong> contiene información sensible y disciplinaria. Su lectura está reservada exclusivamente para el Venerable Maestro y el Secretario del Taller.
        </p>
        <Link href="/panel" style={{ display: 'inline-block', marginTop: '2rem', padding: '10px 20px', backgroundColor: '#1a1a2e', color: '#fff', borderRadius: '8px', textDecoration: 'none', fontWeight: '500' }}>
          Volver al Inicio
        </Link>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '1000px' }}>
      
      {/* CABECERA */}
      <div style={{ marginBottom: '2rem', borderBottom: '1px solid #e8e6e0', paddingBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <BookOpen size={28} color="#1a1a2e" />
          <h1 style={{ fontSize: '26px', fontWeight: '600', color: '#1a1a2e', margin: 0 }}>
            Registro Histórico de Resoluciones
          </h1>
        </div>
        <p style={{ fontSize: '14px', color: '#666', margin: 0, maxWidth: '700px' }}>
          Archivo permanente de bajas, renuncias, suspensiones y rechazos de candidatos. 
          <span style={{ color: '#A32D2D', fontWeight: '500', marginLeft: '6px' }}>Documento de consulta estrictamente confidencial.</span>
        </p>
      </div>

      {registros.length === 0 ? (
        <div style={{ backgroundColor: '#ffffff', border: '1px dashed #c8c5b8', borderRadius: '12px', padding: '3rem', textAlign: 'center' }}>
          <p style={{ color: '#888', margin: 0 }}>El Registro Histórico se encuentra en blanco.</p>
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
              <div key={reg.id} style={{ backgroundColor: '#ffffff', border: '1px solid #e8e6e0', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
                
                {/* ENCABEZADO DE LA TARJETA */}
                <div style={{ backgroundColor: '#fafaf8', padding: '1rem 1.5rem', borderBottom: '1px solid #e8e6e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {esHermano ? <UserMinus size={18} color="#A32D2D" /> : <UserX size={18} color="#854F0B" />}
                    <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1a1a2e', margin: 0 }}>
                      {nombreCompleto}
                    </h3>
                    <span style={{ fontSize: '11px', fontWeight: '600', padding: '3px 8px', borderRadius: '6px', backgroundColor: esHermano ? '#FCEBEB' : '#FAEEDA', color: esHermano ? '#A32D2D' : '#854F0B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {esHermano ? 'Baja de Hermano' : 'Candidato Rechazado'}
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '16px', color: '#666', fontSize: '13px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CalendarDays size={14} /> {new Date(reg.fecha_resolucion + 'T00:00:00').toLocaleDateString('es-AR')}
                    </div>
                    {reg.acta_nro && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '500', color: '#1a1a2e' }}>
                        <FileText size={14} /> Acta N° {reg.acta_nro}
                      </div>
                    )}
                  </div>
                </div>

                {/* CUERPO DEL MOTIVO */}
                <div style={{ padding: '1.5rem' }}>
                  <h4 style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px' }}>
                    Motivo de la Resolución / Fundamentos
                  </h4>
                  <p style={{ fontSize: '14px', color: '#1a1a2e', margin: 0, lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
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