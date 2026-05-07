import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { supabase } from '@/lib/supabase'

// Inicializamos Resend con la variable de entorno
const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request) {
  try {
    const { tenidaId, fecha, tipo, grado } = await request.json()

    // 1. Traer los emails y los roles de todos los hermanos activos
    const { data: hermanos, error } = await supabase
      .from('hermanos')
      .select('email, nombre, apellido, rol_oficial')
      .eq('activo', true)

    if (error) throw error

    // Filtramos solo los que tienen correo para el envío
    const correosHermanos = hermanos.filter(h => h.email).map(h => h.email)

    if (correosHermanos.length === 0) {
      return NextResponse.json({ error: 'No se encontraron correos para enviar.' }, { status: 400 })
    }

    // 2. Identificar al VM y al Secretario para las firmas
    const vm = hermanos.find(h => h.rol_oficial === 'Venerable Maestro') || { nombre: '', apellido: '[Venerable Maestro]' }
    const secretario = hermanos.find(h => h.rol_oficial === 'Secretario') || { nombre: '', apellido: '[Secretario]' }
    
    const nombreVM = `${vm.nombre} ${vm.apellido}`.trim()
    const nombreSecretario = `${secretario.nombre} ${secretario.apellido}`.trim()

    // 3. Formatear los datos para el correo
    const tipoTenida = tipo.charAt(0).toUpperCase() + tipo.slice(1)
    
    // Convertir '2026-04-27' a 'Lunes 27 de abril de 2026'
    const [year, month, day] = fecha.split('T').split('-')
    const dateObj = new Date(year, month - 1, day)
    let fechaFormateada = dateObj.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    fechaFormateada = fechaFormateada.charAt(0).toUpperCase() + fechaFormateada.slice(1) // Capitaliza la primera letra

    // 4. Diseño del Correo (Plantilla HTML Masónica con tu texto)
    const htmlContent = `
      <div style="font-family: 'Georgia', serif; color: #1a1a2e; max-width: 600px; margin: 0 auto; border: 1px solid #d1d0c8; border-radius: 8px; padding: 40px; background-color: #ffffff; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
        
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
          VV.·. y QQ.·. HH.·. todos,
        </p>
        
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
          Por mandato de nuestro V.·.M.·. <strong>${nombreVM}</strong>, quedan todos convocados a volver a tomar las herramientas de la Aug.·. y Resp.·. Log.·. "Unión" n° 17, en Tenida ${tipoTenida}, este <strong>${fechaFormateada}</strong> (e.·.v.·.), en la Casa de la Masonería Rosarina, Laprida 1027 (Rosario).
        </p>

        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
          El horario de la convocatoria es a las 19:30 hs, a los efectos de llevar a cabo los preparativos necesarios para abrir trabajos de manera puntual a las 20:00 hs. Adjunto a este correo encontrarán el Orden del Día de la tenida.
        </p>

        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
          Luego de finalizados los trabajos ritualísticos, nos quedaremos a compartir un ágape fraterno.
        </p>

        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 30px; background-color: #fafaf8; border-left: 4px solid #CDA434; padding: 15px;">
          A continuación, les comparto el enlace para poder completar el formulario y confirmar vuestra presencia —> <a href="https://forms.gle/TnCYE9d8JCVHSjaX9" style="color: #CDA434; text-decoration: none; font-weight: bold;">https://forms.gle/TnCYE9d8JCVHSjaX9</a>
        </p>

        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
          Los saludo a todos con un T.·.A.·.F.·. que nos distingue como masones.
        </p>

        <div style="border-top: 1px solid rgba(207, 181, 59, 0.3); padding-top: 20px; margin-top: 20px;">
          <p style="font-size: 14px; color: #1a1a2e; margin: 0; line-height: 1.5;">
            Su H.·.,<br>
            <strong>${nombreSecretario}</strong><br>
            Secretario<br>
            Aug.·. y Resp.·. Log.·. Unión n° 17<br>
            Or.·. de Rosario
          </p>
        </div>

      </div>
    `

    // 5. Disparar el envío por Resend
    // RECORDATORIO: Hasta validar dominio propio en Resend, usar "onboarding@resend.dev" en 'from'.
    const { data, error: resendError } = await resend.emails.send({
      from: 'Logia Unión N° 17 <onboarding@resend.dev>', 
      to: ['secretaria@logia-union.dev'], // Correo base/prueba
      bcc: correosHermanos, // Todos los correos de la logia en copia oculta
      subject: `Convocatoria: Tenida ${tipoTenida} - Logia Unión n° 17`,
      html: htmlContent,
    })

    if (resendError) {
      console.error('Error de Resend:', resendError)
      return NextResponse.json({ error: resendError.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, data })
    
  } catch (error) {
    console.error('Error en la API de convocatoria:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}