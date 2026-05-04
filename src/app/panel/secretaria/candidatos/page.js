'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { Edit, ShieldAlert, CheckCircle2, Send, AlertTriangle, X } from 'lucide-react'

// Definimos las columnas de nuestro flujo activo
const COLUMNAS = [
  { id: 'contacto', titulo: '1. Contacto Inicial', color: '#e8e6e0', border: '#c8c5b8' },
  { id: 'circulacion', titulo: '2. En Trámite GL', color: '#EAF3DE', border: '#b8d598' }, // Nombre actualizado
  { id: 'aplomacion', titulo: '3. Aplomación', color: '#FAEEDA', border: '#e8cfa6' },
  { id: 'aprobado', titulo: '4. Aprobados', color: '#EAE6F3', border: '#b8a6d9' }
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
        .update({ estado: 'rechazado' }) // Opcional: sumar un campo activo: false si lo tenés
        .eq('id', candId)

      if (errCand) throw errCand

      // 2. Lo mandamos al Registro Histórico
      const { error: errLibro } = await supabase
        .from('libro_negro')
        .insert({
          tipo_de_registro: 'candidato',
          candidato_id: candId,
          fecha_resolucion: new Date().toISOString().split('T'),
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

  if (cargando) return <p style={{ fontSize: '13px', color: '#888', padding: '2rem' }}>Cargando tablero...</p>

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      
      {/* MODAL DE RECHAZO */}
      {modalRechazo.visible && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ backgroundColor: '#fff', padding: '2rem', borderRadius: '12px', width: '90%', maxWidth: '450px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
            <h2 style={{ fontSize: '18px', color: '#A32D2D', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 1rem' }}>
              <AlertTriangle size={20} /> Rechazar Candidato
            </h2>
            <p style={{ fontSize: '13px', color: '#666', marginBottom: '1.5rem' }}>
              Estás por descartar el expediente del profano <strong>{modalRechazo.candidato?.nombre} {modalRechazo.candidato?.apellido}</strong>. Pasará al Registro Histórico de Resoluciones.
            </p>

            <form onSubmit={confirmarRechazo}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#444', marginBottom: '6px' }}>
                  Motivo del Rechazo (Aplomos negativos, etc.) *
                </label>
                <textarea 
                  value={modalRechazo.motivo} 
                  onChange={e => setModalRechazo({...modalRechazo, motivo: e.target.value})} 
                  placeholder="Detallar razones de la negativa..." 
                  style={{ width: '100%', padding: '10px 12px', fontSize: '13px', border: '1px solid #d1d0c8', borderRadius: '8px', minHeight: '80px', resize: 'vertical', fontFamily: 'inherit', color: '#1a1a2e', backgroundColor: '#ffffff' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setModalRechazo({ visible: false, candidato: null, motivo: '' })} style={{ padding: '8px 14px', borderRadius: '6px', border: 'none', backgroundColor: '#f0efe9', color: '#666', fontWeight: '500', cursor: 'pointer', fontSize: '12px' }}>
                  Cancelar
                </button>
                <button type="submit" disabled={guardandoRechazo} style={{ padding: '8px 14px', borderRadius: '6px', border: 'none', backgroundColor: '#A32D2D', color: '#fff', fontWeight: '600', cursor: guardandoRechazo ? 'not-allowed' : 'pointer', opacity: guardandoRechazo ? 0.7 : 1, fontSize: '12px' }}>
                  {guardandoRechazo ? 'Enviando al Archivo...' : 'Confirmar Rechazo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CABECERA */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '500', color: '#1a1a2e', marginBottom: '4px' }}>
            Tablero de Candidatos
          </h1>
          <p style={{ fontSize: '13px', color: '#888' }}>
            Arrastrá las tarjetas para avanzar a los profanos en su proceso de admisión.
          </p>
        </div>
        
        <Link 
          href="/panel/secretaria/candidatos/nuevo" 
          style={{ fontSize: '13px', padding: '8px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#1a1a2e', color: '#ffffff', cursor: 'pointer', textDecoration: 'none' }}
        >
          + Ingresar Profano
        </Link>
      </div>

      {/* CONTENEDOR DEL KANBAN */}
      <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '1rem', flex: 1, alignItems: 'flex-start' }}>
        
        {COLUMNAS.map(columna => {
          const candidatosColumna = candidatos.filter(c => c.estado === columna.id)

          return (
            <div 
              key={columna.id}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, columna.id)}
              style={{
                backgroundColor: '#fafaf8', borderRadius: '12px', minWidth: '300px', maxWidth: '320px', flex: '0 0 auto', border: `1px solid ${columna.border}`, display: 'flex', flexDirection: 'column', minHeight: '400px'
              }}
            >
              <div style={{ padding: '1rem', backgroundColor: columna.color, borderTopLeftRadius: '11px', borderTopRightRadius: '11px', borderBottom: `1px solid ${columna.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '13px', fontWeight: '600', color: '#1a1a2e', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {columna.titulo}
                </h3>
                <span style={{ backgroundColor: '#ffffff', color: '#888', fontSize: '11px', padding: '2px 8px', borderRadius: '12px', fontWeight: '600' }}>
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
                      backgroundColor: '#ffffff', padding: '1rem', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.04)', border: '1px solid #e8e6e0', cursor: 'grab', position: 'relative'
                    }}
                  >
                    {/* BOTONES DE ACCIÓN RÁPIDA (Arriba a la derecha) */}
                    <div style={{ position: 'absolute', top: '12px', right: '12px', display: 'flex', gap: '6px' }}>
                      <Link href={`/panel/secretaria/candidatos/${candidato.id}`} title="Editar Legajo" style={{ color: '#CDA434', cursor: 'pointer' }}>
                        <Edit size={16} />
                      </Link>
                      <button onClick={() => setModalRechazo({ visible: true, candidato, motivo: '' })} title="Rechazar / Registro Histórico" style={{ background: 'none', border: 'none', color: '#A32D2D', cursor: 'pointer', padding: 0 }}>
                        <ShieldAlert size={16} />
                      </button>
                    </div>

                    <h4 style={{ fontSize: '15px', margin: '0 0 6px', color: '#1a1a2e', fontWeight: '600', paddingRight: '40px' }}>
                      {candidato.nombre} {candidato.apellido}
                    </h4>
                    
                    {/* ETIQUETAS VISUALES (BADGES) */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '10px' }}>
                      {candidato.boletin_nro && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: '11px', color: '#856A1F', backgroundColor: '#FDF7E7', padding: '2px 6px', borderRadius: '4px', width: 'fit-content', fontWeight: '500' }}>
                          Boletín N° {candidato.boletin_nro}
                        </span>
                      )}
                      {candidato.votacion_administrativa && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#27500A', backgroundColor: '#EAF3DE', padding: '2px 6px', borderRadius: '4px', width: 'fit-content', fontWeight: '500' }}>
                          <CheckCircle2 size={12} /> Votado Administrativamente
                        </span>
                      )}
                      {candidato.enviado_gl && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#1a1a2e', backgroundColor: '#e8e6e0', padding: '2px 6px', borderRadius: '4px', width: 'fit-content', fontWeight: '500' }}>
                          <Send size={12} /> Enviado a GL
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', borderTop: '1px solid #f0efe9', paddingTop: '10px' }}>
                      <span style={{ fontSize: '11px', color: '#888', fontWeight: '500' }}>
                        {candidato.estado === 'contacto' && 'Primer acercamiento'}
                        {candidato.estado === 'circulacion' && 'Aprobación Logia'}
                        {candidato.estado === 'aplomacion' && 'En Escrutinio'}
                        {candidato.estado === 'aprobado' && 'Listo para Iniciación'}
                      </span>

                      <Link href={`/panel/secretaria/candidatos/${candidato.id}`} style={{ fontSize: '11px', color: '#1a1a2e', textDecoration: 'none', backgroundColor: '#f5f4f0', padding: '4px 10px', borderRadius: '6px', fontWeight: '500', transition: 'background 0.2s' }}>
                        Abrir legajo
                      </Link>
                    </div>
                  </div>
                ))}

                {candidatosColumna.length === 0 && (
                  <div style={{ border: '1px dashed #c8c5b8', borderRadius: '8px', padding: '1rem', textAlign: 'center', color: '#aaa', fontSize: '12px' }}>
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