'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import BotonLogout from './components/BotonLogout'
import { AuthProvider, useAuth } from '@/context/AuthContext'

export default function PanelLayout({ children }) {
  return (
    <AuthProvider>
      <LayoutInterno>{children}</LayoutInterno>
    </AuthProvider>
  )
}

function LayoutInterno({ children }) {
  const pathname = usePathname()
  const [menuAbierto, setMenuAbierto] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  
  const { usuario, cargandoAuth } = useAuth()
  const rol = usuario?.rol_oficial

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleLinkClick = () => {
    if (isMobile) setMenuAbierto(false)
  }

  const esVenerable = rol === 'Venerable Maestro'
  const veTesoreria = esVenerable || rol === 'Tesorero'
  const veSecretaria = esVenerable || rol === 'Secretario'
  const veHospitalario = esVenerable || rol === 'Hospitalario'
  const veColumnaSur = esVenerable || rol === '1er Vigilante'
  const veColumnaNorte = esVenerable || rol === '2do Vigilante'

  const router = useRouter()

  useEffect(() => {
    if (cargandoAuth) return

    if (!usuario) {
      router.push('/')
      return
    }

    if (pathname.startsWith('/panel/secretaria') && !veSecretaria) {
      router.push('/panel/mi-perfil')
    } 
    else if (pathname.startsWith('/panel/tesoreria') && !veTesoreria) {
      router.push('/panel/mi-perfil')
    } 
    else if (pathname.startsWith('/panel/hospitalario') && !veHospitalario) {
      router.push('/panel/mi-perfil')
    } 
    else if (pathname.startsWith('/panel/columna-norte') && !veColumnaNorte) {
      router.push('/panel/mi-perfil')
    } 
    else if (pathname.startsWith('/panel/columna-sur') && !veColumnaSur) {
      router.push('/panel/mi-perfil')
    }
  }, [pathname, usuario, cargandoAuth, router, veSecretaria, veTesoreria, veHospitalario, veColumnaNorte, veColumnaSur])
  
    if (cargandoAuth) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#000000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#CDA434', fontFamily: 'system-ui, sans-serif' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/templo-cargando.gif"
          alt="Abriendo las Puertas"
          style={{ width: '180px', marginBottom: '1.5rem' }}
        />
        <p style={{ fontSize: '13px', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: '500', margin: 0, color: '#CDA434' }}>
          Abriendo las Puertas del Templo...
        </p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', minHeight: '100vh', backgroundColor: 'var(--color-marfil)', fontFamily: 'var(--font-montserrat)' }}>
      
      {/* BARRA SUPERIOR MOBILE */}
      {isMobile && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--color-institucional)', padding: '1rem', color: 'var(--color-marfil)' }}>
          <span style={{ fontSize: '16px', fontWeight: '600', fontFamily: 'var(--font-montserrat)' }}>Logia Unión N° 17</span>
          <button onClick={() => setMenuAbierto(!menuAbierto)} style={{ background: 'none', border: 'none', color: 'var(--color-oro)', fontSize: '24px', cursor: 'pointer' }}>
            {menuAbierto ? '✖' : '☰'}
          </button>
        </div>
      )}

      {/* BARRA LATERAL (Sidebar) */}
      <aside style={{
        width: isMobile ? '100%' : '260px', // Un poco más ancho para respirar mejor
        backgroundColor: 'var(--color-institucional)', // Azul institucional
        color: 'var(--color-marfil)',
        display: (isMobile && !menuAbierto) ? 'none' : 'flex',
        flexDirection: 'column',
        padding: '2rem 0 1.5rem',
        flexShrink: 0,
        height: isMobile ? 'auto' : '100vh',
        position: isMobile ? 'absolute' : 'sticky',
        top: isMobile ? '60px' : 0,
        zIndex: 50,
        boxShadow: isMobile ? '0 10px 15px rgba(0,0,0,0.1)' : 'none'
      }}>

        {!isMobile && (
          <div style={{ padding: '0 1.5rem 1.5rem', borderBottom: '1px solid rgba(207, 181, 59, 0.2)' }}>
            <p style={{ fontSize: '11px', color: 'var(--color-oro)', marginBottom: '6px', letterSpacing: '0.1em' }}>A.·.L.·.G.·.D.·.G.·.A.·.D.·.U.·.</p>
            <p style={{ fontSize: '16px', fontWeight: '600', color: 'var(--color-marfil)', lineHeight: '1.4', fontFamily: 'var(--font-baskerville)' }}>Logia Unión N° 17</p>
            <p style={{ fontSize: '12px', color: 'var(--color-gris)', marginTop: '6px', opacity: 0.9 }}>Cargo: {rol || 'Hermano'}</p>
          </div>
        )}

        <nav style={{ padding: '1.5rem 0', flex: 1, overflowY: 'auto' }}>
          <Enlace href="/panel" texto="Panel General" onClick={handleLinkClick} exacto={true} />
          <Enlace href="/panel/mi-perfil" texto="Mi Perfil" onClick={handleLinkClick} />

          {(veSecretaria || veTesoreria) && (
            <div style={estiloGrupo}>
              <p style={estiloTituloGrupo}>ADMINISTRACIÓN</p>
              <Enlace href="/panel/tesoreria/hermanos" texto="Cuadro Lógico" onClick={handleLinkClick} />
            </div>
          )}

          {veSecretaria && (
            <div style={estiloGrupo}>
              <p style={estiloTituloGrupo}>SECRETARÍA</p>
              <Enlace href="/panel/secretaria/candidatos" texto="Candidatos / Profanos" onClick={handleLinkClick} />
              <Enlace href="/panel/secretaria/tenidas" texto="Tenidas y Asistencia" onClick={handleLinkClick} />
              {(rol === 'Secretario' || esVenerable) && (
                <Enlace href="/panel/secretaria/registro-historico" texto="Registro Histórico" onClick={handleLinkClick} />
              )}
            </div>
          )}

          {veTesoreria && (
            <div style={estiloGrupo}>
              <p style={estiloTituloGrupo}>TESORERÍA</p>
              <Enlace href="/panel/tesoreria" texto="Dashboard Tesoro" onClick={handleLinkClick} exacto={true} />
              <Enlace href="/panel/tesoreria/ingresos" texto="Ingresos" onClick={handleLinkClick} />
              <Enlace href="/panel/tesoreria/egresos" texto="Egresos" onClick={handleLinkClick} />
              <Enlace href="/panel/tesoreria/iniciaciones" texto="Próximas Iniciaciones" onClick={handleLinkClick} />
              <Enlace href="/panel/tesoreria/configuracion" texto="Configuración" onClick={handleLinkClick} />
            </div>
          )}

          {veHospitalario && (
            <div style={estiloGrupo}>
              <p style={estiloTituloGrupo}>HOSPITALARIO</p>
              <Enlace href="/panel/hospitalario" texto="Saco de Beneficencia" onClick={handleLinkClick} />
            </div>
          )}

          {veColumnaSur && (
            <div style={estiloGrupo}>
              <p style={estiloTituloGrupo}>COLUMNA SUR</p>
              <Enlace href="/panel/columna-sur" texto="Compañeros" onClick={handleLinkClick} />
            </div>
          )}

          {veColumnaNorte && (
            <div style={estiloGrupo}>
              <p style={estiloTituloGrupo}>COLUMNA NORTE</p>
              <Enlace href="/panel/columna-norte" texto="Aprendices" onClick={handleLinkClick} />
            </div>
          )}
        </nav>

        <div style={{ padding: '1rem 1.5rem' }}>
          <BotonLogout />
        </div>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <main style={{
        flex: 1,
        padding: isMobile ? '1.5rem' : '3rem',
        overflowY: 'auto',
        display: (isMobile && menuAbierto) ? 'none' : 'block',
        backgroundColor: 'var(--color-marfil)' // Fondo claro para el contenido
      }}>
        {children}
      </main>

    </div>
  )
}

function Enlace({ href, texto, onClick, exacto = false }) {
  const pathname = usePathname()
  const activo = exacto ? pathname === href : (pathname === href || pathname.startsWith(`${href}/`))

  return (
    <Link href={href} onClick={onClick} style={{
      display: 'block',
      padding: '0.8rem 1.5rem',
      fontSize: '14px',
      color: activo ? 'var(--color-oro)' : 'var(--color-marfil)',
      backgroundColor: activo ? 'rgba(0,0,0,0.15)' : 'transparent',
      borderLeft: activo ? '4px solid var(--color-oro)' : '4px solid transparent',
      textDecoration: 'none',
      transition: 'all 0.2s ease',
      fontWeight: activo ? '600' : '400',
      opacity: activo ? 1 : 0.8
    }}
    onMouseOver={(e) => {
      if(!activo) {
        e.currentTarget.style.color = 'var(--color-oro)'
        e.currentTarget.style.opacity = 1
      }
    }}
    onMouseOut={(e) => {
      if(!activo) {
        e.currentTarget.style.color = 'var(--color-marfil)'
        e.currentTarget.style.opacity = 0.8
      }
    }}
    >
      {texto}
    </Link>
  )
}

const estiloGrupo = {
  marginTop: '1.2rem',
  borderTop: '1px solid rgba(255,255,255,0.08)',
  paddingTop: '0.8rem'
}

const estiloTituloGrupo = {
  fontSize: '10px',
  color: 'var(--color-gris)',
  padding: '0 1.5rem',
  marginBottom: '6px',
  letterSpacing: '0.15em',
  fontWeight: '700'
}