'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Users, Clock, FileText, CheckCircle2, X, Gavel, BookOpen, CalendarPlus, MapPin, Video, UserCheck } from 'lucide-react'

export default function ColumnaSurPage() {
  const [obreros, setObreros] = useState([])
  const [instrucciones, setInstrucciones] = useState([])
  const [cargando, setCargando] = useState(true)
  
  const [modalObrero, setModalObrero] = useState(null)
  const [nuevaPlancha, setNuevaPlancha] = useState('')
  const [guardandoPlancha, setGuardandoPlancha] = useState(false)

  const [modalInstruccion, setModalInstruccion] = useState(false)
  const [guardandoInstruccion, setGuardandoInstruccion] = useState(false)
  const [formInstruccion, setFormInstruccion] = useState({
    titulo: '', fecha: '', horario: '', modalidad: 'presencial', ubicacion_o_link: ''
  })

  const [modalAsistencia, setModalAsistencia] = useState(null)
  const [estadoAsistencia, setEstadoAsistencia] = useState({}) 
  const [guardandoAsistencia, setGuardandoAsistencia] = useState(false)

  const [hoy] = useState(() => new Date())

  const cargarDatos = useCallback(async () => {
    try {
      const { data: dataObreros, error: errO } = await supabase
        .from('hermanos')
        .select(`
          id, nombre, apellido, email, telefono, created_at, fecha_aumento, fecha_iniciacion,
          planchas (id, titulo, estado, fecha_presentacion, fecha_lectura)
        `)
        .eq('grado', 2)
        .eq('activo', true)
        .order('created_at', { ascending: true })

      const { data: dataInstrucciones, error: errI } = await supabase
        .from('instrucciones')
        .select('*')
        .eq('grado_objetivo', 2)
        .order('fecha', { ascending: true })

      if (errO) throw errO
      if (errI) throw errI

      if (dataObreros) setObreros(dataObreros)
      if (dataInstrucciones) setInstrucciones(dataInstrucciones)
    } catch (error) {
      console.error("Error cargando datos:", error)
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    cargarDatos()
  }, [cargarDatos])

  const calcularProgreso = (fecha) => {
    const inicio = new Date(fecha || hoy)
    const diasPasados = Math.floor((hoy - inicio) / (1000 * 60 * 60 * 24))
    const diasReales = Math.max(0, diasPasados)
    const porcentaje = Math.min(100, (diasReales / 365) * 100)
    
    return {
      dias: diasReales, meses: Math.floor(diasReales / 30), porcentaje, cumplido: diasReales >= 365
    }
  }

  const agregarPlancha = async (e) => {
    e.preventDefault()
    if (!nuevaPlancha.trim()) return
    setGuardandoPlancha(true)

    const { error } = await supabase
      .from('planchas')
      .insert({ hermano_id: modalObrero.id, titulo: nuevaPlancha.trim(), estado: 'presentada' })

    if (error) {
      alert("Error al guardar la plancha: " + error.message)
    } else {
      await cargarDatos()
      setNuevaPlancha('')
      // Refrescamos el modal del obrero actual
      const actualizado = (await supabase.from('hermanos').select('*, planchas(*)').eq('id', modalObrero.id).single()).data
      setModalObrero(actualizado)
    }
    setGuardandoPlancha(false)
  }

  const cambiarEstadoPlancha = async (planchaId, nuevoEstado) => {
    const fechaLectura = nuevoEstado === 'leida' ? new Date().toISOString().split('T') : null
    const { error } = await supabase.from('planchas').update({ estado: nuevoEstado, fecha_lectura: fechaLectura }).eq('id', planchaId)
    
    if (error) {
      alert("Error al actualizar estado: " + error.message)
    } else {
      await cargarDatos()
      const actualizado = (await supabase.from('hermanos').select('*, planchas(*)').eq('id', modalObrero.id).single()).data
      setModalObrero(actualizado)
    }
  }

  const agregarInstruccion = async (e) => {
    e.preventDefault()
    setGuardandoInstruccion(true)

    const { error } = await supabase
      .from('instrucciones')
      .insert({
        grado_objetivo: 2,
        titulo: formInstruccion.titulo,
        fecha: formInstruccion.fecha,
        horario: formInstruccion.horario,
        modalidad: formInstruccion.modalidad,
        ubicacion_o_link: formInstruccion.ubicacion_o_link
      })

    if (error) {
      alert("Error al guardar la instrucción: " + error.message)
    } else {
      await cargarDatos()
      setModalInstruccion(false)
      setFormInstruccion({ titulo: '', fecha: '', horario: '', modalidad: 'presencial', ubicacion_o_link: '' })
    }
    setGuardandoInstruccion(false)
  }

  const abrirModalAsistencia = async (instruccion) => {
    setModalAsistencia(instruccion)
    const estadoInicial = {}
    obreros.forEach(o => estadoInicial[o.id] = true)

    const { data } = await supabase
      .from('asistencia_instrucciones')
      .select('hermano_id, presente')
      .eq('instruccion_id', instruccion.id)

    if (data && data.length > 0) {
      data.forEach(reg => { estadoInicial[reg.hermano_id] = reg.presente })
    }
    setEstadoAsistencia(estadoInicial)
  }

  const toggleAsistencia = (hermanoId) => {
    setEstadoAsistencia(prev => ({ ...prev, [hermanoId]: !prev[hermanoId] }))
  }

  const guardarAsistencia = async () => {
    setGuardandoAsistencia(true)
    await supabase.from('asistencia_instrucciones').delete().eq('instruccion_id', modalAsistencia.id)
    const records = obreros.map(o => ({
      instruccion_id: modalAsistencia.id, hermano_id: o.id, presente: estadoAsistencia[o.id] || false
    }))

    if (records.length > 0) {
      const { error } = await supabase.from('asistencia_instrucciones').insert(records)
      if (error) alert("Error al guardar asistencia: " + error.message)
    }
    setGuardandoAsistencia(false)
    setModalAsistencia(null)
  }

  // Función corregida a prueba de balas para formatear fechas
  const formatearFecha = (fechaString) => {
    if (!fechaString) return 'Fecha a definir'
    try {
      const soloFecha = fechaString.split('T').split(' ')
      const [year, month, day] = soloFecha.split('-')
      return `${day}/${month}/${year}`
    } catch (e) {
      return 'Fecha inválida'
    }
  }

  if (cargando) return <p style={{ padding: '2rem', color: 'var(--color-gris)', fontFamily: 'var(--font-montserrat)' }}>Pasando lista en la Columna Sur...</p>

  return (
    <div style={{ maxWidth: '1000px', paddingBottom: '4rem', fontFamily: 'var(--font-montserrat)' }}>
      
      {/* MODAL PLANCHAS */}
      {modalObrero && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem', backdropFilter: 'blur(3px)' }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '12px', width: '100%', maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto', border: '1px solid rgba(207, 181, 59, 0.3)', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
            <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid rgba(207, 181, 59, 0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fafaf8' }}>
              <h2 style={{ fontSize: '20px', color: 'var(--color-institucional)', margin: 0, fontWeight: '600', fontFamily: 'var(--font-baskerville)' }}>Trazados de {modalObrero.nombre}</h2>
              <button onClick={() => setModalObrero(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-gris)', transition: 'color 0.2s' }} onMouseOver={e => e.currentTarget.style.color = '#B33A3A'} onMouseOut={e => e.currentTarget.style.color = 'var(--color-gris)'}><X size={24} /></button>
            </div>
            <div style={{ padding: '2rem' }}>
              <form onSubmit={agregarPlancha} style={{ marginBottom: '2rem', display: 'flex', gap: '12px' }}>
                <input type="text" value={nuevaPlancha} onChange={e => setNuevaPlancha(e.target.value)} placeholder="Título del Trazado..." style={estiloInput} />
                <button type="submit" disabled={guardandoPlancha} style={{ backgroundColor: 'var(--color-institucional)', color: 'var(--color-oro)', border: '1px solid var(--color-oro)', padding: '0 20px', borderRadius: '8px', cursor: guardandoPlancha ? 'not-allowed' : 'pointer', fontWeight: '600', transition: 'all 0.2s', opacity: guardandoPlancha ? 0.7 : 1 }} onMouseOver={e => !guardandoPlancha && (e.currentTarget.style.backgroundColor = '#111122')} onMouseOut={e => !guardandoPlancha && (e.currentTarget.style.backgroundColor = 'var(--color-institucional)')}>
                  {guardandoPlancha ? '...' : 'Cargar'}
                </button>
              </form>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {modalObrero.planchas?.length === 0 && <p style={{ color: 'var(--color-gris)', fontSize: '13px', textAlign: 'center', fontStyle: 'italic' }}>No hay trazados registrados para este Compañero.</p>}
                {modalObrero.planchas?.map(p => (
                  <div key={p.id} style={{ border: '1px solid #d1d0c8', borderRadius: '8px', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                    <span style={{ fontSize: '14px', color: 'var(--color-institucional)', fontWeight: '600' }}>{p.titulo}</span>
                    <select 
                      value={p.estado} 
                      onChange={(e) => cambiarEstadoPlancha(p.id, e.target.value)} 
                      style={{ 
                        padding: '8px 12px', 
                        borderRadius: '6px', 
                        fontSize: '12px', 
                        fontWeight: '600', 
                        border: '1px solid #d1d0c8', 
                        outline: 'none', 
                        cursor: 'pointer',
                        backgroundColor: p.estado === 'leida' ? '#EAF3DE' : p.estado === 'bajo_mallete' ? '#FCEBEB' : '#fafaf8',
                        color: p.estado === 'leida' ? '#4A8516' : p.estado === 'bajo_mallete' ? '#B33A3A' : 'var(--color-institucional)'
                      }}
                    >
                      <option value="presentada">En Secretaría</option>
                      <option value="bajo_mallete">Bajo Mallete</option>
                      <option value="leida">Leída en Templo</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL NUEVA INSTRUCCIÓN */}
      {modalInstruccion && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem', backdropFilter: 'blur(3px)' }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '12px', width: '100%', maxWidth: '480px', border: '1px solid rgba(207, 181, 59, 0.3)', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
            <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid rgba(207, 181, 59, 0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fafaf8' }}>
              <h2 style={{ fontSize: '18px', color: 'var(--color-institucional)', margin: 0, fontWeight: '600', fontFamily: 'var(--font-baskerville)' }}>Programar Instrucción</h2>
              <button onClick={() => setModalInstruccion(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-gris)', transition: 'color 0.2s' }} onMouseOver={e => e.currentTarget.style.color = '#B33A3A'} onMouseOut={e => e.currentTarget.style.color = 'var(--color-gris)'}><X size={24} /></button>
            </div>
            <form onSubmit={agregarInstruccion} style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={estiloLabel}>Tema / Título</label>
                <input type="text" required value={formInstruccion.titulo} onChange={e => setFormInstruccion({...formInstruccion, titulo: e.target.value})} style={estiloInput} placeholder="Ej: Simbolismo de la Estrella Flamígera" />
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={estiloLabel}>Fecha</label>
                  <input type="date" required value={formInstruccion.fecha} onChange={e => setFormInstruccion({...formInstruccion, fecha: e.target.value})} style={estiloInput} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={estiloLabel}>Horario</label>
                  <input type="time" required value={formInstruccion.horario} onChange={e => setFormInstruccion({...formInstruccion, horario: e.target.value})} style={estiloInput} />
                </div>
              </div>
              
              <div>
                <label style={estiloLabel}>Modalidad</label>
                <select value={formInstruccion.modalidad} onChange={e => setFormInstruccion({...formInstruccion, modalidad: e.target.value})} style={estiloInput}>
                  <option value="presencial">Presencial (Templo)</option>
                  <option value="virtual">Virtual (Zoom/Meet)</option>
                </select>
              </div>
              <div>
                <label style={estiloLabel}>{formInstruccion.modalidad === 'virtual' ? 'Enlace de Reunión' : 'Lugar / Sala'}</label>
                <input type="text" value={formInstruccion.ubicacion_o_link} onChange={e => setFormInstruccion({...formInstruccion, ubicacion_o_link: e.target.value})} style={estiloInput} placeholder={formInstruccion.modalidad === 'virtual' ? 'https://zoom.us/...' : 'Sala de Pasos Perdidos'} />
              </div>

              <button type="submit" disabled={guardandoInstruccion} style={{ backgroundColor: 'var(--color-institucional)', color: 'var(--color-oro)', border: '1px solid var(--color-oro)', padding: '14px', borderRadius: '8px', fontWeight: '600', cursor: guardandoInstruccion ? 'not-allowed' : 'pointer', marginTop: '10px', transition: 'all 0.2s', opacity: guardandoInstruccion ? 0.7 : 1, boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }} onMouseOver={e => !guardandoInstruccion && (e.currentTarget.style.backgroundColor = '#111122')} onMouseOut={e => !guardandoInstruccion && (e.currentTarget.style.backgroundColor = 'var(--color-institucional)')}>
                {guardandoInstruccion ? 'Guardando...' : 'Programar Clase'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ASISTENCIA */}
      {modalAsistencia && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem', backdropFilter: 'blur(3px)' }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '12px', width: '100%', maxWidth: '480px', border: '1px solid rgba(207, 181, 59, 0.3)', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
            <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid rgba(207, 181, 59, 0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fafaf8' }}>
              <h2 style={{ fontSize: '18px', color: 'var(--color-institucional)', margin: 0, fontWeight: '600', fontFamily: 'var(--font-baskerville)' }}>Tomar Asistencia</h2>
              <button onClick={() => setModalAsistencia(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-gris)', transition: 'color 0.2s' }} onMouseOver={e => e.currentTarget.style.color = '#B33A3A'} onMouseOut={e => e.currentTarget.style.color = 'var(--color-gris)'}><X size={24} /></button>
            </div>
            <div style={{ padding: '2rem', maxHeight: '50vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {obreros.map(o => (
                  <div 
                    key={o.id} 
                    onClick={() => toggleAsistencia(o.id)} 
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      padding: '14px 16px', 
                      border: `1px solid ${estadoAsistencia[o.id] ? '#D4EAB6' : '#F8D7D7'}`, 
                      borderRadius: '8px', 
                      cursor: 'pointer', 
                      backgroundColor: estadoAsistencia[o.id] ? '#EAF3DE' : '#FCEBEB',
                      transition: 'all 0.2s'
                    }}
                  >
                    <span style={{ fontSize: '14px', fontWeight: '600', color: estadoAsistencia[o.id] ? '#27500A' : '#791F1F' }}>{o.apellido}, {o.nombre}</span>
                    <span style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.05em', color: estadoAsistencia[o.id] ? '#4A8516' : '#B33A3A' }}>{estadoAsistencia[o.id] ? 'PRESENTE' : 'AUSENTE'}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ padding: '1.5rem 2rem', borderTop: '1px solid rgba(207, 181, 59, 0.15)', textAlign: 'right', backgroundColor: '#fafaf8' }}>
              <button onClick={guardarAsistencia} disabled={guardandoAsistencia} style={{ backgroundColor: 'var(--color-institucional)', color: 'var(--color-oro)', border: '1px solid var(--color-oro)', padding: '12px 24px', borderRadius: '8px', fontWeight: '600', cursor: guardandoAsistencia ? 'not-allowed' : 'pointer', transition: 'all 0.2s', opacity: guardandoAsistencia ? 0.7 : 1, boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }} onMouseOver={e => !guardandoAsistencia && (e.currentTarget.style.backgroundColor = '#111122')} onMouseOut={e => !guardandoAsistencia && (e.currentTarget.style.backgroundColor = 'var(--color-institucional)')}>
                {guardandoAsistencia ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TITULO */}
      <div style={{ marginBottom: '2.5rem', borderBottom: '1px solid rgba(207, 181, 59, 0.2)', paddingBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '600', color: 'var(--color-institucional)', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: '12px', fontFamily: 'var(--font-baskerville)' }}>
          <Users color="var(--color-oro)" size={32} /> Columna Sur
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--color-gris)', margin: 0 }}>Gestión de Compañeros y Plan de Instrucción.</p>
      </div>

      {/* GRILLA OBREROS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '3.5rem' }}>
        {obreros.map(obrero => {
            // El Compañero cuenta su antigüedad desde el Aumento de Salario. 
            // Si no está cargado, usa la iniciación o la fecha de creación como respaldo.
            const fechaAntiguedad = obrero.fecha_aumento || obrero.fecha_iniciacion || obrero.created_at
            const progreso = calcularProgreso(fechaAntiguedad)
          return (
            <div key={obrero.id} style={{ backgroundColor: '#fff', border: '1px solid rgba(207, 181, 59, 0.2)', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(207, 181, 59, 0.15)' }}>
                  <h3 style={{ margin: '0 0 6px', fontSize: '18px', color: 'var(--color-institucional)', fontWeight: '700', fontFamily: 'var(--font-montserrat)' }}>{obrero.apellido}, {obrero.nombre}</h3>
                  <p style={{ fontSize: '12px', color: 'var(--color-gris)', margin: 0, display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '500' }}>
                    <Clock size={12} color="var(--color-oro)" /> Aumento: {formatearFecha(fechaAntiguedad)}
                  </p>
                </div>
              <div style={{ padding: '1.5rem', backgroundColor: '#fafaf8' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <span style={{ color: 'var(--color-gris)' }}>Progreso Anual</span>
                  <span style={{ color: progreso.cumplido ? '#4A8516' : 'var(--color-oro)' }}>{progreso.meses} MESES</span>
                </div>
                <div style={{ width: '100%', backgroundColor: '#e8e6e0', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${progreso.porcentaje}%`, backgroundColor: progreso.cumplido ? '#4A8516' : 'var(--color-oro)', height: '100%', transition: 'width 0.5s ease-out' }}></div>
                </div>
              </div>
              <div style={{ padding: '1.5rem', borderTop: '1px solid #f0efe9' }}>
                <button 
                  onClick={() => setModalObrero(obrero)} 
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #d1d0c8', backgroundColor: '#fff', color: 'var(--color-institucional)', cursor: 'pointer', fontSize: '13px', fontWeight: '600', transition: 'all 0.2s' }}
                  onMouseOver={e => { e.currentTarget.style.backgroundColor = 'var(--color-institucional)'; e.currentTarget.style.color = 'var(--color-oro)'; e.currentTarget.style.borderColor = 'var(--color-oro)' }}
                  onMouseOut={e => { e.currentTarget.style.backgroundColor = '#fff'; e.currentTarget.style.color = 'var(--color-institucional)'; e.currentTarget.style.borderColor = '#d1d0c8' }}
                >
                  Gestionar Trazados ({obrero.planchas?.length || 0})
                </button>
              </div>
            </div>
          )
        })}
        {obreros.length === 0 && (
          <div style={{ gridColumn: '1 / -1', padding: '3rem', textAlign: 'center', border: '1px dashed #d1d0c8', borderRadius: '12px', backgroundColor: '#fafaf8' }}>
            <p style={{ color: 'var(--color-gris)', fontSize: '14px', margin: 0 }}>No hay Compañeros activos en la Columna Sur.</p>
          </div>
        )}
      </div>

      {/* PLAN DE INSTRUCCION */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h2 style={{ fontSize: '22px', color: 'var(--color-institucional)', fontWeight: '600', margin: 0, fontFamily: 'var(--font-baskerville)' }}>Plan de Instrucción</h2>
        <button 
          onClick={() => setModalInstruccion(true)} 
          style={{ backgroundColor: 'var(--color-institucional)', color: 'var(--color-oro)', border: '1px solid var(--color-oro)', padding: '10px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}
          onMouseOver={e => e.currentTarget.style.backgroundColor = '#111122'}
          onMouseOut={e => e.currentTarget.style.backgroundColor = 'var(--color-institucional)'}
        >
          + Programar Clase
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {instrucciones.map(inst => (
          <div key={inst.id} style={{ backgroundColor: '#fff', border: '1px solid rgba(207, 181, 59, 0.2)', borderRadius: '12px', padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
            <div>
              <h4 style={{ fontSize: '16px', color: 'var(--color-institucional)', fontWeight: '700', margin: '0 0 10px' }}>{inst.titulo}</h4>
              <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: 'var(--color-gris)', flexWrap: 'wrap', fontWeight: '500' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Clock size={14} color="var(--color-oro)" /> 
                  {formatearFecha(inst.fecha)} a las {inst.horario} hs
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {inst.modalidad === 'virtual' ? <Video size={14} color="var(--color-oro)" /> : <MapPin size={14} color="var(--color-oro)" />}
                  {inst.modalidad === 'virtual' ? 'Virtual' : 'Presencial'} ({inst.ubicacion_o_link || 'Ubicación pendiente'})
                </span>
              </div>
            </div>
            <button 
              onClick={() => abrirModalAsistencia(inst)} 
              style={{ backgroundColor: '#fafaf8', color: 'var(--color-institucional)', border: '1px solid rgba(207, 181, 59, 0.4)', padding: '10px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseOver={e => { e.currentTarget.style.backgroundColor = 'var(--color-institucional)'; e.currentTarget.style.color = 'var(--color-oro)' }}
              onMouseOut={e => { e.currentTarget.style.backgroundColor = '#fafaf8'; e.currentTarget.style.color = 'var(--color-institucional)' }}
            >
              Tomar Asistencia
            </button>
          </div>
        ))}
        {instrucciones.length === 0 && (
          <div style={{ padding: '2rem', textAlign: 'center', border: '1px solid #e8e6e0', borderRadius: '12px', backgroundColor: '#fff' }}>
            <p style={{ color: 'var(--color-gris)', fontSize: '14px', margin: 0 }}>No hay clases de instrucción programadas.</p>
          </div>
        )}
      </div>
    </div>
  )
}

const estiloInput = { width: '100%', padding: '12px 14px', fontSize: '14px', border: '1px solid #d1d0c8', borderRadius: '8px', color: 'var(--color-institucional)', backgroundColor: '#fff', outline: 'none', boxSizing: 'border-box', fontFamily: 'var(--font-montserrat)', transition: 'border-color 0.2s' }
const estiloLabel = { display: 'block', fontSize: '11px', color: 'var(--color-institucional)', marginBottom: '8px', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.05em', fontFamily: 'var(--font-montserrat)' }