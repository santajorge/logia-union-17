'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Mail, Phone, Edit, CreditCard, CalendarDays, ShieldAlert, Check, X } from 'lucide-react'

export default function SuperDetalleHermano() {
  const params = useParams()
  const id = Array.isArray(params?.id) ? params.id : params?.id
  const router = useRouter()
  
  const [usuarioActual, setUsuarioActual] = useState(null)
  const [hermano, setHermano] = useState(null)
  const [pagos, setPagos] = useState([])
  const [asistencias, setAsistencias] = useState([])
  const [cargando, setCargando] = useState(true)

  // Estados de Contacto
  const [editandoContacto, setEditandoContacto] = useState(false)
  const [formContacto, setFormContacto] = useState({ email: '', telefono: '' })
  const [guardandoContacto, setGuardandoContacto] = useState(false)

  // ESTOS SON LOS ESTADOS QUE FALTABAN (El "Cerebro" del Modal)
  const [mostrarModalBaja, setMostrarModalBaja] = useState(false)
  const [guardandoBaja, setGuardandoBaja] = useState(false)
  const [formBaja, setFormBaja] = useState({
    estado: 'baja', 
    acta_nro: '',
    motivo: ''
  })

  useEffect(() => {
    async function cargarFicha() {
      if (!id) return;

      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        const { data: userProfile } = await supabase
          .from('hermanos')
          .select('rol_oficial')
          .eq('user_id', session.user.id)
          .single()
        setUsuarioActual(userProfile)
      }

      const { data: datosHermano } = await supabase
        .from('hermanos')
        .select('*')
        .eq('id', id)
        .single()
      
      setHermano(datosHermano)
      if (datosHermano) {
        setFormContacto({ email: datosHermano.email || '', telefono: datosHermano.telefono || '' })
      }

      const { data: historialPagos } = await supabase
        .from('pagos')
        .select('id, fecha, monto, notas')
        .eq('hermano_id', id)
        .order('fecha', { ascending: false })
        .limit(5)
      setPagos(historialPagos || [])

      const { data: historialAsistencias } = await supabase
        .from('asistencias')
        .select('id, estado, tenidas(fecha, tipo)')
        .eq('hermano_id', id)
        .order('tenidas(fecha)', { ascending: false })
        .limit(5)
      setAsistencias(historialAsistencias || [])
      
      setCargando(false)
    }

    cargarFicha()
  }, [id])

  const handleGuardarContacto = async () => {
    setGuardandoContacto(true)
    const { error } = await supabase
      .from('hermanos')
      .update({ email: formContacto.email.trim(), telefono: formContacto.telefono.trim() })
      .eq('id', id)

    if (!error) {
      setHermano(prev => ({ ...prev, email: formContacto.email.trim(), telefono: formContacto.telefono.trim() }))
      setEditandoContacto(false)
    }
    setGuardandoContacto(false)
  }

  const handleActualizarCampo = async (campo, valor) => {
    // Actualizamos en Supabase
    const { error } = await supabase
      .from('hermanos')
      .update({ [campo]: valor || null })
      .eq('id', id)

    // Si sale bien, actualizamos la pantalla para que no haya que recargar
    if (!error) {
      setHermano(prev => ({ ...prev, [campo]: valor }))
    } else {
      console.error(`Error al guardar ${campo}:`, error)
      alert("Hubo un error al guardar la fecha.")
    }
  }

  // ESTA ES LA FUNCIÓN QUE GUARDA EN EL LIBRO NEGRO
  const handleConfirmarBaja = async (e) => {
    e.preventDefault()
    setGuardandoBaja(true)

    try {
      const { error: errorHermano } = await supabase
        .from('hermanos')
        .update({ 
          activo: false, 
          estado: formBaja.estado 
        })
        .eq('id', id)

      if (errorHermano) throw errorHermano

      const { error: errorLibro } = await supabase
        .from('libro_negro')
        .insert({
          tipo_de_registro: 'hermano',
          hermano_id: id,
          fecha_resolucion: new Date().toISOString().split('T'),
          acta_nro: formBaja.acta_nro ? parseInt(formBaja.acta_nro) : null,
          motivo: formBaja.motivo.trim()
        })

      if (errorLibro) throw errorLibro

      router.push('/panel/tesoreria/hermanos')
      router.refresh()
      
    } catch (error) {
      console.error(error)
      alert('Error al procesar la baja.')
      setGuardandoBaja(false)
    }
  }

  if (cargando) return <p style={{ padding: '2rem', color: '#888' }}>Cargando Ficha del Hermano...</p>
  if (!hermano) return <p style={{ padding: '2rem', color: '#A32D2D' }}>Hermano no encontrado.</p>

  const rol = usuarioActual?.rol_oficial?.trim().toLowerCase() || ''
  const esTesorero = rol === 'tesorero'
  const esSecretarioOVM = rol === 'secretario' || rol === 'venerable maestro'
  // Si querés que el Secretario o el VM también puedan cargar pagos por si el Tesorero no está, usá esta constante para el botón:
  const puedeCargarPagos = esTesorero || esSecretarioOVM

  const gradoTexto = Number(hermano.grado) === 3 ? 'Maestro' : Number(hermano.grado) === 2 ? 'Compañero' : 'Aprendiz'

  return (
    <div style={{ maxWidth: '800px', position: 'relative' }}>
      
      {/* MODAL DE BAJA / REGISTRO HISTÓRICO */}
      {mostrarModalBaja && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ backgroundColor: '#fff', padding: '2rem', borderRadius: '12px', width: '90%', maxWidth: '500px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
            <h2 style={{ fontSize: '18px', color: '#A32D2D', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 1rem' }}>
              <ShieldAlert size={20} /> Registrar Baja / Sanción
            </h2>
            <p style={{ fontSize: '13px', color: '#666', marginBottom: '1.5rem' }}>
              Estás por cambiar el estado de <strong>{hermano.nombre} {hermano.apellido}</strong> a inactivo. Esta acción dejará constancia en el <strong>Registro Histórico</strong>.
            </p>

            <form onSubmit={handleConfirmarBaja}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={estiloLabelModal}>Motivo de la Baja *</label>
                <select 
                  value={formBaja.estado} 
                  onChange={e => setFormBaja({...formBaja, estado: e.target.value})} 
                  style={estiloInputModal}
                  required
                >
                  <option value="baja">Baja Administrativa</option>
                  <option value="renunciado">Renuncia (Sueños)</option>
                  <option value="suspendido_201">Suspensión Art. 201</option>
                  <option value="suspension_temporal">Suspensión Temporal</option>
                  <option value="expulsion_taller">Expulsión del Taller</option>
                  <option value="expulsion_orden">Expulsión de la Orden</option>
                </select>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={estiloLabelModal}>Número de Acta (Opcional)</label>
                <input type="number" value={formBaja.acta_nro} onChange={e => setFormBaja({...formBaja, acta_nro: e.target.value})} placeholder="Ej: 145" style={estiloInputModal} />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={estiloLabelModal}>Fundamentos / Observaciones *</label>
                <textarea 
                  value={formBaja.motivo} 
                  onChange={e => setFormBaja({...formBaja, motivo: e.target.value})} 
                  placeholder="Detallar los motivos para el archivo histórico..." 
                  style={{ ...estiloInputModal, minHeight: '80px', resize: 'vertical' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setMostrarModalBaja(false)} style={{ padding: '10px 16px', borderRadius: '8px', border: 'none', backgroundColor: '#f0efe9', color: '#666', fontWeight: '500', cursor: 'pointer' }}>
                  Cancelar
                </button>
                <button type="submit" disabled={guardandoBaja} style={{ padding: '10px 16px', borderRadius: '8px', border: 'none', backgroundColor: '#A32D2D', color: '#fff', fontWeight: '600', cursor: guardandoBaja ? 'not-allowed' : 'pointer', opacity: guardandoBaja ? 0.7 : 1 }}>
                  {guardandoBaja ? 'Procesando...' : 'Confirmar Resolución'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CABECERA Y BOTÓN DE ACCIÓN */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <Link href="/panel/tesoreria/hermanos" style={{ color: '#666', fontSize: '12px', textDecoration: 'none', marginBottom: '8px', display: 'inline-block' }}>
            ← Volver al Cuadro Lógico
          </Link>
          <h1 style={{ fontSize: '26px', fontWeight: '600', color: '#1a1a2e', margin: '0 0 4px' }}>
            {hermano.apellido}, {hermano.nombre}
          </h1>
          <p style={{ fontSize: '14px', color: '#888', margin: 0 }}>
            {gradoTexto} {hermano.rol_oficial && hermano.rol_oficial !== 'Ninguno' ? `| ${hermano.rol_oficial}` : ''}
          </p>
        </div>

        {/* Botón de Libro Negro */}
        {esSecretarioOVM && hermano.activo && (
          <button onClick={() => setMostrarModalBaja(true)} style={{ backgroundColor: '#FCEBEB', color: '#791F1F', border: '1px solid #F8D7D7', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', transition: 'all 0.2s' }}>
            <ShieldAlert size={16} /> Modificar Estado / Baja
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        
        {/* TARJETA DE CONTACTO */}
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e8e6e0', borderRadius: '12px', padding: '1.5rem', position: 'relative' }}>
          <h3 style={{ fontSize: '12px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 1rem', borderBottom: '1px solid #f0efe9', paddingBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
            Datos de Contacto
            {!editandoContacto && esSecretarioOVM && (
              <button onClick={() => setEditandoContacto(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#CDA434', padding: 0 }}>
                <Edit size={16} />
              </button>
            )}
          </h3>
          
          {editandoContacto ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input type="email" value={formContacto.email} onChange={e => setFormContacto({...formContacto, email: e.target.value})} style={estiloInputEdicion} placeholder="Correo electrónico" />
              <input type="text" value={formContacto.telefono} onChange={e => setFormContacto({...formContacto, telefono: e.target.value})} style={estiloInputEdicion} placeholder="Teléfono" />
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <button onClick={handleGuardarContacto} disabled={guardandoContacto} style={{ flex: 1, backgroundColor: '#3B6D11', color: '#fff', border: 'none', padding: '8px', borderRadius: '6px', fontSize: '12px', fontWeight: '500', cursor: 'pointer' }}>
                  {guardandoContacto ? '...' : 'Guardar'}
                </button>
                <button onClick={() => { setEditandoContacto(false); setFormContacto({ email: hermano.email || '', telefono: hermano.telefono || '' }) }} style={{ flex: 1, backgroundColor: '#f0efe9', color: '#666', border: 'none', padding: '8px', borderRadius: '6px', fontSize: '12px', fontWeight: '500', cursor: 'pointer' }}>
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#1a1a2e' }}><Mail size={16} color="#888" /> {hermano.email || 'No registrado'}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#1a1a2e' }}><Phone size={16} color="#888" /> {hermano.telefono || 'No registrado'}</div>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>

      {/* TARJETA DE CARRERA MASÓNICA (NUEVO) */}
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e8e6e0', borderRadius: '12px', padding: '1.5rem' }}>
          <h3 style={{ fontSize: '12px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 1rem', borderBottom: '1px solid #f0efe9', paddingBottom: '8px' }}>
            Carrera Masónica
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div>
              <label style={{ fontSize: '11px', color: '#666', display: 'block', marginBottom: '4px' }}>FECHA DE INICIACIÓN</label>
              <input 
                type="date" 
                defaultValue={hermano.fecha_iniciacion || ''} 
                onBlur={(e) => handleActualizarCampo('fecha_iniciacion', e.target.value)}
                style={estiloInputEdicion}
              />
            </div>
            
            {Number(hermano.grado) >= 2 && (
              <div>
                <label style={{ fontSize: '11px', color: '#666', display: 'block', marginBottom: '4px' }}>FECHA DE AUMENTO DE SALARIO</label>
                <input 
                  type="date" 
                  defaultValue={hermano.fecha_aumento || ''} 
                  onBlur={(e) => handleActualizarCampo('fecha_aumento', e.target.value)}
                  style={estiloInputEdicion}
                />
              </div>
            )}

            {Number(hermano.grado) === 3 && (
              <div>
                <label style={{ fontSize: '11px', color: '#666', display: 'block', marginBottom: '4px' }}>FECHA DE EXALTACIÓN</label>
                <input 
                  type="date" 
                  defaultValue={hermano.fecha_exaltacion || ''} 
                  onBlur={(e) => handleActualizarCampo('fecha_exaltacion', e.target.value)}
                  style={estiloInputEdicion}
                />
              </div>
            )}
          </div>
        </div>
        
        {/* VISTA DEL TESORERO */}
        {(esTesorero || esSecretarioOVM) && (
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e8e6e0', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ padding: '1.25rem', borderBottom: '1px solid #e8e6e0', backgroundColor: '#fafaf8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '14px', margin: 0, color: '#1a1a2e', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CreditCard size={18} color="#CDA434" /> Historial de Tesorería
              </h3>
              {puedeCargarPagos && (
                <Link href={`/panel/tesoreria/hermanos/${id}/pago`} style={{ backgroundColor: '#3B6D11', color: '#fff', fontSize: '12px', padding: '6px 12px', borderRadius: '6px', textDecoration: 'none', fontWeight: '500' }}>
                  + Registrar Pago
                </Link>
              )}
            </div>
            <div style={{ padding: '1rem' }}>
              {pagos.length === 0 ? (
                <p style={{ fontSize: '13px', color: '#888', margin: 0 }}>No hay pagos recientes registrados.</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <tbody>
                    {pagos.map(p => (
                      <tr key={p.id} style={{ borderBottom: '1px solid #f0efe9' }}>
                        <td style={{ padding: '8px 0', color: '#666' }}>{new Date(p.fecha + 'T00:00:00').toLocaleDateString('es-AR')}</td>
                        <td style={{ padding: '8px 0', color: '#1a1a2e', fontWeight: '500' }}>${p.monto}</td>
                        <td style={{ padding: '8px 0', color: '#888', textAlign: 'right' }}>{p.notas || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* VISTA DEL SECRETARIO/VM */}
        {esSecretarioOVM && (
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e8e6e0', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ padding: '1.25rem', borderBottom: '1px solid #e8e6e0', backgroundColor: '#fafaf8' }}>
              <h3 style={{ fontSize: '14px', margin: 0, color: '#1a1a2e', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CalendarDays size={18} color="#CDA434" /> Últimas Asistencias
              </h3>
            </div>
            <div style={{ padding: '1rem' }}>
              {asistencias.length === 0 ? (
                <p style={{ fontSize: '13px', color: '#888', margin: 0 }}>No hay registro de asistencias.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {asistencias.map(a => (
                    <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '8px', backgroundColor: '#fafaf8', borderRadius: '6px' }}>
                      <span style={{ color: '#1a1a2e' }}>Tenida {a.tenidas?.tipo} ({new Date(a.tenidas?.fecha + 'T00:00:00').toLocaleDateString('es-AR')})</span>
                      <span style={{ fontWeight: '600', color: a.estado === 'presente' ? '#3B6D11' : a.estado === 'ausente_justificado' ? '#854F0B' : '#A32D2D' }}>
                        {a.estado === 'presente' ? 'Presente' : a.estado === 'ausente_justificado' ? 'Justificado' : 'Ausente'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

const estiloInputEdicion = { width: '100%', padding: '8px 10px', fontSize: '13px', border: '1px solid #c8c5b8', borderRadius: '6px', backgroundColor: '#fafaf8', color: '#1a1a2e', outline: 'none', boxSizing: 'border-box' }
const estiloLabelModal = { display: 'block', fontSize: '12px', fontWeight: '600', color: '#444', marginBottom: '6px' }
const estiloInputModal = { width: '100%', padding: '10px 12px', fontSize: '14px', border: '1px solid #d1d0c8', borderRadius: '8px', backgroundColor: '#fff', color: '#1a1a2e', outline: 'none', boxSizing: 'border-box' }