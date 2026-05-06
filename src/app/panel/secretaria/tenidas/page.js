'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Mail } from 'lucide-react'

export default function LibroAsistenciasPage() {
  const router = useRouter()
  const [tenidas, setTenidas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [abriendoNueva, setAbriendoNueva] = useState(false)
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  
  // Estado para controlar qué tenida está enviando la convocatoria
  const [enviandoConvocatoria, setEnviandoConvocatoria] = useState(null)

  const [nuevaTenida, setNuevaTenida] = useState({
    fecha: new Date().toISOString().split('T')[0],
    tipo: 'ordinaria',
    grado: 1,
    acta_nro: ''
  })

  useEffect(() => {
    async function cargarTenidas() {
      const { data, error } = await supabase
        .from('tenidas')
        .select('*')
        .order('fecha', { ascending: false })

      if (!error && data) {
        setTenidas(data)
      }
      setCargando(false)
    }

    cargarTenidas()
  }, [])

  const handleAbrirTenida = async (e) => {
    e.preventDefault()
    setAbriendoNueva(true)

    const { data, error } = await supabase
      .from('tenidas')
      .insert([{
        fecha: nuevaTenida.fecha,
        tipo: nuevaTenida.tipo,
        grado: parseInt(nuevaTenida.grado),
        acta_nro: nuevaTenida.acta_nro || null,
        estado: 'abierta'
      }])
      .select()
      .single()

    if (!error && data) {
      // Viajamos a la pantalla de la tenida para pasar lista
      router.push(`/panel/secretaria/tenidas/${data.id}`)
    } else {
      console.error('Error al abrir tenida:', error)
      setAbriendoNueva(false)
    }
  }

  // --- NUEVA FUNCIÓN PARA ENVIAR CORREOS ---
  const handleEnviarConvocatoria = async (tenida) => {
    if (!window.confirm(`¿Estás seguro de enviar la convocatoria por correo a todo el Cuadro Lógico para la Tenida del ${formatFecha(tenida.fecha)}?`)) return;

    setEnviandoConvocatoria(tenida.id);

    try {
      // Acá deberás apuntar a la ruta de tu API que se encargue de enviar los emails (ej: Resend, Nodemailer)
      const res = await fetch('/api/secretaria/convocatoria', {
        method: 'POST',
        body: JSON.stringify({ 
          tenidaId: tenida.id, 
          fecha: tenida.fecha, 
          tipo: tenida.tipo, 
          grado: tenida.grado 
        }),
        headers: { 'Content-Type': 'application/json' }
      });

      if (res.ok) {
        alert('✅ Convocatoria enviada exitosamente a todos los hermanos.');
      } else {
        alert('⚠️ Hubo un problema al procesar el envío de la convocatoria.');
      }
    } catch (error) {
      alert('Error de conexión al intentar enviar los correos.');
    } finally {
      setEnviandoConvocatoria(null);
    }
  }

  const formatFecha = (fecha) => {
    return new Date(fecha + 'T00:00:00').toLocaleDateString('es-AR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    })
  }

  return (
    <div style={{ maxWidth: '950px', fontFamily: 'var(--font-montserrat)' }}>
      
      {/* CABECERA */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '600', color: 'var(--color-institucional)', margin: '0 0 6px', fontFamily: 'var(--font-baskerville)' }}>
            Libro de Asistencias
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--color-gris)', margin: 0 }}>
            Registro histórico de Tenidas, convocatorias y control de presencialidad.
          </p>
        </div>
        <button 
          onClick={() => setMostrarFormulario(!mostrarFormulario)}
          style={{ 
            backgroundColor: mostrarFormulario ? '#fafaf8' : 'var(--color-institucional)', 
            color: mostrarFormulario ? 'var(--color-gris)' : 'var(--color-oro)', 
            border: mostrarFormulario ? '1px solid #d1d0c8' : '1px solid var(--color-oro)', 
            padding: '12px 24px', 
            borderRadius: '8px', 
            fontSize: '14px', 
            fontWeight: '600', 
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: mostrarFormulario ? 'none' : '0 4px 6px rgba(0,0,0,0.05)'
          }}
          onMouseOver={e => !mostrarFormulario && (e.currentTarget.style.backgroundColor = '#111122')}
          onMouseOut={e => !mostrarFormulario && (e.currentTarget.style.backgroundColor = 'var(--color-institucional)')}
        >
          {mostrarFormulario ? '✖ Cancelar Apertura' : '+ Registrar Nueva Tenida'}
        </button>
      </div>

      {/* FORMULARIO NUEVA TENIDA */}
      {mostrarFormulario && (
        <div style={{ backgroundColor: '#ffffff', border: '1px solid rgba(207, 181, 59, 0.5)', borderRadius: '12px', padding: '1.5rem 2rem', marginBottom: '2.5rem', boxShadow: '0 4px 15px rgba(207, 181, 59, 0.08)' }}>
          <h3 style={{ fontSize: '14px', color: 'var(--color-institucional)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 1.25rem', fontWeight: '700' }}>Apertura de Trabajos</h3>
          
          <form onSubmit={handleAbrirTenida} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1.5rem', alignItems: 'end' }}>
            <div>
              <label style={estiloLabel}>Fecha *</label>
              <input type="date" value={nuevaTenida.fecha} onChange={(e) => setNuevaTenida({...nuevaTenida, fecha: e.target.value})} style={estiloInput} required />
            </div>
            
            <div>
              <label style={estiloLabel}>Tipo de Tenida *</label>
              <select value={nuevaTenida.tipo} onChange={(e) => setNuevaTenida({...nuevaTenida, tipo: e.target.value})} style={estiloInput}>
                <option value="ordinaria">Ordinaria</option>
                <option value="magna">Magna</option>
                <option value="extraordinaria">Extraordinaria</option>
                <option value="administrativa">Administrativa</option>
              </select>
            </div>

            <div>
              <label style={estiloLabel}>Grado *</label>
              <select value={nuevaTenida.grado} onChange={(e) => setNuevaTenida({...nuevaTenida, grado: e.target.value})} style={estiloInput}>
                <option value="1">1º - Aprendiz</option>
                <option value="2">2º - Compañero</option>
                <option value="3">3º - Maestro</option>
              </select>
            </div>

            <div>
              <label style={estiloLabel}>Nº Balaustre (Opcional)</label>
              <input type="text" placeholder="Ej: 142" value={nuevaTenida.acta_nro} onChange={(e) => setNuevaTenida({...nuevaTenida, acta_nro: e.target.value})} style={estiloInput} />
            </div>

            <button 
              type="submit" 
              disabled={abriendoNueva} 
              style={{ 
                backgroundColor: 'var(--color-institucional)', 
                color: 'var(--color-oro)', 
                border: '1px solid var(--color-oro)', 
                padding: '12px 16px', 
                borderRadius: '8px', 
                fontSize: '13px', 
                fontWeight: '600', 
                cursor: abriendoNueva ? 'not-allowed' : 'pointer', 
                whiteSpace: 'nowrap', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '8px',
                transition: 'all 0.2s',
                opacity: abriendoNueva ? 0.7 : 1
              }}
              onMouseOver={e => !abriendoNueva && (e.currentTarget.style.backgroundColor = '#111122')}
              onMouseOut={e => !abriendoNueva && (e.currentTarget.style.backgroundColor = 'var(--color-institucional)')}
            >
                {abriendoNueva ? 'Abriendo...' : <>Guardar y Pasar Lista <span style={{ fontSize: '15px' }}>➔</span></>}
            </button>
          </form>
        </div>
      )}

      {/* LISTADO DE TENIDAS HISTÓRICAS */}
      <div style={{ backgroundColor: '#ffffff', border: '1px solid rgba(207, 181, 59, 0.2)', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
        {cargando ? (
          <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-gris)', fontSize: '14px' }}>Cargando historial...</p>
        ) : tenidas.length === 0 ? (
          <div style={{ padding: '3.5rem 2rem', textAlign: 'center' }}>
            <p style={{ fontSize: '14px', color: 'var(--color-gris)', margin: 0 }}>No hay Tenidas registradas en el libro.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', minWidth: '700px', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#fafaf8', borderBottom: '1px solid rgba(207, 181, 59, 0.15)' }}>
                  <th style={estiloTh}>Fecha</th>
                  <th style={estiloTh}>Tipo y Grado</th>
                  <th style={estiloTh}>Balaustre</th>
                  <th style={estiloTh}>Estado</th>
                  <th style={{...estiloTh, textAlign: 'right'}}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {tenidas.map((tenida) => (
                  <tr 
                    key={tenida.id} 
                    style={{ borderBottom: '1px solid #f0efe9', transition: 'background-color 0.2s' }}
                    onMouseOver={e => e.currentTarget.style.backgroundColor = '#f4f3ed'}
                    onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <td style={estiloTd}>
                      <span style={{ textTransform: 'capitalize', fontWeight: '600', color: 'var(--color-institucional)', fontSize: '14px' }}>
                        {formatFecha(tenida.fecha)}
                      </span>
                    </td>
                    <td style={estiloTd}>
                      <span style={{ color: 'var(--color-institucional)', fontWeight: '500' }}>
                        Tenida {tenida.tipo.charAt(0).toUpperCase() + tenida.tipo.slice(1)}
                      </span> <br/>
                      <span style={{ fontSize: '12px', color: 'var(--color-gris)' }}>Grado {tenida.grado}</span>
                    </td>
                    <td style={estiloTd}>
                      {tenida.acta_nro ? `Nº ${tenida.acta_nro}` : <span style={{color: '#ccc', fontStyle: 'italic'}}>—</span>}
                    </td>
                    <td style={estiloTd}>
                      <span style={{ 
                        padding: '4px 10px', 
                        borderRadius: '6px', 
                        fontSize: '11px', 
                        fontWeight: '700', 
                        textTransform: 'uppercase',
                        letterSpacing: '0.02em',
                        border: `1px solid ${tenida.estado === 'abierta' ? '#D4EAB6' : '#d1d0c8'}`,
                        backgroundColor: tenida.estado === 'abierta' ? '#EAF3DE' : '#f5f4f0',
                        color: tenida.estado === 'abierta' ? '#4A8516' : 'var(--color-gris)'
                      }}>
                        {tenida.estado}
                      </span>
                    </td>
                    <td style={{...estiloTd, textAlign: 'right'}}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px' }}>
                        
                        {/* Botón de Enviar Convocatoria */}
                        {tenida.estado === 'abierta' && (
                          <button 
                            onClick={() => handleEnviarConvocatoria(tenida)}
                            disabled={enviandoConvocatoria === tenida.id}
                            title="Enviar Convocatoria"
                            style={{ 
                              background: 'none', 
                              border: 'none', 
                              cursor: enviandoConvocatoria === tenida.id ? 'not-allowed' : 'pointer', 
                              color: 'var(--color-institucional)', 
                              padding: '4px',
                              opacity: enviandoConvocatoria === tenida.id ? 0.5 : 1,
                              display: 'flex',
                              alignItems: 'center',
                              transition: 'color 0.2s'
                            }}
                            onMouseOver={e => !enviandoConvocatoria && (e.currentTarget.style.color = 'var(--color-oro)')}
                            onMouseOut={e => !enviandoConvocatoria && (e.currentTarget.style.color = 'var(--color-institucional)')}
                          >
                            <Mail size={18} />
                          </button>
                        )}

                        {/* Botón de Ver / Pasar Lista */}
                        <Link 
                          href={`/panel/secretaria/tenidas/${tenida.id}`} 
                          style={{ 
                            color: 'var(--color-institucional)', 
                            textDecoration: 'none', 
                            fontWeight: '600', 
                            fontSize: '12px',
                            border: '1px solid rgba(207, 181, 59, 0.4)',
                            backgroundColor: '#fafaf8',
                            padding: '6px 14px',
                            borderRadius: '6px',
                            transition: 'all 0.2s'
                          }}
                          onMouseOver={e => { e.currentTarget.style.backgroundColor = 'var(--color-institucional)'; e.currentTarget.style.color = 'var(--color-oro)' }}
                          onMouseOut={e => { e.currentTarget.style.backgroundColor = '#fafaf8'; e.currentTarget.style.color = 'var(--color-institucional)' }}
                        >
                          {tenida.estado === 'abierta' ? 'Pasar lista' : 'Ver asistencia'}
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  )
}

// ESTILOS
const estiloLabel = { display: 'block', fontSize: '12px', color: 'var(--color-institucional)', marginBottom: '6px', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.05em' }
const estiloInput = { width: '100%', padding: '12px 14px', fontSize: '13px', border: '1px solid #d1d0c8', borderRadius: '8px', backgroundColor: '#fff', color: 'var(--color-institucional)', outline: 'none', boxSizing: 'border-box', fontFamily: 'var(--font-montserrat)', transition: 'border-color 0.2s' }
const estiloTh = { textAlign: 'left', padding: '14px 16px', fontWeight: '700', color: 'var(--color-institucional)', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '12px' }
const estiloTd = { padding: '14px 16px', verticalAlign: 'middle', color: 'var(--color-gris)' }