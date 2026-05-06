'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Mail, Phone, Edit, Check, X, User, ArrowLeft } from 'lucide-react'

export default function LegajoCandidato() {
  const params = useParams()
  const id = Array.isArray(params?.id) ? params.id : params?.id
  const router = useRouter()

  const [candidato, setCandidato] = useState(null)
  const [hermanos, setHermanos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' })
  const [mostrarCuartoAplomo, setMostrarCuartoAplomo] = useState(false)

  // Estados para la nueva edición de contacto
  const [editandoContacto, setEditandoContacto] = useState(false)
  const [formContacto, setFormContacto] = useState({ email: '', telefono: '' })
  const [guardandoContacto, setGuardandoContacto] = useState(false)

  useEffect(() => {
    async function cargarDatos() {
      if (!id) return 

      const { data: cand } = await supabase.from('candidatos').select('*').eq('id', id).single()
      
      const { data: herms } = await supabase
        .from('hermanos')
        .select('id, nombre, apellido, email')
        .eq('activo', true)
        .eq('grado', 3) 

      if (cand) {
        setCandidato(cand)
        setFormContacto({ email: cand.email || '', telefono: cand.telefono || '' })
        if (cand.aplomador_4_id) setMostrarCuartoAplomo(true)
      }
      if (herms) setHermanos(herms)

      setCargando(false)
    }

    cargarDatos()
  }, [id])

  // --- FUNCIONES DE ACTUALIZACIÓN ORIGINALES ---
  const handleActualizarCampo = async (campo, valor) => {
    setGuardando(true)

    const { error } = await supabase
      .from('candidatos')
      .update({ [campo]: valor || null })
      .eq('id', id)

    if (error) {
      setMensaje({ tipo: 'error', texto: 'Error al guardar.' })
    } else {
      setCandidato(prev => ({ ...prev, [campo]: valor }))
      setMensaje({ tipo: 'exito', texto: 'Guardado correctamente.' })
      
      if (campo.includes('aplomador_') && valor) {
        const num = campo.split('_')[1] 
        await supabase.from('candidatos').update({ [`aplomo_${num}_notificado`]: false }).eq('id', id)
        setCandidato(prev => ({ ...prev, [`aplomo_${num}_notificado`]: false }))
      }

      setTimeout(() => setMensaje({ tipo: '', texto: '' }), 3000)
    }

    setGuardando(false)
  }

  const notificarAplomadorManual = async (num) => {
    setGuardando(true)
    const hermanoId = candidato[`aplomador_${num}_id`]
    const hermano = hermanos.find(h => h.id == hermanoId)

    if (!hermano?.email) {
      setMensaje({ tipo: 'error', texto: 'El hermano seleccionado no tiene email registrado.' })
      setGuardando(false)
      return
    }

    try {
      const res = await fetch('/api/secretaria/enviar-aplomo', {
        method: 'POST',
        body: JSON.stringify({
          email: hermano.email,
          nombreAplomador: hermano.nombre,
          candidato: `${candidato.nombre} ${candidato.apellido}`,
          telefonoCandidato: candidato.telefono
        })
      })

      if (res.ok) {
        await handleActualizarCampo(`aplomo_${num}_notificado`, true)
        setMensaje({ tipo: 'exito', texto: `Se ha notificado oficialmente al Q.·.H.·. ${hermano.apellido}.` })
      } else {
        throw new Error('Falló el envío en la API')
      }
    } catch (error) {
      console.error(error)
      setMensaje({ tipo: 'error', texto: 'Hubo un problema al enviar el correo.' })
    }
    setGuardando(false)
  }

  const handleProgramarIniciacion = async () => {
    setGuardando(true)
    const { error } = await supabase.from('candidatos').update({ estado: 'aprobado' }).eq('id', id)
    if (!error) {
      router.push('/panel/secretaria/candidatos')
      router.refresh()
    } else {
      setMensaje({ tipo: 'error', texto: 'Error al mover al candidato.' })
      setGuardando(false)
    }
  }

  // --- NUEVAS FUNCIONES DE UI ---
  const toggleHito = async (campo, valorActual) => {
    const nuevoValor = !valorActual
    setCandidato(prev => ({ ...prev, [campo]: nuevoValor })) // UI Optimista
    const { error } = await supabase.from('candidatos').update({ [campo]: nuevoValor }).eq('id', id)
    if (error) {
      alert('No se pudo actualizar el hito administrativo.')
      setCandidato(prev => ({ ...prev, [campo]: valorActual }))
    }
  }

  const handleGuardarContacto = async () => {
    setGuardandoContacto(true)
    const { error } = await supabase
      .from('candidatos')
      .update({ email: formContacto.email.trim(), telefono: formContacto.telefono.trim() })
      .eq('id', id)

    if (!error) {
      setCandidato(prev => ({ ...prev, email: formContacto.email.trim(), telefono: formContacto.telefono.trim() }))
      setEditandoContacto(false)
    }
    setGuardandoContacto(false)
  }

  if (cargando) return <p style={{ fontSize: '14px', color: 'var(--color-gris)', padding: '2rem', fontFamily: 'var(--font-montserrat)' }}>Abriendo legajo...</p>
  if (!candidato) return <p style={{ fontSize: '14px', color: '#B33A3A', padding: '2rem', fontFamily: 'var(--font-montserrat)' }}>Error: Candidato no encontrado.</p>

  // --- REGLAS DE NEGOCIO (INTACTAS) ---
  let pasaron30Dias = false
  if (candidato?.fecha_boletin) {
    const fecha = new Date(candidato.fecha_boletin)
    const hoy = new Date()
    pasaron30Dias = (hoy - fecha) / (1000 * 60 * 60 * 24) >= 30
  }

  const estadosAplomos = [candidato?.estado_aplomo_1, candidato?.estado_aplomo_2, candidato?.estado_aplomo_3, candidato?.estado_aplomo_4]
  const hayDesfavorable = estadosAplomos.includes('desfavorable')
  const aplomosBaseFavorables = candidato?.estado_aplomo_1 === 'favorable' && candidato?.estado_aplomo_2 === 'favorable' && candidato?.estado_aplomo_3 === 'favorable'
  const tieneCuarto = !!candidato?.aplomador_4_id
  const cuartoOk = candidato?.estado_aplomo_4 === 'favorable'

  const aplomosFavorables = !hayDesfavorable && aplomosBaseFavorables && (!tieneCuarto || cuartoOk)
  const listoParaIniciar = pasaron30Dias && aplomosFavorables

  const cantidadAplomos = mostrarCuartoAplomo ? 4 : 3
  const aplomosVisibles = Array.from({ length: cantidadAplomos }, (_, i) => i + 1)

  return (
    <div style={{ maxWidth: '900px', paddingBottom: '2rem', fontFamily: 'var(--font-montserrat)' }}>
      
      {/* CABECERA */}
      <Link 
        href="/panel/secretaria/candidatos" 
        style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--color-gris)', fontSize: '13px', fontWeight: '500', textDecoration: 'none', marginBottom: '1.5rem', transition: 'color 0.2s' }}
        onMouseOver={e => e.currentTarget.style.color = 'var(--color-institucional)'}
        onMouseOut={e => e.currentTarget.style.color = 'var(--color-gris)'}
      >
        <ArrowLeft size={16} /> Volver al Tablero
      </Link>

      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '600', color: 'var(--color-institucional)', margin: 0, fontFamily: 'var(--font-baskerville)' }}>
          {candidato.nombre} {candidato.apellido}
        </h1>
        <span style={{ fontSize: '11px', fontWeight: '700', padding: '6px 14px', borderRadius: '20px', backgroundColor: '#fafaf8', color: 'var(--color-gris)', border: '1px solid #d1d0c8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Estado: {candidato.estado}
        </span>
      </div>

      {mensaje.texto && (
        <div style={{ backgroundColor: mensaje.tipo === 'error' ? '#FCEBEB' : '#EAF3DE', color:  mensaje.tipo === 'error' ? '#B33A3A' : '#4A8516', border: `1px solid ${mensaje.tipo === 'error' ? '#F8D7D7' : '#D4EAB6'}`, padding: '1rem', borderRadius: '8px', fontSize: '13px', marginBottom: '1.5rem', fontWeight: '500' }}>
          {mensaje.texto}
        </div>
      )}

      {/* BLOQUE SUPERIOR: TRÁMITES Y CONTACTO (NUEVO DISEÑO) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
        
        {/* HITOS ADMINISTRATIVOS */}
        <div style={estiloCard}>
          <h3 style={estiloTituloSeccion}>Trámites Administrativos</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            
            <div 
              onClick={() => toggleHito('votacion_administrativa', candidato.votacion_administrativa)} 
              style={estiloFilaCheck}
              onMouseOver={e => e.currentTarget.style.backgroundColor = '#fafaf8'}
              onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <div style={{ ...estiloCheckbox, backgroundColor: candidato.votacion_administrativa ? 'var(--color-institucional)' : '#fff', borderColor: candidato.votacion_administrativa ? 'var(--color-oro)' : '#d1d0c8' }}>
                {candidato.votacion_administrativa && <Check size={14} color="var(--color-oro)" />}
              </div>
              <div>
                <p style={estiloTextoCheck}>Votación Administrativa</p>
                <p style={{ fontSize: '12px', color: 'var(--color-gris)', margin: '2px 0 0' }}>Aprobación por el Taller para iniciar trámite</p>
              </div>
            </div>

            <div 
              onClick={() => toggleHito('enviado_gl', candidato.enviado_gl)} 
              style={estiloFilaCheck}
              onMouseOver={e => e.currentTarget.style.backgroundColor = '#fafaf8'}
              onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <div style={{ ...estiloCheckbox, backgroundColor: candidato.enviado_gl ? 'var(--color-institucional)' : '#fff', borderColor: candidato.enviado_gl ? 'var(--color-oro)' : '#d1d0c8' }}>
                {candidato.enviado_gl && <Check size={14} color="var(--color-oro)" />}
              </div>
              <div>
                <p style={estiloTextoCheck}>Expediente en Gran Logia</p>
                <p style={{ fontSize: '12px', color: 'var(--color-gris)', margin: '2px 0 0' }}>Documentación enviada a la zona administrativa</p>
              </div>
            </div>

          </div>
        </div>

        {/* INFORMACIÓN PERSONAL (EDITABLE) */}
        <div style={estiloCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid rgba(207, 181, 59, 0.15)', paddingBottom: '10px' }}>
            <h3 style={{ ...estiloTituloSeccion, margin: 0, border: 'none', padding: 0 }}>Información Personal</h3>
            {!editandoContacto && (
              <button onClick={() => setEditandoContacto(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-oro)', transition: 'color 0.2s' }} onMouseOver={e => e.currentTarget.style.color = 'var(--color-institucional)'} onMouseOut={e => e.currentTarget.style.color = 'var(--color-oro)'}>
                <Edit size={16} />
              </button>
            )}
          </div>

          {editandoContacto ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input type="email" value={formContacto.email} onChange={e => setFormContacto({...formContacto, email: e.target.value})} placeholder="Email" style={estiloInput} />
              <input type="text" value={formContacto.telefono} onChange={e => setFormContacto({...formContacto, telefono: e.target.value})} placeholder="Teléfono" style={estiloInput} />
              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <button onClick={handleGuardarContacto} disabled={guardandoContacto} style={estiloBotonGuardar}>
                  {guardandoContacto ? 'Guardando...' : 'Guardar'}
                </button>
                <button onClick={() => {setEditandoContacto(false); setFormContacto({email: candidato.email, telefono: candidato.telefono})}} style={estiloBotonCancelar}>
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingTop: '4px' }}>
              <div style={estiloDato}><Mail size={16} color="var(--color-oro)" /> {candidato.email || <span style={{ color: '#ccc', fontStyle: 'italic' }}>Sin correo</span>}</div>
              <div style={estiloDato}><Phone size={16} color="var(--color-oro)" /> {candidato.telefono || <span style={{ color: '#ccc', fontStyle: 'italic' }}>Sin teléfono</span>}</div>
              <div style={estiloDato}><User size={16} color="var(--color-oro)" /> <span style={{ color: 'var(--color-gris)', fontSize: '13px' }}>Ingresado el {new Date(candidato.created_at).toLocaleDateString('es-AR')}</span></div>
            </div>
          )}
        </div>
      </div>

      {/* BLOQUE CIRCULACIÓN (BOLETÍN) */}
      <div style={{ ...estiloCard, marginBottom: '1.5rem' }}>
        <h3 style={estiloTituloSeccion}>Circulación (Gran Secretaría)</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', alignItems: 'flex-end' }}>
          <div>
            <label style={estiloLabel}>N° de Boletín</label>
            <input type="text" defaultValue={candidato.boletin_nro || ''} onBlur={(e) => handleActualizarCampo('boletin_nro', e.target.value)} placeholder="Ej: 145/2026" style={estiloInput} />
          </div>
          <div>
            <label style={estiloLabel}>Fecha de Publicación</label>
            <input type="date" defaultValue={candidato.fecha_boletin || ''} onBlur={(e) => handleActualizarCampo('fecha_boletin', e.target.value)} style={estiloInput} />
          </div>
          <div style={{ paddingBottom: '12px' }}>
            {candidato.fecha_boletin ? ( 
              pasaron30Dias 
                ? <span style={{ fontSize: '13px', color: '#4A8516', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}><Check size={16}/> Plazo de 30 días cumplido</span> 
                : <span style={{ fontSize: '13px', color: '#854F0B', fontWeight: '600' }}>⏳ En período de tachas</span>
            ) : (
              <span style={{ fontSize: '13px', color: 'var(--color-gris)', fontStyle: 'italic' }}>Esperando fecha...</span>
            )}
          </div>
        </div>
      </div>

      {/* BLOQUE APLOMACIONES */}
      <div style={{ ...estiloCard, marginBottom: '1.5rem' }}>
        <h3 style={estiloTituloSeccion}>Proceso de Aplomación</h3>
        
        {aplomosVisibles.map((num, index) => (
          <div key={num} style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: index !== aplomosVisibles.length - 1 ? '1px solid #f0efe9' : 'none', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 280px' }}>
              <label style={estiloLabel}>Aplomador {num}</label>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <select 
                  value={candidato[`aplomador_${num}_id`] || ''} 
                  onChange={(e) => handleActualizarCampo(`aplomador_${num}_id`, e.target.value)} 
                  style={{...estiloInput, flex: 1}}
                >
                  <option value="">-- Asignar Hermano --</option>
                  {hermanos.map(h => (<option key={h.id} value={h.id}>{h.nombre} {h.apellido}</option>))}
                </select>
                
                {candidato[`aplomador_${num}_id`] && (
                  candidato[`aplomo_${num}_notificado`] 
                    ? <span style={{ fontSize: '12px', color: '#4A8516', fontWeight: '600', padding: '8px', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '4px' }}><Check size={14}/> Notificado</span>
                    : <button 
                        onClick={(e) => { e.preventDefault(); notificarAplomadorManual(num); }} 
                        disabled={guardando} 
                        style={{ fontSize: '12px', backgroundColor: 'var(--color-institucional)', color: 'var(--color-oro)', border: '1px solid var(--color-oro)', padding: '10px 14px', borderRadius: '8px', cursor: guardando ? 'not-allowed' : 'pointer', fontWeight: '600', whiteSpace: 'nowrap', transition: 'all 0.2s' }}
                        onMouseOver={e => !guardando && (e.currentTarget.style.backgroundColor = '#111122')}
                        onMouseOut={e => !guardando && (e.currentTarget.style.backgroundColor = 'var(--color-institucional)')}
                      >
                        📩 Notificar
                      </button>
                )}
              </div>
            </div>
            
            <div style={{ flex: '1 1 180px' }}>
              <label style={estiloLabel}>Dictamen</label>
              <select 
                value={candidato[`estado_aplomo_${num}`] || 'pendiente'} 
                onChange={(e) => handleActualizarCampo(`estado_aplomo_${num}`, e.target.value)} 
                style={{ 
                  ...estiloInput, 
                  backgroundColor: candidato[`estado_aplomo_${num}`] === 'favorable' ? '#EAF3DE' : candidato[`estado_aplomo_${num}`] === 'desfavorable' ? '#FCEBEB' : candidato[`estado_aplomo_${num}`] === 'presentado' ? '#FFF4E5' : '#fafaf8',
                  color: candidato[`estado_aplomo_${num}`] === 'favorable' ? '#27500A' : candidato[`estado_aplomo_${num}`] === 'desfavorable' ? '#791F1F' : candidato[`estado_aplomo_${num}`] === 'presentado' ? '#854F0B' : 'var(--color-institucional)',
                  borderColor: candidato[`estado_aplomo_${num}`] === 'favorable' ? '#D4EAB6' : candidato[`estado_aplomo_${num}`] === 'desfavorable' ? '#F8D7D7' : candidato[`estado_aplomo_${num}`] === 'presentado' ? '#F3DDBA' : '#d1d0c8',
                  fontWeight: '500'
                }}
              >
                <option value="pendiente">Pendiente</option>
                <option value="presentado">Presentado</option>
                <option value="favorable">Favorable</option>
                <option value="desfavorable">Desfavorable</option>
              </select>
            </div>
          </div>
        ))}

        {!mostrarCuartoAplomo ? (
          <button 
            onClick={(e) => { e.preventDefault(); setMostrarCuartoAplomo(true); }} 
            style={{ fontSize: '13px', color: 'var(--color-institucional)', backgroundColor: '#fafaf8', border: '1px solid #d1d0c8', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', transition: 'all 0.2s' }}
            onMouseOver={e => e.currentTarget.style.backgroundColor = '#f0efe9'}
            onMouseOut={e => e.currentTarget.style.backgroundColor = '#fafaf8'}
          >
            + Requerir 4º Aplomo
          </button>
        ) : (
          <button 
            onClick={(e) => { 
              e.preventDefault(); 
              setMostrarCuartoAplomo(false);
              handleActualizarCampo('aplomador_4_id', null);
              handleActualizarCampo('estado_aplomo_4', 'pendiente');
              handleActualizarCampo('aplomo_4_notificado', false);
            }} 
            style={{ fontSize: '13px', color: '#B33A3A', backgroundColor: '#FCEBEB', border: '1px solid #F8D7D7', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', transition: 'all 0.2s' }}
            onMouseOver={e => e.currentTarget.style.backgroundColor = '#F8D7D7'}
            onMouseOut={e => e.currentTarget.style.backgroundColor = '#FCEBEB'}
          >
            Quitar 4º Aplomo
          </button>
        )}
      </div>
      
      {/* BLOQUE FINAL: INICIACIÓN */}
      <div style={{ backgroundColor: '#fafaf8', border: '1px solid rgba(207, 181, 59, 0.3)', borderRadius: '12px', padding: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
        <div style={{ flex: '1 1 280px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--color-institucional)', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Iniciación</h3>
          
          {hayDesfavorable && <p style={{ fontSize: '13px', color: '#B33A3A', margin: 0, fontWeight: '500' }}>✖ Candidato rechazado (Aplomo desfavorable).</p>}
          {!hayDesfavorable && listoParaIniciar && <p style={{ fontSize: '13px', color: '#4A8516', margin: 0, fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}><Check size={16}/> El candidato cumple todos los requisitos.</p>}
          {!hayDesfavorable && !listoParaIniciar && <p style={{ fontSize: '13px', color: 'var(--color-gris)', margin: 0 }}>Faltan requisitos para habilitar la iniciación.</p>}
          
          {/* ETIQUETA DE TESORERÍA */}
          {candidato.fecha_iniciacion && (
            <div style={{ marginTop: '12px', display: 'inline-block', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', backgroundColor: candidato.derechos_pagados ? '#EAF3DE' : '#FFF4E5', color: candidato.derechos_pagados ? '#27500A' : '#854F0B', border: `1px solid ${candidato.derechos_pagados ? '#D4EAB6' : '#F3DDBA'}`, letterSpacing: '0.05em' }}>
              DERECHOS: {candidato.derechos_pagados ? 'PAGADOS' : 'PENDIENTES DE COBRO'}
            </div>
          )}
        </div>
        
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {listoParaIniciar && !hayDesfavorable && (
            <div>
              <label style={{ fontSize: '11px', color: 'var(--color-institucional)', display: 'block', marginBottom: '6px', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.05em' }}>Fecha Fijada *</label>
              <input 
                type="date" 
                value={candidato.fecha_iniciacion || ''} 
                onChange={(e) => handleActualizarCampo('fecha_iniciacion', e.target.value)} 
                style={{ padding: '10px 14px', border: '1px solid #d1d0c8', borderRadius: '8px', fontSize: '14px', outline: 'none', color: 'var(--color-institucional)', backgroundColor: '#ffffff', fontWeight: '600', fontFamily: 'var(--font-montserrat)' }} 
              />
            </div>
          )}
          
          <button 
            onClick={handleProgramarIniciacion} 
            disabled={!listoParaIniciar || hayDesfavorable || guardando || !candidato?.fecha_iniciacion} 
            style={{ 
              fontSize: '14px', 
              padding: '12px 24px', 
              borderRadius: '8px', 
              border: (listoParaIniciar && !hayDesfavorable && candidato?.fecha_iniciacion) ? '1px solid var(--color-oro)' : '1px solid #d1d0c8', 
              backgroundColor: (listoParaIniciar && !hayDesfavorable && candidato?.fecha_iniciacion) ? 'var(--color-institucional)' : '#fafaf8', 
              color: (listoParaIniciar && !hayDesfavorable && candidato?.fecha_iniciacion) ? 'var(--color-oro)' : '#aaa', 
              cursor: (listoParaIniciar && !hayDesfavorable && candidato?.fecha_iniciacion) ? 'pointer' : 'not-allowed', 
              fontWeight: '600', 
              marginTop: (listoParaIniciar && !hayDesfavorable) ? '20px' : '0',
              transition: 'all 0.2s',
              boxShadow: (listoParaIniciar && !hayDesfavorable && candidato?.fecha_iniciacion) ? '0 4px 6px rgba(0,0,0,0.05)' : 'none'
            }}
            onMouseOver={e => (listoParaIniciar && !hayDesfavorable && candidato?.fecha_iniciacion) && (e.currentTarget.style.backgroundColor = '#111122')}
            onMouseOut={e => (listoParaIniciar && !hayDesfavorable && candidato?.fecha_iniciacion) && (e.currentTarget.style.backgroundColor = 'var(--color-institucional)')}
          >
            Aprobar y Mover al Tablero
          </button>
        </div>
      </div>

    </div>
  )
}

// --- ESTILOS ---
const estiloCard = { backgroundColor: '#ffffff', border: '1px solid rgba(207, 181, 59, 0.2)', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }
const estiloTituloSeccion = { fontSize: '13px', color: 'var(--color-institucional)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1.25rem', marginTop: 0, borderBottom: '1px solid rgba(207, 181, 59, 0.15)', paddingBottom: '10px' }
const estiloLabel = { display: 'block', fontSize: '11px', color: 'var(--color-institucional)', marginBottom: '6px', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.05em' }
const estiloInput = { width: '100%', padding: '10px 12px', fontSize: '13px', border: '1px solid #d1d0c8', borderRadius: '8px', backgroundColor: '#fff', color: 'var(--color-institucional)', outline: 'none', transition: 'border-color 0.2s', fontFamily: 'var(--font-montserrat)' }
const estiloFilaCheck = { display: 'flex', alignItems: 'flex-start', gap: '14px', cursor: 'pointer', padding: '10px', borderRadius: '8px', transition: 'background 0.2s' }
const estiloCheckbox = { width: '22px', height: '22px', borderRadius: '6px', border: '2px solid', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '2px', transition: 'all 0.2s' }
const estiloTextoCheck = { fontSize: '14px', fontWeight: '600', color: 'var(--color-institucional)', margin: 0 }
const estiloDato = { display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', color: 'var(--color-institucional)', fontWeight: '500' }
const estiloBotonGuardar = { flex: 1, backgroundColor: '#4A8516', color: '#fff', border: 'none', padding: '10px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', transition: 'background-color 0.2s' }
const estiloBotonCancelar = { flex: 1, backgroundColor: '#fafaf8', color: 'var(--color-gris)', border: '1px solid #d1d0c8', padding: '10px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', transition: 'background-color 0.2s' }