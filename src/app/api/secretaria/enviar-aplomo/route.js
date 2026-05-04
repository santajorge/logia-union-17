// src/app/api/secretaria/enviar-aplomo/route.js
import { Resend } from 'resend'
import { NextResponse } from 'next/server'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request) {
  try {
    const { email, nombreAplomador, candidato, telefonoCandidato } = await request.json()

    if (!email || !nombreAplomador || !candidato) {
      return NextResponse.json({ error: 'Faltan datos requeridos' }, { status: 400 })
    }

    const { error: errMail } = await resend.emails.send({
      from: 'Secretaría Logia Sanitas <secretaria@logiasanitas763.com.ar>',
      to: email,
      subject: `Designación de Aplomo — Profano ${candidato}`,
      html: templateMail({ nombreAplomador, candidato, telefonoCandidato })
    })

    if (errMail) throw new Error(errMail.message)

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }
}

function templateMail({ nombreAplomador, candidato, telefonoCandidato }) {
  return `
<!DOCTYPE html>
<html lang="es">
<body style="margin:0;padding:0;background-color:#f5f4f0;font-family:sans-serif;">
  <table width="100%" style="background-color:#f5f4f0;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="560" style="background-color:#ffffff;border-radius:12px;overflow:hidden;">
          <tr>
            <td style="background-color:#1a1a2e;padding:24px 32px;color:#ffffff;">
              <p style="margin:0;font-size:11px;color:#9e9b8e;">A.·.L.·.G.·.D.·.G.·.A.·.D.·.U.·.</p>
              <p style="margin:6px 0 0;font-size:18px;">Logia Sanitas Sanitatum N°763</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <p style="font-size:20px;color:#1a1a2e;">Q.·.H.·. ${nombreAplomador}</p>
              <p style="font-size:14px;color:#444;line-height:1.6;">
                Por disposición del V.·.M.·., has sido designado para el aplomo del siguiente candidato:
              </p>
              
              <div style="background-color:#fafaf8;border-left:4px solid #1a1a2e;padding:16px;margin:24px 0;">
                <p style="margin:0;font-size:12px;color:#888;text-transform:uppercase;">Profano</p>
                <p style="margin:4px 0 0;font-size:18px;font-weight:600;color:#1a1a2e;">${candidato}</p>
                
                <p style="margin:12px 0 0;font-size:12px;color:#888;text-transform:uppercase;">Teléfono de contacto</p>
                <p style="margin:4px 0 0;font-size:16px;color:#1a1a2e;font-weight:500;">
                  <a href="tel:${telefonoCandidato}" style="color:#1a1a2e;text-decoration:none;">${telefonoCandidato || 'No registrado'}</a>
                </p>
              </div>

              <p style="font-size:13px;color:#666;line-height:1.5;">
                Te facilitamos el teléfono para que puedas coordinar la entrevista a la brevedad. 
                Recordá solicitar la ficha de admisión completa al V.·.M.·. o al Q.·.H.·. Secretario para el análisis previo al encuentro.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}