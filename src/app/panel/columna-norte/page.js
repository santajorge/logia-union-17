'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Users, Clock, FileText, CheckCircle2, X, Gavel, BookOpen, CalendarPlus, MapPin, Video, UserCheck } from 'lucide-react'

export default function ColumnaNortePage() {
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
          id, nombre, apellido, email, telefono, created_at, fecha_iniciacion,
          planchas (id, titulo, estado, fecha_presentacion, fecha_lectura)
        `)
        .eq('grado', 1)
        .eq('activo', true)
        .order('created_at', { ascending: true })

      const { data: dataInstrucciones, error: errI } = await supabase
        .from('instrucciones')
        .select('*')
        .eq('grado_objetivo', 1)
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
        grado_objetivo: 1,
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

  // Función a prueba de balas para formatear fechas de Supabase
  const formatearFecha = (fechaString) => {
    if (!fechaString) return 'Fecha a definir'
    try {
      // Corta por la "T" o por el espacio vacio, lo que sea que mande Supabase
      const soloFecha = fechaString.split('T').split(' ')
      const [year, month, day] = soloFecha.split('-')
      return `${day}/${month}/${year}`
    } catch (e) {
      return 'Fecha inválida'
    }
  }

  if (cargando) return <p style={{ padding: '2rem', color: '#1a1a2e' }}>Pasando lista en la Columna Norte...</p>

  return (
    <div style={{ maxWidth: '1000px', paddingBottom: '3rem', color: '#1a1a2e' }}>
      
      {/* MODAL PLANCHAS */}
      {modalObrero && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '12px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', border: '1px solid #c8c5b8' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid #e8e6e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fafaf8' }}>
              <h2 style={{ fontSize: '18px', color: '#1a1a2e', margin: 0, fontWeight: '600' }}>Trazados de {modalObrero.nombre}</h2>
              <button onClick={() => setModalObrero(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888' }}><X size={24} /></button>
            </div>
            <div style={{ padding: '1.5rem' }}>
              <form onSubmit={agregarPlancha} style={{ marginBottom: '1.5rem', display: 'flex', gap: '10px' }}>
                <input type="text" value={nuevaPlancha} onChange={e => setNuevaPlancha(e.target.value)} placeholder="Título del Trazado..." style={estiloInput} />
                <button type="submit" disabled={guardandoPlancha} style={{ backgroundColor: '#1a1a2e', color: '#fff', border: 'none', padding: '0 15px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>{guardandoPlancha ? '...' : 'Cargar'}</button>
              </form>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {modalObrero.planchas?.map(p => (
                  <div key={p.id} style={{ border: '1px solid #e8e6e0', borderRadius: '8px', padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff' }}>
                    <span style={{ fontSize: '14px', color: '#1a1a2e', fontWeight: '500' }}>{p.titulo}</span>
                    <select value={p.estado} onChange={(e) => cambiarEstadoPlancha(p.id, e.target.value)} style={{ padding: '6px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', border: '1px solid #c8c5b8', outline: 'none', cursor: 'pointer' }}>
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
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '12px', width: '100%', maxWidth: '450px', border: '1px solid #c8c5b8' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid #e8e6e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '18px', color: '#1a1a2e', margin: 0, fontWeight: '600' }}>Programar Instrucción</h2>
              <button onClick={() => setModalInstruccion(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888' }}><X size={24} /></button>
            </div>
            <form onSubmit={agregarInstruccion} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={estiloLabel}>Tema / Título</label>
                <input type="text" required value={formInstruccion.titulo} onChange={e => setFormInstruccion({...formInstruccion, titulo: e.target.value})} style={estiloInput} placeholder="Ej: Simbolismo de las Herramientas" />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <label style={estiloLabel}>Fecha</label>
                  <input type="date" required value={formInstruccion.fecha} onChange={e => setFormInstruccion({...formInstruccion, fecha: e.target.value})} style={estiloInput} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={estiloLabel}>Horario</label>
                  <input type="time" required value={formInstruccion.horario} onChange={e => setFormInstruccion({...formInstruccion, horario: e.target.value})} style={estiloInput} />
                </div>
              </div>
              
              {/* --- CAMPOS RECUPERADOS --- */}
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
              {/* --------------------------- */}

              <button type="submit" disabled={guardandoInstruccion} style={{ backgroundColor: '#3B6D11', color: '#fff', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', marginTop: '10px' }}>
                {guardandoInstruccion ? 'Guardando...' : 'Programar Clase'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ASISTENCIA */}
      {modalAsistencia && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '12px', width: '100%', maxWidth: '450px', border: '1px solid #c8c5b8' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid #e8e6e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fafaf8' }}>
              <h2 style={{ fontSize: '18px', color: '#1a1a2e', margin: 0, fontWeight: '600' }}>Tomar Asistencia</h2>
              <button onClick={() => setModalAsistencia(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888' }}><X size={24} /></button>
            </div>
            <div style={{ padding: '1.5rem', maxHeight: '50vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {obreros.map(o => (
                  <div key={o.id} onClick={() => toggleAsistencia(o.id)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', border: '1px solid #e8e6e0', borderRadius: '8px', cursor: 'pointer', backgroundColor: estadoAsistencia[o.id] ? '#EAF3DE' : '#FCEBEB' }}>
                    <span style={{ fontSize: '14px', fontWeight: '600' }}>{o.apellido}, {o.nombre}</span>
                    <span style={{ fontSize: '11px', fontWeight: 'bold' }}>{estadoAsistencia[o.id] ? 'PRESENTE' : 'AUSENTE'}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ padding: '1.5rem', borderTop: '1px solid #e8e6e0', textAlign: 'right' }}>
              <button onClick={guardarAsistencia} disabled={guardandoAsistencia} style={{ backgroundColor: '#3B6D11', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>{guardandoAsistencia ? 'Guardando...' : 'Guardar'}</button>
            </div>
          </div>
        </div>
      )}

      {/* TITULO */}
      <div style={{ marginBottom: '2rem', borderBottom: '1px solid #e8e6e0', paddingBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '600', color: '#1a1a2e', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Users color="#CDA434" size={28} /> Columna Norte
        </h1>
        <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>Gestión de Aprendices y Plan de Instrucción.</p>
      </div>

      {/* GRILLA OBREROS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        {obreros.map(obrero => {
          const progreso = calcularProgreso(obrero.fecha_iniciacion || obrero.created_at)
          return (
            <div key={obrero.id} style={{ backgroundColor: '#fff', border: '1px solid #e8e6e0', borderRadius: '12px', overflow: 'hidden' }}>
              <div style={{ padding: '1.5rem', borderBottom: '1px solid #f0efe9' }}>
                <h3 style={{ margin: '0 0 4px', fontSize: '18px', color: '#1a1a2e', fontWeight: '600' }}>{obrero.apellido}, {obrero.nombre}</h3>
                <p style={{ fontSize: '12px', color: '#888', margin: 0 }}>Iniciado: {new Date(obrero.fecha_iniciacion || obrero.created_at).toLocaleDateString('es-AR')}</p>
              </div>
              <div style={{ padding: '1.25rem 1.5rem', backgroundColor: '#fafaf8' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '8px', fontWeight: '600' }}>
                  <span>Progreso Anual</span>
                  <span style={{ color: progreso.cumplido ? '#3B6D11' : '#CDA434' }}>{progreso.meses} MESES</span>
                </div>
                <div style={{ width: '100%', backgroundColor: '#e8e6e0', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${progreso.porcentaje}%`, backgroundColor: progreso.cumplido ? '#3B6D11' : '#CDA434', height: '100%' }}></div>
                </div>
              </div>
              <div style={{ padding: '1.5rem' }}>
                <button onClick={() => setModalObrero(obrero)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #c8c5b8', backgroundColor: '#fff', color: '#1a1a2e', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>Gestionar Trazados ({obrero.planchas?.length || 0})</button>
              </div>
            </div>
          )
        })}
      </div>

      {/* PLAN DE INSTRUCCION */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '18px', color: '#1a1a2e', fontWeight: '600', margin: 0 }}>Plan de Instrucción</h2>
        <button onClick={() => setModalInstruccion(true)} style={{ backgroundColor: '#1a1a2e', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>+ Programar Clase</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {instrucciones.map(inst => (
          <div key={inst.id} style={{ backgroundColor: '#fff', border: '1px solid #e8e6e0', borderRadius: '12px', padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h4 style={{ fontSize: '16px', color: '#1a1a2e', fontWeight: '600', margin: '0 0 6px' }}>{inst.titulo}</h4>
              <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#666', flexWrap: 'wrap' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={14} /> 
                  {inst.fecha ? new Date(inst.fecha.split('T') + 'T00:00:00').toLocaleDateString('es-AR') : 'Fecha a definir'} a las {inst.horario} hs
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {inst.modalidad === 'virtual' ? <Video size={14} /> : <MapPin size={14} />}
                  {inst.modalidad === 'virtual' ? 'Virtual' : 'Presencial'} ({inst.ubicacion_o_link || 'Ubicación pendiente'})
                </span>
              </div>
            </div>
            <button onClick={() => abrirModalAsistencia(inst)} style={{ backgroundColor: '#f5f4f0', color: '#1a1a2e', border: '1px solid #c8c5b8', padding: '8px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
              Tomar Asistencia
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

const estiloInput = { width: '100%', padding: '10px 12px', fontSize: '14px', border: '1px solid #c8c5b8', borderRadius: '8px', color: '#1a1a2e', backgroundColor: '#fff', outline: 'none', boxSizing: 'border-box' }
const estiloLabel = { display: 'block', fontSize: '11px', color: '#666', marginBottom: '4px', textTransform: 'uppercase', fontWeight: '600' }