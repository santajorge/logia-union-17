import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { Resend } from 'resend'

// Claves de entorno
const CRON_SECRET = process.env.CRON_SECRET
const resend = new Resend(process.env.RESEND_API_KEY)

// 🚀 ACÁ ESTÁ LA MAGIA: Creamos un cliente Admin con la Llave Maestra
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // <--- Llave maestra que salta el RLS
)

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')

  if (!secret || secret !== CRON_SECRET) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const hoy = new Date().toISOString().split('T')[0]
  const resultados = { devengados: 0, exentos_saltados: 0, correos_enviados: 0, errores: [] }

  try {
    // USAMOS SUPABASE ADMIN
    const { data: hermanos, error: errHermanos } = await supabaseAdmin
      .from('hermanos')
      .select(`
        id, nombre, apellido, email, saldo, exento, exento_hasta, tipo_cuota_id,
        tipos_cuota (id, nombre)
      `)
      .eq('activo', true)

    if (errHermanos) throw errHermanos

    for (const hermano of hermanos) {
      if (hermano.exento) {
        if (!hermano.exento_hasta || hermano.exento_hasta >= hoy) {
          resultados.exentos_saltados++
          continue
        }
        await supabaseAdmin.from('hermanos').update({ exento: false, exento_hasta: null }).eq('id', hermano.id)
      }

      const { data: cuota, error: errCuota } = await supabaseAdmin
        .from('cuotas')
        .select('importe, vigencia_desde')
        .eq('tipo_cuota_id', hermano.tipo_cuota_id)
        .lte('vigencia_desde', hoy)
        .order('vigencia_desde', { ascending: false })
        .limit(1)
        .single()

      if (errCuota || !cuota) {
        resultados.errores.push(`Sin cuota vigente: ${hermano.apellido}, ${hermano.nombre}`)
        continue
      }

      const nuevoSaldo = Number(hermano.saldo) - Number(cuota.importe)
      const { error: errUpdate } = await supabaseAdmin
        .from('hermanos')
        .update({ saldo: nuevoSaldo })
        .eq('id', hermano.id)

      if (errUpdate) {
        resultados.errores.push(`Error al actualizar: ${hermano.apellido}, ${hermano.nombre}`)
        continue
      }

      await supabaseAdmin.from('auditoria').insert({
        accion: 'devengamiento_cuota',
        hermano_id: hermano.id,
        monto: cuota.importe,
        detalle: `Devengamiento de ${hermano.tipos_cuota?.nombre} — $${cuota.importe}. Saldo nuevo: $${nuevoSaldo}.`,
        usuario: 'sistema'
      })
      resultados.devengados++

      // ... dentro del bucle de hermanos, reemplazamos el envío de mail:

if (hermano.email) {
  try {
    await resend.emails.send({
      // IMPORTANTE: Una vez verificado el dominio, cambiá 'onboarding@resend.dev' 
      // por 'tesoreria@logiasanitas763.com.ar'
      from: 'Tesorería Sanitas <tesoreria@logiasanitas763.com.ar>', 
      to: hermano.email,
      subject: `Aviso de Capita Mensual - ${hermano.apellido}, ${hermano.nombre}`,
      html: `
        <div style="background-color: #fdfbf7; padding: 40px 20px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e8e6e0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
            
            <div style="background-color: #1a1a2e; padding: 30px; text-align: center;">
              <h1 style="color: #CDA434; margin: 0; font-size: 22px; letter-spacing: 1px; text-transform: uppercase;">Logia Sanitas Sanitatum</h1>
              <p style="color: #ffffff; margin: 5px 0 0; font-size: 12px; opacity: 0.8;">N° 763 - Oriente de Rosario</p>
            </div>

            <div style="padding: 40px 30px;">
              <p style="font-size: 16px; color: #333; margin-top: 0;">Q.·.H.·. <strong>${hermano.nombre} ${hermano.apellido}</strong>,</p>
              
              <p style="font-size: 14px; color: #555; lineHeight: 1.6;">
                Se ha procesado el devengamiento automático de la capita mensual correspondiente a tu membresía como <strong>${hermano.tipos_cuota?.nombre || 'Hermano'}</strong>.
              </p>

              <div style="background-color: #fafaf8; border: 1px solid #e8e6e0; border-radius: 8px; padding: 25px; margin: 30px 0; text-align: center;">
                <p style="margin: 0; font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 1px;">Monto Devengado</p>
                <p style="margin: 5px 0 15px; font-size: 28px; font-weight: 700; color: #A32D2D;">$${cuota.importe.toLocaleString('es-AR')}</p>
                
                <div style="height: 1px; background-color: #e8e6e0; margin: 15px auto; width: 50%;"></div>
                
                <p style="margin: 15px 0 5px; font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 1px;">Tu Saldo Actual</p>
                <p style="margin: 0; font-size: 20px; font-weight: 600; color: ${nuevoSaldo >= 0 ? '#3B6D11' : '#A32D2D'};">
                  $${nuevoSaldo.toLocaleString('es-AR')}
                </p>
              </div>

              <p style="font-size: 13px; color: #666; line-height: 1.6;">
                Recordá que podés regularizar tu situación contactando al H.·. Tesorero o realizando una transferencia al alias de la Logia (SANITAS.2026.LEMON). Tu aporte es fundamental para el sostenimiento de nuestras columnas.
              </p>
              
              <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #f0efe9; text-align: center;">
                <p style="font-size: 12px; color: #aaa; margin: 0;">S.·. F.·. U.·.</p>
              </div>
            </div>
          </div>
          
          <p style="text-align: center; font-size: 11px; color: #bbb; margin-top: 20px;">
            Este es un mensaje automático generado por el Sistema de Gestión Interna.<br>
            © 2026 Logia Sanitas Sanitatum N° 763.
          </p>
        </div>
      `
    });
      resultados.correos_enviados++;
    } catch (emailError) {
      resultados.errores.push(`Error al enviar mail a ${hermano.email}`);
      }
    }
    }
    return NextResponse.json({
      ok: true,
      fecha: hoy,
      ...resultados,
      mensaje: `Proceso completado: ${resultados.devengados} devengados, ${resultados.correos_enviados} emails enviados.`
    })

  } catch (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }
}