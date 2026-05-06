'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { Edit, ShieldAlert, CheckCircle2, Send, AlertTriangle, X } from 'lucide-react'

// Definimos las columnas de nuestro flujo activo con colores suaves Unión 17
const COLUMNAS = [
  { id: 'contacto', titulo: '1. Contacto Inicial', color: '#f4f3ed', border: '#d1d0c8' },
  { id: 'circulacion', titulo: '2. En Trámite GL', color: '#EAF3DE', border: '#D4EAB6' }, 
  { id: 'aplomacion', titulo: '3. Aplomación', color: '#FFF4E5', border: '#F3DDBA' },
  { id: 'aprobado', titulo: '4. Aprobados', color: '#E6F0FA', border: '#C6DDF2' }
]

export default function TableroCandidatos() {
  const [candidatos, setCandidatos] = useState([])
  const [cargando, setCargando] = useState(true)

  // Estados para el Modal de Rechazo (Registro Histórico)
  const [modalRechazo, setModalRechazo] = useState({ visible: false, candidato: null, motivo: '' })
  const [guardandoRechazo, setGuardandoRechazo] = useState(false)

  useEffect(() => {
    async function cargarCandidatos() {
      const { data, error } = await supabase
        .from('candidatos')
        .select('*')
        .in('estado', ['contacto', 'circulacion', 'aplomacion', 'aprobado'])
        .order('created_at', { ascending: false })

      if (!error && data) {
        setCandidatos(data)
      }
      setCargando(false)
    }

    cargarCandidatos()
  }, [])

  // --- LÓGICA DE DRAG & DROP ---
  const handleDragStart = (e, candidatoId) => {
    e.dataTransfer.setData('candidatoId', candidatoId)
    setTimeout(() => { e.target.style.opacity = '0.5' }, 0)
  }

  const handleDragEnd = (e) => {
    e.target.style.opacity = '1'
  }

  const handleDragOver = (e) => {
    e.preventDefault()
  }

  const handleDrop = async (e, nuevoEstado) => {
    e.preventDefault()
    const candidatoId = e.dataTransfer.getData('candidatoId')
    
    if (!candidatoId) return

    setCandidatos(prev => prev.map(c => c.id === candidatoId ? { ...c, estado: nuevoEstado } : c))

    const { error } = await supabase
      .from('candidatos')
      .update({ estado: nuevoEstado })
      .eq('id', candidatoId)

    if (error) {
      console.error('Error al mover candidato:', error)
      // Recargar si hay error
      const { data } = await supabase.from('candidatos').select('*').in('estado', ['contacto', 'circulacion', 'aplomacion', 'aprobado'])
      if (data) setCandidatos(data)
    }
  }

  // --- LÓGICA DE RECHAZO (REGISTRO HISTÓRICO) ---
  const confirmarRechazo = async (e) => {
    e.preventDefault()
    setGuardandoRechazo(true)

    const candId = modalRechazo.candidato.id

    try {
      // 1. Cambiamos el estado del candidato para sacarlo del tablero
      const { error: errCand } = await supabase
        .from('candidatos')
        .update({ estado: 'rechazado' }) 
        .eq('id', candId)

      if (errCand) throw errCand

      // 2. Lo mandamos al Registro Histórico
      const { error: errLibro } = await supabase
        .from('libro_negro')
        .insert({
          tipo_de_registro: 'candidato',
          candidato_id: candId,
          fecha_resolucion: new Date().toISOString().split('T')[0],
          motivo: modalRechazo.motivo.trim()
        })

      if (errLibro) throw errLibro

      // 3. Limpiamos la pantalla
      setCandidatos(prev => prev.filter(c => c.id !== candId))
      setModalRechazo({ visible: false, candidato: null, motivo: '' })
      
    } catch (error) {
      console.error(error)
      alert('Error al procesar el rechazo.')
    } finally {
      setGuardandoRechazo(false)
    }
  }

  if (cargando) return <p style={{ fontSize: '14px', color: 'var(--color-gris)', padding: '2rem', fontFamily: 'var(--font-montserrat)' }}>Cargando tablero...</p>

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative', fontFamily: 'var(--font-montserrat)' }}>
      
      {/* MODAL DE RECHAZO */}
      {modalRechazo.visible && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(2px)' }}>
          <div style={{ backgroundColor: '#fff', padding: '2.5rem', borderRadius: '12px', width: '90%', maxWidth: '480px', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
            <h2 style={{ fontSize: '18px', color: '#B33A3A', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 1rem', fontFamily: 'var(--font-baskerville)' }}>
              <AlertTriangle size={20} /> Rechazar Candidato
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--color-gris)', marginBottom: '1.5rem', lineHeight: '1.5' }}>
              Estás por descartar el expediente del profano <strong style={{ color: 'var(--color-institucional)' }}>{modalRechazo.candidato?.nombre} {modalRechazo.candidato?.apellido}</strong>. Pasará al Registro Histórico de Resoluciones.
            </p>

            <form onSubmit={confirmarRechazo}>
              <div style={{ marginBottom: '2rem' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--color-institucional)', marginBottom: '8px' }}>
                  Motivo del Rechazo (Aplomos negativos, etc.) *
                </label>
                <textarea 
                  value={modalRechazo.motivo} 
                  onChange={e => setModalRechazo({...modalRechazo, motivo: e.target.value})} 
                  placeholder="Detallar razones de la negativa..." 
                  style={{ width: '100%', padding: '12px 14px', fontSize: '13px', border: '1px solid #d1d0c8', borderRadius: '8px', minHeight: '90px', resize: 'vertical', fontFamily: 'inherit', color: 'var(--color-institucional)', backgroundColor: '#ffffff', outline: 'none' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setModalRechazo({ visible: false, candidato: null, motivo: '' })} style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #d1d0c8', backgroundColor: '#fafaf8', color: 'var(--color-gris)', fontWeight: '600', cursor: 'pointer', fontSize: '13px', transition: 'all 0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor = '#f0efe9'} onMouseOut={e => e.currentTarget.style.backgroundColor = '#fafaf8'}>
                  Cancelar
                </button>
                <button type="submit" disabled={guardandoRechazo} style={{ padding: '10px 16px', borderRadius: '8px', border: 'none', backgroundColor: '#B33A3A', color: '#fff', fontWeight: '600', cursor: guardandoRechazo ? 'not-allowed' : 'pointer', opacity: guardandoRechazo ? 0.7 : 1, fontSize: '13px', transition: 'all 0.2s' }} onMouseOver={e => !guardandoRechazo && (e.currentTarget.style.backgroundColor = '#8c2c2c')} onMouseOut={e => !guardandoRechazo && (e.currentTarget.style.backgroundColor = '#B33A3A')}>
                  {guardandoRechazo ? 'Enviando al Archivo...' : 'Confirmar Rechazo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CABECERA */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '600', color: 'var(--color-institucional)', marginBottom: '6px', fontFamily: 'var(--font-baskerville)' }}>
            Tablero de Candidatos
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--color-gris)', margin: 0 }}>
            Arrastrá las tarjetas para avanzar a los profanos en su proceso de admisión.
          </p>
        </div>
        
        <Link 
          href="/panel/secretaria/candidatos/nuevo" 
          style={{ fontSize: '13px', fontWeight: '600', padding: '10px 20px', borderRadius: '8px', border: '1px solid var(--color-oro)', backgroundColor: 'var(--color-institucional)', color: 'var(--color-oro)', cursor: 'pointer', textDecoration: 'none', transition: 'all 0.2s', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}
          onMouseOver={e => e.currentTarget.style.backgroundColor = '#111122'}
          onMouseOut={e => e.currentTarget.style.backgroundColor = 'var(--color-institucional)'}
        >
          + Ingresar Profano
        </Link>
      </div>

      {/* CONTENEDOR DEL KANBAN */}
      <div style={{ display: 'flex', gap: '1.25rem', overflowX: 'auto', paddingBottom: '1rem', flex: 1, alignItems: 'flex-start' }}>
        
        {COLUMNAS.map(columna => {
          const candidatosColumna = candidatos.filter(c => c.estado === columna.id)

          return (
            <div 
              key={columna.id}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, columna.id)}
              style={{
                backgroundColor: '#fafaf8', borderRadius: '12px', minWidth: '300px', maxWidth: '320px', flex: '0 0 auto', border: `1px solid ${columna.border}`, display: 'flex', flexDirection: 'column', minHeight: '60vh', boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
              }}
            >
              <div style={{ padding: '1.25rem', backgroundColor: columna.color, borderTopLeftRadius: '11px', borderTopRightRadius: '11px', borderBottom: `1px solid ${columna.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--color-institucional)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {columna.titulo}
                </h3>
                <span style={{ backgroundColor: '#ffffff', color: 'var(--color-institucional)', fontSize: '12px', padding: '2px 10px', borderRadius: '12px', fontWeight: '700', border: `1px solid ${columna.border}` }}>
                  {candidatosColumna.length}
                </span>
              </div>

              <div style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {candidatosColumna.map(candidato => (
                  <div
                    key={candidato.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, candidato.id)}
                    onDragEnd={handleDragEnd}
                    style={{
                      backgroundColor: '#ffffff', padding: '1.25rem', borderRadius: '10px', boxShadow: '0 2px 6px rgba(0,0,0,0.04)', border: '1px solid rgba(207, 181, 59, 0.2)', cursor: 'grab', position: 'relative', transition: 'box-shadow 0.2s, transform 0.2s'
                    }}
                    onMouseOver={e => { e.currentTarget.style.boxShadow = '0 6px 12px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                    onMouseOut={e => { e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.04)'; e.currentTarget.style.transform = 'translateY(0)' }}
                  >
                    {/* BOTONES DE ACCIÓN RÁPIDA (Arriba a la derecha) */}
                    <div style={{ position: 'absolute', top: '14px', right: '14px', display: 'flex', gap: '8px' }}>
                      <Link href={`/panel/secretaria/candidatos/${candidato.id}`} title="Editar Legajo" style={{ color: 'var(--color-oro)', cursor: 'pointer', transition: 'color 0.2s' }} onMouseOver={e => e.currentTarget.style.color = 'var(--color-institucional)'} onMouseOut={e => e.currentTarget.style.color = 'var(--color-oro)'}>
                        <Edit size={16} />
                      </Link>
                      <button onClick={() => setModalRechazo({ visible: true, candidato, motivo: '' })} title="Rechazar / Registro Histórico" style={{ background: 'none', border: 'none', color: '#B33A3A', cursor: 'pointer', padding: 0, transition: 'color 0.2s' }} onMouseOver={e => e.currentTarget.style.color = '#791F1F'} onMouseOut={e => e.currentTarget.style.color = '#B33A3A'}>
                        <ShieldAlert size={16} />
                      </button>
                    </div>

                    <h4 style={{ fontSize: '15px', margin: '0 0 10px', color: 'var(--color-institucional)', fontWeight: '700', paddingRight: '45px' }}>
                      {candidato.nombre} {candidato.apellido}
                    </h4>
                    
                    {/* ETIQUETAS VISUALES (BADGES) */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
                      {candidato.boletin_nro && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: '11px', color: '#854F0B', backgroundColor: '#FFF4E5', border: '1px solid #F3DDBA', padding: '3px 8px', borderRadius: '4px', width: 'fit-content', fontWeight: '600' }}>
                          Boletín N° {candidato.boletin_nro}
                        </span>
                      )}
                      {candidato.votacion_administrativa && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#4A8516', backgroundColor: '#EAF3DE', border: '1px solid #D4EAB6', padding: '3px 8px', borderRadius: '4px', width: 'fit-content', fontWeight: '600' }}>
                          <CheckCircle2 size={12} /> Votado Administrativamente
                        </span>
                      )}
                      {candidato.enviado_gl && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--color-institucional)', backgroundColor: '#f4f3ed', border: '1px solid #d1d0c8', padding: '3px 8px', borderRadius: '4px', width: 'fit-content', fontWeight: '600' }}>
                          <Send size={12} /> Enviado a GL
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', borderTop: '1px solid #f0efe9', paddingTop: '12px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--color-gris)', fontWeight: '500' }}>
                        {candidato.estado === 'contacto' && 'Primer acercamiento'}
                        {candidato.estado === 'circulacion' && 'Aprobación Logia'}
                        {candidato.estado === 'aplomacion' && 'En Escrutinio'}
                        {candidato.estado === 'aprobado' && 'Listo para Iniciación'}
                      </span>

                      <Link 
                        href={`/panel/secretaria/candidatos/${candidato.id}`} 
                        style={{ fontSize: '11px', color: 'var(--color-institucional)', textDecoration: 'none', backgroundColor: '#fafaf8', border: '1px solid rgba(207, 181, 59, 0.4)', padding: '6px 12px', borderRadius: '6px', fontWeight: '600', transition: 'all 0.2s' }}
                        onMouseOver={e => { e.currentTarget.style.backgroundColor = 'var(--color-institucional)'; e.currentTarget.style.color = 'var(--color-oro)' }}
                        onMouseOut={e => { e.currentTarget.style.backgroundColor = '#fafaf8'; e.currentTarget.style.color = 'var(--color-institucional)' }}
                      >
                        Abrir legajo
                      </Link>
                    </div>
                  </div>
                ))}

                {candidatosColumna.length === 0 && (
                  <div style={{ border: '1px dashed #d1d0c8', borderRadius: '8px', padding: '1.5rem 1rem', textAlign: 'center', color: '#aaa', fontSize: '12px', backgroundColor: 'rgba(255,255,255,0.5)' }}>
                    Soltar tarjeta aquí
                  </div>
                )}
              </div>
            </div>
          )
        })}

      </div>
    </div>
  )
}