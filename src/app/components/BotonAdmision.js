'use client'

import { useState } from 'react'

export default function BotonAdmision() {
  const [hovered, setHovered] = useState(false)

  return (
    <div style={{
      backgroundColor: '#1C1C1C',
      borderRadius: '4px',
      padding: '2rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '1.5rem',
      flexWrap: 'wrap'
    }}>
      <div>
        <p style={{ fontSize: '16px', fontWeight: '600', color: '#F5F5F5', marginBottom: '4px' }}>
          ¿Querés saber más?
        </p>
        <p style={{ fontSize: '13px', color: '#9e9b8e' }}>
          Completá el formulario y nos ponemos en contacto con vos.
        </p>
      </div>
      <a
        href="https://docs.google.com/forms/d/e/1FAIpQLScbt7n2DxZOWwH6I0m2zxgibNKu2p9pWVmd5BSe8ZV2d9u8eA/viewform"
        target="_blank"
        rel="noopener noreferrer"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          backgroundColor: hovered ? '#b8891e' : '#CDA434',
          color: '#1C1C1C',
          padding: '10px 24px',
          borderRadius: '4px',
          fontWeight: '600',
          fontSize: '13px',
          textDecoration: 'none',
          whiteSpace: 'nowrap',
          transition: 'background-color 0.2s'
        }}
      >
        Quiero saber más →
      </a>
    </div>
  )
}