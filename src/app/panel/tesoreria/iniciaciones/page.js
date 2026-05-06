'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { CheckCircle2, Phone, Mail, Calendar, CircleDollarSign } from 'lucide-react'

export default function IniciacionesTesoreria() {
  const [candidatos, setCandidatos] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    async function cargarIniciaciones() {
      // Traemos solo a los aprobados que ya tienen fecha fijada
      const { data, error } = await supabase
        .from('candidatos')
        .select('id, nombre, apellido, email, telefono, fecha_iniciacion, derechos_pagados')
        .eq('estado', 'aprobado')
        .not('fecha_iniciacion', 'is', null)
        .order('fecha_iniciacion', { ascending: true })

      if (!error && data) {
        setCandidatos(data)
      }
      setCargando(false)
    }
    cargarIniciaciones()
  }, [])

  const marcarComoPagado = async (id, estadoActual) => {
    const nuevoEstado = !estadoActual
    // Actualizamos la UI al instante
    setCandidatos(prev => prev.map(c => c.id === id ? { ...c, derechos_pagados: nuevoEstado } : c))

    // Guardamos en Supabase
    const { error } = await supabase
      .from('candidatos')
      .update({ derechos_pagados: nuevoEstado })
      .eq('id', id)

    if (error) {
      alert('Error al actualizar el pago.')
      setCandidatos(prev => prev.map(c => c.id === id ? { ...c, derechos_pagados: estadoActual } : c))
    }
  }

  if (cargando) return <p style={{ padding: '2rem', color: 'var(--color-gris)', fontFamily: 'var(--font-montserrat)' }}>Cargando agenda de iniciaciones...</p>

  return (
    <div style={{ maxWidth: '900px', fontFamily: 'var(--font-montserrat)' }}>
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '600', color: 'var(--color-institucional)', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', fontFamily: 'var(--font-baskerville)' }}>
          <CircleDollarSign size={28} color="var(--color-oro)" /> Derechos de Iniciación
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--color-gris)', margin: 0, paddingLeft: '2px' }}>
          Gestión de cobro para profanos con fecha de iniciación fijada por Secretaría.
        </p>
      </div>

      {candidatos.length === 0 ? (
        <div style={{ backgroundColor: '#ffffff', border: '1px dashed #d1d0c8', borderRadius: '12px', padding: '3.5rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--color-gris)', margin: 0, fontSize: '14px' }}>No hay iniciaciones programadas pendientes de gestión.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          {candidatos.map(c => (
            <div 
              key={c.id} 
              style={{ 
                backgroundColor: '#ffffff', 
                border: `1px solid ${c.derechos_pagados ? '#D4EAB6' : 'rgba(207, 181, 59, 0.2)'}`, 
                borderRadius: '12px', 
                padding: '1.5rem 2rem', 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: '1.5rem', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                transition: 'border-color 0.2s, background-color 0.2s'
              }}
            >
              
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--color-institucional)', margin: '0 0 10px', fontFamily: 'var(--font-montserrat)' }}>
                  {c.apellido}, {c.nombre}
                </h3>
                <div style={{ display: 'flex', gap: '18px', fontSize: '13px', color: 'var(--color-gris)', flexWrap: 'wrap' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={14} color="var(--color-oro)" /> Iniciación: <strong style={{ color: 'var(--color-institucional)', fontWeight: '600' }}>{new Date(c.fecha_iniciacion + 'T00:00:00').toLocaleDateString('es-AR')}</strong>
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Phone size={14} color="var(--color-oro)" /> {c.telefono || <span style={{ color: '#ccc', fontStyle: 'italic' }}>Sin tel.</span>}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Mail size={14} color="var(--color-oro)" /> {c.email || <span style={{ color: '#ccc', fontStyle: 'italic' }}>Sin email</span>}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                {c.derechos_pagados ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#4A8516', backgroundColor: '#EAF3DE', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', border: '1px solid #D4EAB6' }}>
                    <CheckCircle2 size={16} /> Derechos Cancelados
                  </span>
                ) : (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#854F0B', backgroundColor: '#FFF4E5', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', border: '1px solid #F3DDBA' }}>
                    Pendiente de Cobro
                  </span>
                )}
                
                <button 
                  onClick={() => marcarComoPagado(c.id, c.derechos_pagados)}
                  style={{ 
                    backgroundColor: c.derechos_pagados ? '#fafaf8' : 'var(--color-institucional)', 
                    color: c.derechos_pagados ? 'var(--color-gris)' : 'var(--color-oro)', 
                    border: c.derechos_pagados ? '1px solid #d1d0c8' : '1px solid var(--color-oro)', 
                    padding: '8px 20px', 
                    borderRadius: '8px', 
                    fontSize: '13px', 
                    fontWeight: '600', 
                    cursor: 'pointer', 
                    transition: 'all 0.2s',
                    boxShadow: c.derechos_pagados ? 'none' : '0 4px 6px rgba(0,0,0,0.05)'
                  }}
                  onMouseOver={e => !c.derechos_pagados && (e.currentTarget.style.backgroundColor = '#111122')}
                  onMouseOut={e => !c.derechos_pagados && (e.currentTarget.style.backgroundColor = 'var(--color-institucional)')}
                >
                  {c.derechos_pagados ? 'Anular Pago' : 'Registrar Pago'}
                </button>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  )
}