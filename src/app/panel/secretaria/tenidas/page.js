'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function LibroAsistenciasPage() {
  const router = useRouter()
  const [tenidas, setTenidas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [abriendoNueva, setAbriendoNueva] = useState(false)
  const [mostrarFormulario, setMostrarFormulario] = useState(false)

  const [nuevaTenida, setNuevaTenida] = useState({
    fecha: new Date().toISOString().split('T'),
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

  const formatFecha = (fecha) => {
    return new Date(fecha + 'T00:00:00').toLocaleDateString('es-AR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    })
  }

  return (
    <div style={{ maxWidth: '900px' }}>
      
      {/* CABECERA */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#1a1a2e', margin: '0 0 4px' }}>
            Libro de Asistencias
          </h1>
          <p style={{ fontSize: '13px', color: '#888', margin: 0 }}>
            Registro histórico de Tenidas y control de presencialidad.
          </p>
        </div>
        <button 
          onClick={() => setMostrarFormulario(!mostrarFormulario)}
          style={{ backgroundColor: '#1a1a2e', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}
        >
          {mostrarFormulario ? '✖ Cancelar' : '+ Registrar Nueva Tenida'}
        </button>
      </div>

      {/* FORMULARIO NUEVA TENIDA (Oculto por defecto) */}
      {mostrarFormulario && (
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #CDA434', borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem', boxShadow: '0 4px 12px rgba(205, 164, 52, 0.1)' }}>
          <h3 style={{ fontSize: '14px', color: '#CDA434', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 1rem' }}>Apertura de Trabajos</h3>
          
          <form onSubmit={handleAbrirTenida} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', alignItems: 'end' }}>
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

            <button type="submit" disabled={abriendoNueva} style={{ backgroundColor: '#CDA434', color: '#1a1a2e', border: 'none', padding: '10px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: abriendoNueva ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                {abriendoNueva ? 'Abriendo...' : <>Guardar y Pasar Lista <span style={{ fontSize: '14px' }}>➔</span></>}
            </button>
          </form>
        </div>
      )}

      {/* LISTADO DE TENIDAS HISTÓRICAS */}
      <div style={{ backgroundColor: '#ffffff', border: '0.5px solid #e8e6e0', borderRadius: '12px', overflow: 'hidden' }}>
        {cargando ? (
          <p style={{ padding: '2rem', textAlign: 'center', color: '#888', fontSize: '13px' }}>Cargando historial...</p>
        ) : tenidas.length === 0 ? (
          <div style={{ padding: '3rem 2rem', textAlign: 'center' }}>
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '1rem' }}>No hay Tenidas registradas en el libro.</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: '#fafaf8', borderBottom: '1px solid #e8e6e0' }}>
                <th style={estiloTh}>Fecha</th>
                <th style={estiloTh}>Tipo y Grado</th>
                <th style={estiloTh}>Balaustre</th>
                <th style={estiloTh}>Estado</th>
                <th style={{...estiloTh, textAlign: 'right'}}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {tenidas.map((tenida) => (
                <tr key={tenida.id} style={{ borderBottom: '1px solid #f0efe9' }}>
                  <td style={estiloTd}>
                    <span style={{ textTransform: 'capitalize', fontWeight: '500', color: '#1a1a2e' }}>
                      {formatFecha(tenida.fecha)}
                    </span>
                  </td>
                  <td style={estiloTd}>
                    Tenida {tenida.tipo.charAt(0).toUpperCase() + tenida.tipo.slice(1)} <br/>
                    <span style={{ fontSize: '11px', color: '#888' }}>Grado {tenida.grado}</span>
                  </td>
                  <td style={estiloTd}>
                    {tenida.acta_nro ? `Nº ${tenida.acta_nro}` : <span style={{color: '#aaa'}}>—</span>}
                  </td>
                  <td style={estiloTd}>
                    <span style={{ 
                      padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase',
                      backgroundColor: tenida.estado === 'abierta' ? '#EAF3DE' : '#f5f4f0',
                      color: tenida.estado === 'abierta' ? '#27500A' : '#888'
                    }}>
                      {tenida.estado}
                    </span>
                  </td>
                  <td style={{...estiloTd, textAlign: 'right'}}>
                    <Link href={`/panel/secretaria/tenidas/${tenida.id}`} style={{ color: '#CDA434', textDecoration: 'none', fontWeight: '500', fontSize: '12px' }}>
                      {tenida.estado === 'abierta' ? 'Pasar lista' : 'Ver asistencia'}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

    </div>
  )
}

// ESTILOS
const estiloLabel = { display: 'block', fontSize: '11px', color: '#666', marginBottom: '4px', textTransform: 'uppercase', fontWeight: '500' }
const estiloInput = { width: '100%', padding: '10px', fontSize: '13px', border: '1px solid #c8c5b8', borderRadius: '8px', backgroundColor: '#fafaf8', color: '#1a1a2e', outline: 'none', boxSizing: 'border-box' }
const estiloTh = { textAlign: 'left', padding: '12px 16px', fontWeight: '600', color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '11px' }
const estiloTd = { padding: '12px 16px', verticalAlign: 'middle', color: '#444' }