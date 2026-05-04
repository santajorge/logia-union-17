'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'

export default function NavbarPublico() {
  const [hoveredLink, setHoveredLink] = useState(null)
  const [menuAbierto, setMenuAbierto] = useState(false)

  const linkStyle = (id) => ({
    fontSize: '13px',
    color: hoveredLink === id ? 'var(--color-oro)' : 'var(--color-marfil)',
    textDecoration: 'none',
    transition: 'color 0.2s',
    cursor: 'pointer',
    padding: '0.5rem 0',
    fontFamily: 'var(--font-montserrat)',
    fontWeight: '500',
    opacity: hoveredLink === id ? 1 : 0.85
  })

  return (
    <nav style={{
      backgroundColor: 'var(--color-institucional)', // Fondo azul
      padding: '0 2rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      height: '64px',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      borderBottom: '2px solid var(--color-oro)' // Borde inferior dorado
    }}>

      {/* Logo + nombre */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Image
          src="/logo-union-17-blanco.png" // Cambiado al logo de la 17
          alt="Logo Logia Unión 17"
          width={40}
          height={40}
          style={{ objectFit: 'contain' }}
        />
        <div>
          <p style={{ fontSize: '14px', color: 'var(--color-marfil)', fontWeight: '600', margin: 0, fontFamily: 'var(--font-montserrat)' }}>
            Logia Unión
          </p>
          <p style={{ fontSize: '11px', color: 'var(--color-oro)', margin: 0, fontFamily: 'var(--font-montserrat)', letterSpacing: '0.05em' }}>
            N° 17 · Rosario
          </p>
        </div>
      </div>

      {/* Links — escritorio */}
      <div style={{ display: 'flex', gap: '28px', alignItems: 'center' }}
        className="nav-desktop">
        {[
          { id: 'nosotros', label: 'Nuestro Legado', href: '#nosotros' },
          { id: 'masoneria', label: 'La Masonería', href: '#masoneria' },
          { id: 'admision', label: 'Admisión', href: '#admision' },
          { id: 'contacto', label: 'Contacto', href: '#contacto' },
        ].map(link => (
          <a
            key={link.id}
            href={link.href}
            style={linkStyle(link.id)}
            onMouseEnter={() => setHoveredLink(link.id)}
            onMouseLeave={() => setHoveredLink(null)}
          >
            {link.label}
          </a>
        ))}
        <Link
          href="/panel" // Ajustar si la ruta cambia en el futuro
          style={{
            backgroundColor: hoveredLink === 'reservada' ? '#b8a134' : 'var(--color-oro)',
            color: 'var(--color-profundo)',
            padding: '8px 20px',
            borderRadius: '4px',
            fontWeight: '700',
            fontSize: '12px',
            textDecoration: 'none',
            transition: 'background-color 0.2s, transform 0.2s',
            whiteSpace: 'nowrap',
            fontFamily: 'var(--font-montserrat)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            transform: hoveredLink === 'reservada' ? 'translateY(-1px)' : 'none'
          }}
          onMouseEnter={() => setHoveredLink('reservada')}
          onMouseLeave={() => setHoveredLink(null)}
        >
          Área Reservada
        </Link>
      </div>

      {/* Botón hamburguesa — móvil */}
      <button
        onClick={() => setMenuAbierto(!menuAbierto)}
        style={{
          display: 'none',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '8px',
          flexDirection: 'column',
          gap: '5px'
        }}
        className="nav-hamburger"
        aria-label="Menú"
      >
        <span style={{ display: 'block', width: '22px', height: '2px', backgroundColor: 'var(--color-oro)' }} />
        <span style={{ display: 'block', width: '22px', height: '2px', backgroundColor: 'var(--color-oro)' }} />
        <span style={{ display: 'block', width: '22px', height: '2px', backgroundColor: 'var(--color-oro)' }} />
      </button>

      {/* Menú móvil desplegable */}
      {menuAbierto && (
        <div style={{
          position: 'absolute',
          top: '64px',
          left: 0,
          right: 0,
          backgroundColor: 'var(--color-institucional)',
          borderBottom: '2px solid var(--color-oro)',
          padding: '1.5rem 2rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.2rem',
          zIndex: 99,
          boxShadow: '0 10px 20px rgba(0,0,0,0.2)'
        }}
          className="nav-mobile-menu"
        >
          {[
            { href: '#nosotros', label: 'Nuestro Legado' },
            { href: '#masoneria', label: 'La Masonería' },
            { href: '#admision', label: 'Admisión' },
            { href: '#contacto', label: 'Contacto' },
          ].map(link => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMenuAbierto(false)}
              style={{ fontSize: '15px', color: 'var(--color-marfil)', textDecoration: 'none', fontFamily: 'var(--font-montserrat)' }}
            >
              {link.label}
            </a>
          ))}
          <Link
            href="/panel"
            style={{
              backgroundColor: 'var(--color-oro)',
              color: 'var(--color-profundo)',
              padding: '10px 16px',
              borderRadius: '4px',
              fontWeight: '700',
              fontSize: '13px',
              textDecoration: 'none',
              textAlign: 'center',
              fontFamily: 'var(--font-montserrat)',
              marginTop: '0.5rem',
              textTransform: 'uppercase'
            }}
          >
            Área Reservada
          </Link>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .nav-desktop { display: none !important; }
          .nav-hamburger { display: flex !important; }
        }
      `}</style>
    </nav>
  )
}