'use client'

import { useState } from 'react'

const iconBox = (
  <div style={{
    width: '44px', height: '44px',
    backgroundColor: '#1C1C1C',
    borderRadius: '4px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0
  }}>
  </div>
)

function ContactCard({ href, icon, label, texto, target }) {
  const [hovered, setHovered] = useState(false)
  return (
    <a href={href} target={target} rel={target === '_blank' ? 'noopener noreferrer' : undefined} style={{ textDecoration: 'none' }}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          padding: '1.25rem 1.5rem',
          border: hovered ? '1px solid #CDA434' : '0.5px solid #e0ddd5',
          borderRadius: '4px',
          backgroundColor: hovered ? '#fafaf8' : '#fff',
          transition: 'all 0.2s',
          cursor: 'pointer',
          height: '100%'
        }}
      >
        <div style={{
          width: '44px', height: '44px',
          backgroundColor: '#1C1C1C',
          borderRadius: '4px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0
        }}>
          {icon}
        </div>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>
            {label}
          </p>
          <p style={{ fontSize: '13px', color: '#1C1C1C', wordBreak: 'break-word', margin: 0 }}>
            {texto}
          </p>
        </div>
      </div>
    </a>
  )
}

export default function ContactCards() {
  const iconMail = <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#CDA434" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
  const iconIG = <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#CDA434" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
  const iconForm = <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#CDA434" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
  const iconGL = <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#CDA434" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
      gap: '1rem'
    }}>
      <ContactCard
        href="https://docs.google.com/forms/d/e/1FAIpQLScbt7n2DxZOWwH6I0m2zxgibNKu2p9pWVmd5BSe8ZV2d9u8eA/viewform"
        target="_blank"
        icon={iconForm}
        label="Formulario de contacto"
        texto="Completá nuestro formulario online"
      />
      <ContactCard
        href="https://www.instagram.com/sanitas_sanitatum/"
        target="_blank"
        icon={iconIG}
        label="Instagram"
        texto="Seguinos para estar al tanto de nuestras actividades"
      />
      <ContactCard
        href="mailto:sanitas.sanitatum763@gmail.com"
        icon={iconMail}
        label="Email"
        texto="sanitas.sanitatum763@gmail.com"
      />
      <ContactCard
        href="https://masoneria-argentina.org.ar"
        target="_blank"
        icon={iconGL}
        label="Gran Logia Argentina"
        texto="masoneria-argentina.org.ar"
      />
    </div>
  )
}