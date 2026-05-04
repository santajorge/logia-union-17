import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { NextResponse } from 'next/server'

const resend = new Resend(process.env.RESEND_API_KEY)
const CRON_SECRET = process.env.CRON_SECRET

// Usamos la Llave Maestra para poder leer todos los datos sin que nos bloquee la seguridad
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const MESES = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'
]

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')

  if (!secret || secret !== CRON_SECRET) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const ahora = new Date()
  const mesActual = MESES[ahora.getMonth()]
  const anioActual = ahora.getFullYear()
  const hoy = ahora.toISOString().split('T')[0]
  const aliasTransferencia = process.env.ALIAS_TRANSFERENCIA || 'consultar con el tesorero'

  const resultados = {
    enviados: 0,
    sin_email: 0,
    errores: [],
  }

  try {
    // Usamos supabaseAdmin en lugar de supabase
    const { data: hermanos, error: errHermanos } = await supabaseAdmin
      .from('hermanos')
      .select(`
        id, nombre, apellido, email, saldo, exento, exento_hasta, exento_motivo, tipo_cuota_id,
        tipos_cuota (nombre)
      `)
      .eq('activo', true)
      .eq('estado', 'activo')

    if (errHermanos) throw errHermanos

    for (const hermano of hermanos) {
      if (!hermano.email) {
        resultados.sin_email++
        continue
      }

      let estadoTexto = ''
      let estadoColor = ''
      let mensajeEstado = ''

      if (hermano.exento) {
        estadoTexto = 'Exento de cápita'
        estadoColor = '#854F0B' // Tono bronce/dorado oscuro
        const hasta = hermano.exento_hasta
          ? new Date(hermano.exento_hasta + 'T00:00:00').toLocaleDateString('es-AR')
          : 'fecha indefinida'
        mensajeEstado = `Tu exención de cápita está vigente hasta el ${hasta}.`
        if (hermano.exento_motivo) {
          mensajeEstado += ` Motivo: ${hermano.exento_motivo}.`
        }
      } else if (hermano.saldo >= 0) {
        estadoTexto = 'A plomo'
        estadoColor = '#3B6D11' // Verde
        mensajeEstado = 'Tu situación con el tesoro está al día. No tenés deuda pendiente. ¡Gracias por tu compromiso!'
      } else {
        estadoTexto = 'Con deuda'
        estadoColor = '#A32D2D' // Rojo
        const deuda = Math.abs(hermano.saldo)
        mensajeEstado = `Tenés un saldo pendiente de <strong>${formatPesos(deuda)}</strong> con el tesoro del taller. Te pedimos que regularices tu situación a la brevedad.`
      }

      // Buscamos la cuota usando supabaseAdmin
      const { data: cuota } = await supabaseAdmin
        .from('cuotas')
        .select('importe')
        .eq('tipo_cuota_id', hermano.tipo_cuota_id)
        .lte('vigencia_desde', hoy)
        .order('vigencia_desde', { ascending: false })
        .limit(1)
        .single()

      const importeCuota = cuota ? formatPesos(cuota.importe) : 'a consultar'

      // Enviar el mail
      const { error: errMail } = await resend.emails.send({
        from: 'Tesorería Logia Sanitas <tesoreria@logiasanitas763.com.ar>',
        to: hermano.email,
        subject: `Estado de Cuenta - ${mesActual} ${anioActual}`,
        html: templateMail({
          nombre: hermano.nombre,
          apellido: hermano.apellido,
          tipoCuota: hermano.tipos_cuota?.nombre || '—',
          importeCuota,
          saldo: hermano.saldo,
          estadoTexto,
          estadoColor,
          mensajeEstado,
          mesActual,
          anioActual,
          exento: hermano.exento,
          aliasTransferencia,
        })
      })

      if (errMail) {
        resultados.errores.push(`Error enviando a ${hermano.email}: ${errMail.message}`)
        continue
      }

      await supabaseAdmin.from('auditoria').insert({
        accion: 'recordatorio_enviado',
        hermano_id: hermano.id,
        detalle: `Estado de cuenta enviado a ${hermano.email} — ${mesActual} ${anioActual}`,
        usuario: 'sistema'
      })

      resultados.enviados++
    }

    return NextResponse.json({
      ok: true,
      fecha: hoy,
      ...resultados,
      mensaje: `Notificaciones completadas. ${resultados.enviados} mails enviados, ${resultados.sin_email} hermanos sin email.`
    })

  } catch (error) {
    console.error('Error en notificaciones:', error)
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }
}

// ─── Helper de Formato ───────────────────────────────────────────────────
function formatPesos(monto) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0
  }).format(monto)
}

// ─── Template del mail ────────────────────────────────────────
function templateMail({
  nombre, apellido, tipoCuota, importeCuota,
  saldo, estadoTexto, estadoColor, mensajeEstado,
  mesActual, anioActual, exento, aliasTransferencia
}) {
  return `
  <div style="background-color: #fdfbf7; padding: 40px 20px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e8e6e0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
      
      <div style="background-color: #1a1a2e; padding: 30px; text-align: center;">
        <p style="margin:0;font-size:11px;color:#CDA434;letter-spacing:0.2em;margin-bottom:8px;">A L.·.G.·.D.·.G.·.A.·.D.·.U.·.</p>
        <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 500;">Resp.·. Log.·. Sanitas Sanitatum N° 763</h1>
        <p style="color: #9e9b8e; margin: 5px 0 0; font-size: 12px;">Or.·. de Rosario</p>
      </div>

      <div style="padding: 40px 30px;">
        <p style="font-size: 13px; color: #888; text-transform: uppercase; letter-spacing: 1px; margin-top: 0;">
          Estado de Cuenta — ${mesActual} ${anioActual}
        </p>
        <p style="font-size: 18px; color: #1a1a2e; margin-bottom: 20px;">Q.·.H.·. <strong>${nombre} ${apellido}</strong>,</p>
        
        <p style="font-size: 14px; color: #555; line-height: 1.6;">
          Te enviamos el resumen actualizado de tu situación con el Tesoro del taller.
        </p>

        <!-- RECUADRO DE ESTADO -->
        <div style="background-color: #fafaf8; border: 1px solid #e8e6e0; border-radius: 8px; padding: 25px; margin: 30px 0; text-align: center;">
          <p style="margin: 0 0 5px; font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 1px;">Tu Estado Actual</p>
          <p style="margin: 0 0 15px; font-size: 24px; font-weight: 700; color: ${estadoColor};">${estadoTexto}</p>
          
          ${!exento ? `
            <div style="height: 1px; background-color: #e8e6e0; margin: 15px auto; width: 50%;"></div>
            <p style="margin: 15px 0 5px; font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 1px;">Saldo con el Tesoro</p>
            <p style="margin: 0; font-size: 20px; font-weight: 600; color: ${estadoColor};">
              ${saldo < 0 ? '-' : ''}${formatPesos(Math.abs(saldo))}
            </p>
          ` : ''}
        </div>

        <p style="font-size: 14px; color: #444; line-height: 1.6; margin-bottom: 30px;">
          ${mensajeEstado}
        </p>

        <!-- DATOS DE LA CUOTA -->
        <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e8e6e0; border-radius: 8px; overflow: hidden; margin-bottom: 20px;">
          <tr>
            <td style="padding: 15px 20px; border-bottom: 1px solid #e8e6e0;">
              <p style="margin: 0; font-size: 11px; color: #888; text-transform: uppercase;">Tipo de Cápita</p>
              <p style="margin: 4px 0 0; font-size: 14px; color: #1a1a2e; font-weight: 500;">${tipoCuota}</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 15px 20px; border-bottom: 1px solid #e8e6e0;">
              <p style="margin: 0; font-size: 11px; color: #888; text-transform: uppercase;">Valor Mensual Vigente</p>
              <p style="margin: 4px 0 0; font-size: 14px; color: #1a1a2e; font-weight: 500;">${importeCuota}</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 15px 20px; background-color: #fcfcfb;">
              <p style="margin: 0 0 8px; font-size: 11px; color: #CDA434; font-weight: 600; text-transform: uppercase;">Datos para transferencia</p>
              <p style="margin: 0 0 4px; font-size: 12px; color: #888;">Alias</p>
              <p style="margin: 0 0 10px; font-size: 16px; font-weight: 600; color: #1a1a2e;">${aliasTransferencia}</p>
              <p style="margin: 0; font-size: 11px; color: #666; line-height: 1.5;">Una vez realizada la transferencia, recordá enviar el comprobante al H.·. Tesorero.</p>
            </td>
          </tr>
        </table>
        
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #f0efe9; text-align: center;">
          <p style="font-size: 12px; color: #aaa; margin: 0;">S.·. F.·. U.·.</p>
        </div>
      </div>
    </div>
    
    <p style="text-align: center; font-size: 11px; color: #bbb; margin-top: 20px;">
      Este es un mensaje automático generado por el Sistema de Gestión Interna.<br>
      © ${anioActual} Logia Sanitas Sanitatum N° 763.
    </p>
  </div>
  `
}