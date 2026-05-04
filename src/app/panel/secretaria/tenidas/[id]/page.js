'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

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

  if (cargando) return <p style={{ padding: '2rem', fontSize: '13px', color: '#888' }}>Abriendo Balaustre...</p>

  const formatFecha = (fecha) => {
    return new Date(fecha + 'T00:00:00').toLocaleDateString('es-AR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    })
  }

  return (
    <div style={{ maxWidth: '800px', paddingBottom: '3rem' }}>
      
      <div style={{ marginBottom: '1.5rem' }}>
        <Link href="/panel/secretaria/tenidas" style={{ fontSize: '12px', color: '#666', textDecoration: 'none', marginBottom: '8px', display: 'inline-block' }}>
          ← Volver al Libro
        </Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: '600', color: '#1a1a2e', margin: '0 0 4px', textTransform: 'capitalize' }}>
              Tenida {tenida?.tipo}
            </h1>
            <p style={{ fontSize: '13px', color: '#888', margin: '0 0 12px 0' }}>
              {tenida ? formatFecha(tenida.fecha) : ''} — Taller en Grado {tenida?.grado}
            </p>
            
            {tenida?.estado === 'abierta' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#ffffff', padding: '6px 12px', borderRadius: '8px', border: '1px solid #e8e6e0', width: 'fit-content' }}>
                <label style={{ fontSize: '11px', color: '#666', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Balaustre Nº</label>
                <input
                    type="text"
                    value={tenida.acta_nro || ''}
                    onChange={(e) => setTenida({ ...tenida, acta_nro: e.target.value })}
                    placeholder="Ej: 145"
                    style={{ 
                        width: '80px', 
                        padding: '4px 8px', 
                        border: '1px solid #c8c5b8', 
                        borderRadius: '4px', 
                        fontSize: '13px', 
                        outline: 'none', 
                        textAlign: 'center',
                        color: '#1a1a2e',          /* <-- Magia oscura para el texto */
                        backgroundColor: '#ffffff' /* <-- Fondo blanco puro */
                    }}
                />
              </div>
            ) : (
              <p style={{ fontSize: '13px', color: '#1a1a2e', fontWeight: '500', margin: 0 }}>
                {tenida?.acta_nro ? `Balaustre Nº ${tenida.acta_nro}` : 'Sin número de Balaustre'}
              </p>
            )}

          </div>
          <span style={{ fontSize: '11px', fontWeight: '600', padding: '4px 12px', borderRadius: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', backgroundColor: tenida?.estado === 'abierta' ? '#EAF3DE' : '#f5f4f0', color: tenida?.estado === 'abierta' ? '#27500A' : '#888' }}>
            Estado: {tenida?.estado}
          </span>
        </div>
      </div>

      {mensaje.texto && (
        <div style={{ backgroundColor: mensaje.tipo === 'error' ? '#FCEBEB' : '#EAF3DE', color: mensaje.tipo === 'error' ? '#791F1F' : '#27500A', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '13px', marginBottom: '1.5rem' }}>
          {mensaje.texto}
        </div>
      )}

      {/* CUADRO LÓGICO Y SEMÁFORO */}
      <div style={{ backgroundColor: '#ffffff', border: '0.5px solid #e8e6e0', borderRadius: '12px', padding: '1rem' }}>
        <p style={{ fontSize: '12px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 1rem 0.5rem', fontWeight: '500' }}>
          Cuadro Lógico Habilitado ({hermanos.length})
        </p>
        
        {hermanos.map((hermano) => {
          // 1. Siempre calculamos su grado base (1, 2 o 3)
          const gradoTexto = Number(hermano.grado) === 3 ? 'Maestro' : Number(hermano.grado) === 2 ? 'Compañero' : 'Aprendiz'
          
          // 2. ¿Tiene cargo? Solo da verdadero si el campo NO está vacío en Supabase
          const esOficial = hermano.rol_oficial && hermano.rol_oficial.trim() !== ''

          return (
            <div key={hermano.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 8px', borderBottom: '1px solid #f0efe9', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <p style={{ margin: 0, fontSize: '14px', fontWeight: '500', color: '#1a1a2e' }}>
                  {hermano.apellido}, {hermano.nombre}
                </p>
                <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#888' }}>
                  {/* Imprime su grado base */}
                  {gradoTexto} 
                  
                  {/* Si es oficial, le agrega el cargo dorado al lado */}
                  {esOficial && (
                    <>
                      <span style={{ margin: '0 6px', color: '#c8c5b8' }}>|</span>
                      <span style={{ color: '#CDA434', fontWeight: '600', letterSpacing: '0.02em' }}>{hermano.rol_oficial}</span>
                    </>
                  )}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '4px', backgroundColor: '#fafaf8', padding: '4px', borderRadius: '8px', border: '1px solid #e8e6e0' }}>
                <BotonEstado activo={asistencias[hermano.id] === 'presente'} color="#3B6D11" texto="Presente" onClick={() => cambiarEstado(hermano.id, 'presente')} deshabilitado={tenida?.estado === 'cerrada'} />
                <BotonEstado activo={asistencias[hermano.id] === 'ausente_justificado'} color="#854F0B" texto="Justificado" onClick={() => cambiarEstado(hermano.id, 'ausente_justificado')} deshabilitado={tenida?.estado === 'cerrada'} />
                <BotonEstado activo={asistencias[hermano.id] === 'ausente_injustificado'} color="#A32D2D" texto="Ausente" onClick={() => cambiarEstado(hermano.id, 'ausente_injustificado')} deshabilitado={tenida?.estado === 'cerrada'} />
              </div>
            </div>
          )
        })}
      </div>

      {/* BARRA DE ACCIONES FLOTANTE */}
      <div style={{ position: 'sticky', bottom: '2rem', display: 'flex', justifyContent: 'space-between', gap: '1rem', marginTop: '2rem', backgroundColor: '#ffffff', padding: '1rem', borderRadius: '12px', border: '1px solid #e8e6e0', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', flexWrap: 'wrap' }}>
        
        {/* BOTÓN MÁGICO DEL ACTA */}
        <button onClick={generarBorradorActa} style={{ backgroundColor: '#ffffff', color: '#1a1a2e', border: '1px solid #1a1a2e', padding: '10px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
          📄 Generar Borrador de Acta
        </button>

        {tenida?.estado === 'abierta' ? (
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button onClick={() => guardarCambios(false)} disabled={guardando} style={{ backgroundColor: '#f5f4f0', color: '#1a1a2e', border: '1px solid #c8c5b8', padding: '10px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: '500', cursor: guardando ? 'not-allowed' : 'pointer' }}>
              Guardar Borrador
            </button>
            <button onClick={() => { if (window.confirm('¿Cerrar Tenida? Ya no podrás modificar las asistencias.')) guardarCambios(true) }} disabled={guardando} style={{ backgroundColor: '#1a1a2e', color: '#ffffff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: guardando ? 'not-allowed' : 'pointer' }}>
              Guardar y Cerrar Tenida
            </button>
          </div>
        ) : (
          <p style={{ fontSize: '13px', color: '#888', fontStyle: 'italic', margin: 'auto 0' }}>Balaustre cerrado y archivado.</p>
        )}
      </div>

      {/* MODAL DEL ACTA GENERADA */}
      {mostrarActa && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(26, 26, 46, 0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '2rem' }}>
          <div style={{ backgroundColor: '#ffffff', padding: '2rem', borderRadius: '12px', width: '100%', maxWidth: '700px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '18px', margin: 0, color: '#1a1a2e' }}>Borrador del Balaustre</h2>
              <button onClick={() => setMostrarActa(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#888' }}>✖</button>
            </div>
            
            <textarea 
              readOnly 
              value={textoActa} 
              style={{ flex: 1, width: '100%', padding: '1rem', fontFamily: 'monospace', fontSize: '13px', border: '1px solid #c8c5b8', borderRadius: '8px', backgroundColor: '#fafaf8', color: '#444', resize: 'none', outline: 'none', lineHeight: '1.6' }}
            />
            
            <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={copiarAlPortapapeles} style={{ backgroundColor: '#CDA434', color: '#1a1a2e', border: 'none', padding: '10px 24px', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                Copiar al Portapapeles
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
        color: activo ? '#ffffff' : '#888',
        border: 'none',
        padding: '6px 12px',
        borderRadius: '6px',
        fontSize: '11px',
        fontWeight: activo ? '600' : '500',
        cursor: deshabilitado ? 'default' : 'pointer',
        transition: 'all 0.2s',
        opacity: deshabilitado && !activo ? 0.4 : 1
      }}
    >
      {texto}
    </button>
  )
}