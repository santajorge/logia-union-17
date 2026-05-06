'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, FileText, Copy, Save, CheckCircle } from 'lucide-react'

export default function PaseDeLista() {
  const params = useParams()
  const id = Array.isArray(params?.id) ? params.id : params?.id
  const router = useRouter()

  const [tenida, setTenida] = useState(null)
  const [hermanos, setHermanos] = useState([])
  const [asistencias, setAsistencias] = useState({})
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' })
  
  // Nuevo estado para el modal del Acta
  const [mostrarActa, setMostrarActa] = useState(false)
  const [textoActa, setTextoActa] = useState('')

  useEffect(() => {
    async function cargarDatos() {
      if (!id) return

      const { data: dataTenida, error: errTenida } = await supabase
        .from('tenidas')
        .select('*')
        .eq('id', id)
        .single()

      if (errTenida || !dataTenida) {
        setMensaje({ tipo: 'error', texto: 'No se encontró la Tenida.' })
        setCargando(false)
        return
      }
      setTenida(dataTenida)

      // Magia extra: ahora también traemos el rol_oficial de cada hermano
      const { data: dataHermanos } = await supabase
        .from('hermanos')
        .select('id, nombre, apellido, grado, rol_oficial')
        .eq('activo', true)
        .gte('grado', dataTenida.grado)
        .order('grado', { ascending: false })
        .order('apellido', { ascending: true })

      const { data: dataAsistencias } = await supabase
        .from('asistencias')
        .select('hermano_id, estado')
        .eq('tenida_id', id)

      const estadoActual = {}
      if (dataHermanos) {
        dataHermanos.forEach(h => {
          const registro = dataAsistencias?.find(a => a.hermano_id === h.id)
          estadoActual[h.id] = registro ? registro.estado : 'presente' 
        })
        setHermanos(dataHermanos)
      }
      
      setAsistencias(estadoActual)
      setCargando(false)
    }

    cargarDatos()
  }, [id])

  const cambiarEstado = (hermanoId, nuevoEstado) => {
    if (tenida?.estado === 'cerrada') return 
    setAsistencias(prev => ({ ...prev, [hermanoId]: nuevoEstado }))
  }

  const guardarCambios = async (cerrar = false) => {
    setGuardando(true)
    setMensaje({ tipo: '', texto: '' })

    const registros = hermanos.map(h => ({
      tenida_id: id,
      hermano_id: h.id,
      estado: asistencias[h.id]
    }))

    const { error: errAsistencias } = await supabase
      .from('asistencias')
      .upsert(registros, { onConflict: 'tenida_id, hermano_id' })

    if (errAsistencias) {
      setMensaje({ tipo: 'error', texto: 'Error al guardar las asistencias.' })
      setGuardando(false)
      return
    }

    const { error: errTenida } = await supabase
      .from('tenidas')
      .update({ 
        estado: cerrar ? 'cerrada' : 'abierta',
        acta_nro: tenida.acta_nro || null
      })
      .eq('id', id)

    if (errTenida) {
      setMensaje({ tipo: 'error', texto: 'Error al actualizar los datos de la Tenida.' })
      setGuardando(false)
      return
    }

    if (cerrar) {
      router.push('/panel/secretaria/tenidas')
      router.refresh()
      return 
    }

    setMensaje({ tipo: 'exito', texto: 'Guardado correctamente.' })
    setTimeout(() => setMensaje({ tipo: '', texto: '' }), 3000)
    setGuardando(false)
  }

  // 🪄 EL MOTOR DE REDACCIÓN DEL ACTA
  const generarBorradorActa = () => {
    const fechaObj = new Date(tenida.fecha + 'T00:00:00')
    const dia = fechaObj.getDate()
    const mes = fechaObj.toLocaleDateString('es-AR', { month: 'long' })
    const año = fechaObj.getFullYear()
    const añoMasonico = año + 4000

    const gradoTexto = tenida.grado === 1 ? 'Aprendiz' : tenida.grado === 2 ? 'Compañero' : 'Maestro'
    
    // Lista automática de los que faltaron con aviso
    const justificados = hermanos
      .filter(h => asistencias[h.id] === 'ausente_justificado')
      .map(h => h.apellido)

    // Buscamos a los oficiales (si no están, deja un placeholder)
    const vm = hermanos.find(h => h.rol_oficial === 'Venerable Maestro') || { apellido: '[Apellido VM]' }
    const vig1 = hermanos.find(h => h.rol_oficial === '1er Vigilante') || { apellido: '[Apellido 1er Vig]' }
    const vig2 = hermanos.find(h => h.rol_oficial === '2do Vigilante') || { apellido: '[Apellido 2do Vig]' }
    const orador = hermanos.find(h => h.rol_oficial === 'Orador') || { apellido: '[Apellido Orador]' }
    const sec = hermanos.find(h => h.rol_oficial === 'Secretario') || { apellido: '[Apellido Secretario]' }

    const texto = `A L.·. G.·. D.·. G.·. A.·. D.·. U.·.
S.·. F.·. U.·.
Or.·. de Rosario, ${dia} de ${mes} de ${año} (e.·. v.·.)

ACTA TENIDA N° ${tenida.acta_nro || '[NÚMERO]'}

Al Or.·. de Rosario, a los ${dia} días del mes de ${mes} año ${añoMasonico} (V.·. L.·.), en su templo ubicado en calle Laprida 1027, se reúnen los miembros de la Resp.·. Log.·. Sanitas Sanitatum N° 763, presididos por el V.·.M.·. ${vm.apellido}, al frente de sus respectivas columnas los HH.·. 1° y 2° Vig.·. ${vig1.apellido} y ${vig2.apellido}, demás oficiales del Taller, en Tenida en Grado de ${gradoTexto}.

Verificada la seguridad del templo y siendo mediodía en punto se dan por iniciados los trabajos.

Oficiales de la Tenida:
V.·. M.·. : ${vm.apellido}
1° Vig.·. : ${vig1.apellido}
2° Vig.·. : ${vig2.apellido}
Or.·. : ${orador.apellido}
Sec.·. : ${sec.apellido}

1- Lectura y aprobación del acta de la tenida anterior
Se aprueba por unanimidad.

2- Disculpas de los HH.·. ausentes
${justificados.length > 0 ? `EI V.·.M.·. disculpa a los QQ.·.HH.·. ${justificados.join(', ')}.` : 'No se registraron disculpas formales.'}
Todos los HH.·. son disculpados con contribución al Saco de Beneficencia.

3- Saco de las proposiciones
Llega a Or.·. con las siguientes planchas:
1. Del Q.·.H.·. [NOMBRE DEL HERMANO] titulado "[TÍTULO DE LA PLANCHA]".
Expresan sus opiniones los QQ.·.HH.·. [NOMBRES QUIENES OPINARON].

4- Palabra por el bien general de la Orden y este Taller en particular:
[INGRESAR ANUNCIOS, AGRADECIMIENTOS O TEMAS TRATADOS]

5- Saco de la Beneficencia
Llega a Oriente con [MONTO DE RECAUDACIÓN] unidades de la moneda profana.

6- Se rinden los honores al Pabellón Nacional

7- Se clausuran los trabajos de acuerdo al ritual.

Sec.·. ${sec.apellido}
V.·. M.·. ${vm.apellido}
O.·. ${orador.apellido}
`
    setTextoActa(texto)
    setMostrarActa(true)
  }

  const copiarAlPortapapeles = () => {
    navigator.clipboard.writeText(textoActa)
    alert('¡Acta copiada al portapapeles! Ya podés pegarla en Word o en tu editor de texto.')
  }

  if (cargando) return <p style={{ padding: '2rem', fontSize: '14px', color: 'var(--color-gris)', fontFamily: 'var(--font-montserrat)' }}>Abriendo Balaustre...</p>

  const formatFecha = (fecha) => {
    return new Date(fecha + 'T00:00:00').toLocaleDateString('es-AR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    })
  }

  return (
    <div style={{ maxWidth: '850px', paddingBottom: '4rem', fontFamily: 'var(--font-montserrat)' }}>
      
      <div style={{ marginBottom: '2rem' }}>
        <Link 
          href="/panel/secretaria/tenidas" 
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--color-gris)', fontSize: '13px', fontWeight: '500', textDecoration: 'none', marginBottom: '16px', transition: 'color 0.2s' }}
          onMouseOver={e => e.currentTarget.style.color = 'var(--color-institucional)'}
          onMouseOut={e => e.currentTarget.style.color = 'var(--color-gris)'}
        >
          <ArrowLeft size={16} /> Volver al Libro
        </Link>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '600', color: 'var(--color-institucional)', margin: '0 0 6px', textTransform: 'capitalize', fontFamily: 'var(--font-baskerville)' }}>
              Tenida {tenida?.tipo}
            </h1>
            <p style={{ fontSize: '14px', color: 'var(--color-gris)', margin: '0 0 16px 0' }}>
              <span style={{ fontWeight: '500' }}>{tenida ? formatFecha(tenida.fecha) : ''}</span> <span style={{ margin: '0 6px', color: '#d1d0c8' }}>|</span> Taller en Grado {tenida?.grado}
            </p>
            
            {tenida?.estado === 'abierta' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#ffffff', padding: '8px 14px', borderRadius: '8px', border: '1px solid rgba(207, 181, 59, 0.4)', width: 'fit-content', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                <label style={{ fontSize: '11px', color: 'var(--color-institucional)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Balaustre Nº</label>
                <input
                    type="text"
                    value={tenida.acta_nro || ''}
                    onChange={(e) => setTenida({ ...tenida, acta_nro: e.target.value })}
                    placeholder="Ej: 145"
                    style={{ 
                        width: '80px', 
                        padding: '6px 10px', 
                        border: '1px solid #d1d0c8', 
                        borderRadius: '6px', 
                        fontSize: '13px', 
                        outline: 'none', 
                        textAlign: 'center',
                        color: 'var(--color-institucional)',
                        backgroundColor: '#ffffff',
                        fontWeight: '600',
                        fontFamily: 'var(--font-montserrat)'
                    }}
                />
              </div>
            ) : (
              <p style={{ fontSize: '14px', color: 'var(--color-institucional)', fontWeight: '600', margin: 0, padding: '8px 14px', backgroundColor: '#fafaf8', border: '1px solid #e8e6e0', borderRadius: '8px', display: 'inline-block' }}>
                {tenida?.acta_nro ? `Balaustre Nº ${tenida.acta_nro}` : 'Sin número de Balaustre'}
              </p>
            )}

          </div>
          <span style={{ fontSize: '11px', fontWeight: '700', padding: '6px 14px', borderRadius: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', backgroundColor: tenida?.estado === 'abierta' ? '#EAF3DE' : '#f5f4f0', color: tenida?.estado === 'abierta' ? '#4A8516' : 'var(--color-gris)', border: `1px solid ${tenida?.estado === 'abierta' ? '#D4EAB6' : '#d1d0c8'}` }}>
            Estado: {tenida?.estado}
          </span>
        </div>
      </div>

      {mensaje.texto && (
        <div style={{ backgroundColor: mensaje.tipo === 'error' ? '#FCEBEB' : '#EAF3DE', color: mensaje.tipo === 'error' ? '#B33A3A' : '#4A8516', padding: '1rem', borderRadius: '8px', fontSize: '13px', fontWeight: '500', marginBottom: '2rem', border: `1px solid ${mensaje.tipo === 'error' ? '#F8D7D7' : '#D4EAB6'}`, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle size={16} /> {mensaje.texto}
        </div>
      )}

      {/* CUADRO LÓGICO Y SEMÁFORO */}
      <div style={{ backgroundColor: '#ffffff', border: '1px solid rgba(207, 181, 59, 0.2)', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
        <p style={{ fontSize: '12px', color: 'var(--color-institucional)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 1.25rem 0', fontWeight: '700', borderBottom: '1px solid rgba(207, 181, 59, 0.15)', paddingBottom: '10px' }}>
          Cuadro Lógico Habilitado ({hermanos.length})
        </p>
        
        {hermanos.map((hermano, index) => {
          const gradoTexto = Number(hermano.grado) === 3 ? 'Maestro' : Number(hermano.grado) === 2 ? 'Compañero' : 'Aprendiz'
          const esOficial = hermano.rol_oficial && hermano.rol_oficial.trim() !== ''

          return (
            <div 
              key={hermano.id} 
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 10px', borderBottom: index !== hermanos.length -1 ? '1px solid #f0efe9' : 'none', flexWrap: 'wrap', gap: '1rem', transition: 'background-color 0.2s', borderRadius: '6px' }}
              onMouseOver={e => e.currentTarget.style.backgroundColor = '#fafaf8'}
              onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <div>
                <p style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: 'var(--color-institucional)' }}>
                  {hermano.apellido}, {hermano.nombre}
                </p>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--color-gris)' }}>
                  {gradoTexto} 
                  {esOficial && (
                    <>
                      <span style={{ margin: '0 6px', color: '#d1d0c8' }}>|</span>
                      <span style={{ color: 'var(--color-oro)', fontWeight: '600', letterSpacing: '0.02em' }}>{hermano.rol_oficial}</span>
                    </>
                  )}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '6px', backgroundColor: '#fafaf8', padding: '6px', borderRadius: '8px', border: '1px solid #e8e6e0' }}>
                <BotonEstado activo={asistencias[hermano.id] === 'presente'} color="#4A8516" texto="Presente" onClick={() => cambiarEstado(hermano.id, 'presente')} deshabilitado={tenida?.estado === 'cerrada'} />
                <BotonEstado activo={asistencias[hermano.id] === 'ausente_justificado'} color="#854F0B" texto="Justificado" onClick={() => cambiarEstado(hermano.id, 'ausente_justificado')} deshabilitado={tenida?.estado === 'cerrada'} />
                <BotonEstado activo={asistencias[hermano.id] === 'ausente_injustificado'} color="#B33A3A" texto="Ausente" onClick={() => cambiarEstado(hermano.id, 'ausente_injustificado')} deshabilitado={tenida?.estado === 'cerrada'} />
              </div>
            </div>
          )
        })}
      </div>

      {/* BARRA DE ACCIONES FLOTANTE */}
      <div style={{ position: 'sticky', bottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginTop: '2rem', backgroundColor: '#ffffff', padding: '1.25rem', borderRadius: '12px', border: '1px solid rgba(207, 181, 59, 0.3)', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', flexWrap: 'wrap' }}>
        
        {/* BOTÓN MÁGICO DEL ACTA */}
        <button 
          onClick={generarBorradorActa} 
          style={{ backgroundColor: '#fafaf8', color: 'var(--color-institucional)', border: '1px solid var(--color-oro)', padding: '12px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}
          onMouseOver={e => { e.currentTarget.style.backgroundColor = 'var(--color-institucional)'; e.currentTarget.style.color = 'var(--color-oro)' }}
          onMouseOut={e => { e.currentTarget.style.backgroundColor = '#fafaf8'; e.currentTarget.style.color = 'var(--color-institucional)' }}
        >
          <FileText size={18} /> Generar Borrador de Acta
        </button>

        {tenida?.estado === 'abierta' ? (
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button 
              onClick={() => guardarCambios(false)} 
              disabled={guardando} 
              style={{ backgroundColor: '#fafaf8', color: 'var(--color-gris)', border: '1px solid #d1d0c8', padding: '12px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: guardando ? 'not-allowed' : 'pointer', transition: 'background-color 0.2s', display: 'flex', alignItems: 'center', gap: '6px' }}
              onMouseOver={e => !guardando && (e.currentTarget.style.backgroundColor = '#f0efe9')}
              onMouseOut={e => !guardando && (e.currentTarget.style.backgroundColor = '#fafaf8')}
            >
              <Save size={16} /> Guardar Borrador
            </button>
            <button 
              onClick={() => { if (window.confirm('¿Cerrar Tenida? Ya no podrás modificar las asistencias.')) guardarCambios(true) }} 
              disabled={guardando} 
              style={{ backgroundColor: 'var(--color-institucional)', color: 'var(--color-oro)', border: '1px solid var(--color-oro)', padding: '12px 24px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: guardando ? 'not-allowed' : 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}
              onMouseOver={e => !guardando && (e.currentTarget.style.backgroundColor = '#111122')}
              onMouseOut={e => !guardando && (e.currentTarget.style.backgroundColor = 'var(--color-institucional)')}
            >
              <CheckCircle size={16} /> Guardar y Cerrar Tenida
            </button>
          </div>
        ) : (
          <p style={{ fontSize: '13px', color: 'var(--color-gris)', fontStyle: 'italic', margin: 'auto 0', fontWeight: '500' }}>Balaustre cerrado y archivado.</p>
        )}
      </div>

      {/* MODAL DEL ACTA GENERADA */}
      {mostrarActa && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '2rem', backdropFilter: 'blur(3px)' }}>
          <div style={{ backgroundColor: '#ffffff', padding: '2rem', borderRadius: '12px', width: '100%', maxWidth: '750px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 15px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid rgba(207, 181, 59, 0.15)', paddingBottom: '12px' }}>
              <h2 style={{ fontSize: '20px', margin: 0, color: 'var(--color-institucional)', fontFamily: 'var(--font-baskerville)', fontWeight: '600' }}>Borrador del Balaustre</h2>
              <button 
                onClick={() => setMostrarActa(false)} 
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--color-gris)', transition: 'color 0.2s' }}
                onMouseOver={e => e.currentTarget.style.color = '#B33A3A'}
                onMouseOut={e => e.currentTarget.style.color = 'var(--color-gris)'}
              >
                ✖
              </button>
            </div>
            
            <textarea 
              readOnly 
              value={textoActa} 
              style={{ flex: 1, width: '100%', padding: '1.5rem', fontFamily: 'monospace', fontSize: '13px', border: '1px solid #d1d0c8', borderRadius: '8px', backgroundColor: '#fafaf8', color: 'var(--color-institucional)', resize: 'none', outline: 'none', lineHeight: '1.6', boxSizing: 'border-box' }}
            />
            
            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                onClick={copiarAlPortapapeles} 
                style={{ backgroundColor: 'var(--color-institucional)', color: 'var(--color-oro)', border: '1px solid var(--color-oro)', padding: '12px 24px', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}
                onMouseOver={e => e.currentTarget.style.backgroundColor = '#111122'}
                onMouseOut={e => e.currentTarget.style.backgroundColor = 'var(--color-institucional)'}
              >
                <Copy size={16} /> Copiar al Portapapeles
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

function BotonEstado({ activo, color, texto, onClick, deshabilitado }) {
  return (
    <button
      onClick={onClick}
      disabled={deshabilitado}
      style={{
        backgroundColor: activo ? color : 'transparent',
        color: activo ? '#ffffff' : 'var(--color-gris)',
        border: 'none',
        padding: '8px 14px',
        borderRadius: '6px',
        fontSize: '11px',
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: '0.02em',
        cursor: deshabilitado ? 'default' : 'pointer',
        transition: 'all 0.2s',
        opacity: deshabilitado && !activo ? 0.5 : 1,
        fontFamily: 'var(--font-montserrat)'
      }}
      onMouseOver={e => {
        if (!deshabilitado && !activo) {
          e.currentTarget.style.backgroundColor = '#e8e6e0'
        }
      }}
      onMouseOut={e => {
        if (!deshabilitado && !activo) {
          e.currentTarget.style.backgroundColor = 'transparent'
        }
      }}
    >
      {texto}
    </button>
  )
}