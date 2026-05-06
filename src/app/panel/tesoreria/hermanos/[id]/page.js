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
    const { error } = await supabase
      .from('hermanos')
      .update({ [campo]: valor || null })
      .eq('id', id)

    if (!error) {
      setHermano(prev => ({ ...prev, [campo]: valor }))
    } else {
      console.error(`Error al guardar ${campo}:`, error)
      alert("Hubo un error al guardar la fecha.")
    }
  }

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
          fecha_resolucion: new Date().toISOString().split('T')[0],
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

  if (cargando) return <p style={{ padding: '2rem', color: 'var(--color-gris)', fontFamily: 'var(--font-montserrat)' }}>Cargando Ficha del Hermano...</p>
  if (!hermano) return <p style={{ padding: '2rem', color: '#B33A3A', fontFamily: 'var(--font-montserrat)' }}>Hermano no encontrado.</p>

  const rol = usuarioActual?.rol_oficial?.trim().toLowerCase() || ''
  const esTesorero = rol === 'tesorero'
  const esSecretarioOVM = rol === 'secretario' || rol === 'venerable maestro'
  const puedeCargarPagos = esTesorero || esSecretarioOVM

  const gradoTexto = Number(hermano.grado) === 3 ? 'Maestro' : Number(hermano.grado) === 2 ? 'Compañero' : 'Aprendiz'

  return (
    <div style={{ maxWidth: '800px', position: 'relative', fontFamily: 'var(--font-montserrat)' }}>
      
      {/* MODAL DE BAJA / REGISTRO HISTÓRICO */}
      {mostrarModalBaja && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(2px)' }}>
          <div style={{ backgroundColor: '#fff', padding: '2.5rem', borderRadius: '12px', width: '90%', maxWidth: '500px', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
            <h2 style={{ fontSize: '18px', color: '#B33A3A', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 1rem', fontFamily: 'var(--font-baskerville)' }}>
              <ShieldAlert size={20} /> Registrar Baja / Sanción
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--color-gris)', marginBottom: '1.5rem', lineHeight: '1.5' }}>
              Estás por cambiar el estado de <strong style={{ color: 'var(--color-institucional)' }}>{hermano.nombre} {hermano.apellido}</strong> a inactivo. Esta acción dejará constancia en el <strong>Registro Histórico</strong>.
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

              <div style={{ marginBottom: '2rem' }}>
                <label style={estiloLabelModal}>Fundamentos / Observaciones *</label>
                <textarea 
                  value={formBaja.motivo} 
                  onChange={e => setFormBaja({...formBaja, motivo: e.target.value})} 
                  placeholder="Detallar los motivos para el archivo histórico..." 
                  style={{ ...estiloInputModal, minHeight: '90px', resize: 'vertical' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setMostrarModalBaja(false)} style={{ padding: '10px 18px', borderRadius: '8px', border: '1px solid #d1d0c8', backgroundColor: '#fafaf8', color: 'var(--color-gris)', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor = '#f0efe9'} onMouseOut={e => e.currentTarget.style.backgroundColor = '#fafaf8'}>
                  Cancelar
                </button>
                <button type="submit" disabled={guardandoBaja} style={{ padding: '10px 18px', borderRadius: '8px', border: 'none', backgroundColor: '#B33A3A', color: '#fff', fontWeight: '600', cursor: guardandoBaja ? 'not-allowed' : 'pointer', opacity: guardandoBaja ? 0.7 : 1, transition: 'all 0.2s' }} onMouseOver={e => !guardandoBaja && (e.currentTarget.style.backgroundColor = '#8c2c2c')} onMouseOut={e => !guardandoBaja && (e.currentTarget.style.backgroundColor = '#B33A3A')}>
                  {guardandoBaja ? 'Procesando...' : 'Confirmar Resolución'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CABECERA Y BOTÓN DE ACCIÓN */}
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <Link href="/panel/tesoreria/hermanos" style={{ color: 'var(--color-gris)', fontSize: '12px', textDecoration: 'none', marginBottom: '10px', display: 'inline-block', fontWeight: '500' }}>
            ← Volver al Cuadro Lógico
          </Link>
          <h1 style={{ fontSize: '28px', fontWeight: '600', color: 'var(--color-institucional)', margin: '0 0 4px', fontFamily: 'var(--font-baskerville)' }}>
            {hermano.apellido}, {hermano.nombre}
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--color-gris)', margin: 0 }}>
            <span style={{ fontWeight: '500' }}>{gradoTexto}</span> {hermano.rol_oficial && hermano.rol_oficial !== 'Ninguno' ? <><span style={{ margin: '0 6px', color: '#d1d0c8' }}>|</span>{hermano.rol_oficial}</> : ''}
          </p>
        </div>

        {/* Botón de Libro Negro */}
        {esSecretarioOVM && hermano.activo && (
          <button 
            onClick={() => setMostrarModalBaja(true)} 
            style={{ backgroundColor: '#FCEBEB', color: '#B33A3A', border: '1px solid #F8D7D7', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseOver={e => e.currentTarget.style.backgroundColor = '#F8D7D7'}
            onMouseOut={e => e.currentTarget.style.backgroundColor = '#FCEBEB'}
          >
            <ShieldAlert size={16} /> Modificar Estado / Baja
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        
        {/* TARJETA DE CONTACTO */}
        <div style={{ backgroundColor: '#ffffff', border: '1px solid rgba(207, 181, 59, 0.2)', borderRadius: '12px', padding: '1.5rem', position: 'relative', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <h3 style={{ fontSize: '12px', color: 'var(--color-institucional)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 1rem', borderBottom: '1px solid rgba(207, 181, 59, 0.15)', paddingBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Datos de Contacto
            {!editandoContacto && esSecretarioOVM && (
              <button onClick={() => setEditandoContacto(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-oro)', padding: 0, transition: 'color 0.2s' }}>
                <Edit size={16} />
              </button>
            )}
          </h3>
          
          {editandoContacto ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input type="email" value={formContacto.email} onChange={e => setFormContacto({...formContacto, email: e.target.value})} style={estiloInputEdicion} placeholder="Correo electrónico" />
              <input type="text" value={formContacto.telefono} onChange={e => setFormContacto({...formContacto, telefono: e.target.value})} style={estiloInputEdicion} placeholder="Teléfono" />
              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <button onClick={handleGuardarContacto} disabled={guardandoContacto} style={{ flex: 1, backgroundColor: '#4A8516', color: '#fff', border: 'none', padding: '10px', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', transition: 'background-color 0.2s' }}>
                  {guardandoContacto ? 'Guardando...' : 'Guardar'}
                </button>
                <button onClick={() => { setEditandoContacto(false); setFormContacto({ email: hermano.email || '', telefono: hermano.telefono || '' }) }} style={{ flex: 1, backgroundColor: '#fafaf8', color: 'var(--color-gris)', border: '1px solid #d1d0c8', padding: '10px', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', transition: 'background-color 0.2s' }}>
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', color: 'var(--color-institucional)' }}><Mail size={16} color="var(--color-oro)" /> {hermano.email || <span style={{ color: '#ccc', fontStyle: 'italic' }}>No registrado</span>}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', color: 'var(--color-institucional)' }}><Phone size={16} color="var(--color-oro)" /> {hermano.telefono || <span style={{ color: '#ccc', fontStyle: 'italic' }}>No registrado</span>}</div>
            </div>
          )}
        </div>

        {/* TARJETA DE CARRERA MASÓNICA */}
        <div style={{ backgroundColor: '#ffffff', border: '1px solid rgba(207, 181, 59, 0.2)', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <h3 style={{ fontSize: '12px', color: 'var(--color-institucional)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 1rem', borderBottom: '1px solid rgba(207, 181, 59, 0.15)', paddingBottom: '10px' }}>
            Carrera Masónica
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '1rem' }}>
            <div>
              <label style={{ fontSize: '11px', color: 'var(--color-gris)', display: 'block', marginBottom: '6px', fontWeight: '600' }}>FECHA DE INICIACIÓN</label>
              <input 
                type="date" 
                defaultValue={hermano.fecha_iniciacion || ''} 
                onBlur={(e) => handleActualizarCampo('fecha_iniciacion', e.target.value)}
                style={estiloInputEdicion}
              />
            </div>
            
            {Number(hermano.grado) >= 2 && (
              <div>
                <label style={{ fontSize: '11px', color: 'var(--color-gris)', display: 'block', marginBottom: '6px', fontWeight: '600' }}>FECHA DE AUMENTO DE SALARIO</label>
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
                <label style={{ fontSize: '11px', color: 'var(--color-gris)', display: 'block', marginBottom: '6px', fontWeight: '600' }}>FECHA DE EXALTACIÓN</label>
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
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
        
        {/* VISTA DEL TESORERO */}
        {(esTesorero || esSecretarioOVM) && (
          <div style={{ backgroundColor: '#ffffff', border: '1px solid rgba(207, 181, 59, 0.2)', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(207, 181, 59, 0.15)', backgroundColor: '#fafaf8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '14px', margin: 0, color: 'var(--color-institucional)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CreditCard size={18} color="var(--color-oro)" /> Historial de Tesorería
              </h3>
              {puedeCargarPagos && (
                <Link 
                  href={`/panel/tesoreria/hermanos/${id}/pago`} 
                  style={{ backgroundColor: 'var(--color-institucional)', color: 'var(--color-oro)', fontSize: '12px', padding: '8px 14px', borderRadius: '6px', textDecoration: 'none', fontWeight: '600', transition: 'all 0.2s', border: '1px solid var(--color-oro)' }}
                  onMouseOver={e => e.currentTarget.style.backgroundColor = '#111122'}
                  onMouseOut={e => e.currentTarget.style.backgroundColor = 'var(--color-institucional)'}
                >
                  + Registrar Pago
                </Link>
              )}
            </div>
            <div style={{ padding: '0 1.5rem' }}>
              {pagos.length === 0 ? (
                <p style={{ fontSize: '13px', color: 'var(--color-gris)', padding: '1.5rem 0', margin: 0 }}>No hay pagos recientes registrados.</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <tbody>
                    {pagos.map(p => (
                      <tr key={p.id} style={{ borderBottom: '1px solid #f0efe9' }}>
                        <td style={{ padding: '14px 0', color: 'var(--color-gris)' }}>{new Date(p.fecha + 'T00:00:00').toLocaleDateString('es-AR')}</td>
                        <td style={{ padding: '14px 0', color: '#4A8516', fontWeight: '600' }}>${p.monto}</td>
                        <td style={{ padding: '14px 0', color: 'var(--color-gris)', textAlign: 'right' }}>{p.notas || '—'}</td>
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
          <div style={{ backgroundColor: '#ffffff', border: '1px solid rgba(207, 181, 59, 0.2)', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(207, 181, 59, 0.15)', backgroundColor: '#fafaf8' }}>
              <h3 style={{ fontSize: '14px', margin: 0, color: 'var(--color-institucional)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CalendarDays size={18} color="var(--color-oro)" /> Últimas Asistencias
              </h3>
            </div>
            <div style={{ padding: '1.5rem' }}>
              {asistencias.length === 0 ? (
                <p style={{ fontSize: '13px', color: 'var(--color-gris)', margin: 0 }}>No hay registro de asistencias.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {asistencias.map(a => (
                    <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '12px', backgroundColor: '#fafaf8', border: '1px solid #f0efe9', borderRadius: '8px' }}>
                      <span style={{ color: 'var(--color-institucional)', fontWeight: '500' }}>Tenida {a.tenidas?.tipo} ({new Date(a.tenidas?.fecha + 'T00:00:00').toLocaleDateString('es-AR')})</span>
                      <span style={{ fontWeight: '600', color: a.estado === 'presente' ? '#4A8516' : a.estado === 'ausente_justificado' ? '#854F0B' : '#B33A3A' }}>
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

const estiloInputEdicion = { width: '100%', padding: '10px 12px', fontSize: '13px', border: '1px solid #d1d0c8', borderRadius: '8px', backgroundColor: '#fff', color: 'var(--color-institucional)', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s', fontFamily: 'var(--font-montserrat)' }
const estiloLabelModal = { display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--color-institucional)', marginBottom: '8px', fontFamily: 'var(--font-montserrat)' }
const estiloInputModal = { width: '100%', padding: '12px 14px', fontSize: '14px', border: '1px solid #d1d0c8', borderRadius: '8px', backgroundColor: '#fff', color: 'var(--color-institucional)', outline: 'none', boxSizing: 'border-box', fontFamily: 'var(--font-montserrat)' }