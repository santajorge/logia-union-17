import { Libre_Baskerville, Montserrat } from 'next/font/google'
import "./globals.css"

const libreBaskerville = Libre_Baskerville({ 
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-baskerville',
  display: 'swap',
})

const montserrat = Montserrat({ 
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-montserrat',
  display: 'swap',
})

export const metadata = {
  title: "Área Reservada | Logia Unión N° 17",
  description: "Sistema de gestión interna de la Aug.·. y Resp.·. Log.·. Unión N° 17",
}

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={`${libreBaskerville.variable} ${montserrat.variable}`}>
      <body style={{ fontFamily: 'var(--font-montserrat), sans-serif' }}>
        {children}
      </body>
    </html>
  )
}